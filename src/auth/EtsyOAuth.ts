import type { EtsyScope, TokenSet, TokenStore } from "./TokenStore.js";
import { InMemoryTokenStore } from "./TokenStore.js";

const AUTHORIZATION_URL = "https://www.etsy.com/oauth/connect";
const TOKEN_URL = "https://openapi.etsy.com/v3/public/oauth/token";

/** Refresh proactively when the access token is within this many ms of expiring. */
const EXPIRY_BUFFER_MS = 60_000;

export interface PkceChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
}

export interface EtsyOAuthConfig {
  /** Same value as EtsyClientConfig.apiKey — Etsy's keystring doubles as the OAuth client_id. */
  clientId: string;
  redirectUri: string;
  scopes: EtsyScope[];
  /** Defaults to InMemoryTokenStore. */
  tokenStore?: TokenStore;
}

interface EtsyTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  /** Not guaranteed by Etsy's token endpoint; fall back to the requested scopes when absent. */
  scope?: string;
}

function requireWebCrypto(): Crypto {
  if (typeof globalThis.crypto?.subtle === "undefined") {
    throw new Error(
      "EtsyOAuth requires the Web Crypto API (globalThis.crypto.subtle), which is unavailable " +
        "in this environment. Node.js 18+, browsers, and edge runtimes all provide it globally.",
    );
  }
  return globalThis.crypto;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  requireWebCrypto().getRandomValues(bytes);
  return toBase64Url(bytes);
}

/**
 * RFC 7636 S256: code_challenge = BASE64URL(SHA256(code_verifier)).
 * SubtleCrypto.digest() is inherently async, which is why
 * createAuthorizationUrl() below returns a Promise (see docs/ARCHITECTURE.md,
 * amended from its original synchronous signature for exactly this reason).
 */
async function deriveCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await requireWebCrypto().subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );
  return toBase64Url(new Uint8Array(digest));
}

function toTokenSet(response: EtsyTokenResponse, requestedScopes: EtsyScope[]): TokenSet {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt: Date.now() + response.expires_in * 1000,
    scope: response.scope ? (response.scope.split(" ") as EtsyScope[]) : requestedScopes,
  };
}

async function requestToken(body: Record<string, string>): Promise<EtsyTokenResponse> {
  const fetchImpl = globalThis.fetch;
  if (!fetchImpl) {
    throw new Error("EtsyOAuth requires a global fetch implementation, which is unavailable here.");
  }

  const response = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Etsy OAuth token request failed (${response.status}): ${text}`);
  }

  return (await response.json()) as EtsyTokenResponse;
}

/** PKCE + OAuth 2.0 authorization-code flow, and rotating token refresh. */
export class EtsyOAuth {
  #clientId: string;
  #redirectUri: string;
  #scopes: EtsyScope[];
  #tokenStore: TokenStore;

  constructor(config: EtsyOAuthConfig) {
    this.#clientId = config.clientId;
    this.#redirectUri = config.redirectUri;
    this.#scopes = config.scopes;
    this.#tokenStore = config.tokenStore ?? new InMemoryTokenStore();
  }

  /**
   * Builds the etsy.com/oauth/connect URL and generates a fresh PKCE pair.
   * Caller is responsible for persisting the verifier for the callback
   * (e.g. in a session) and passing it to exchangeCode().
   */
  async createAuthorizationUrl(state: string): Promise<{ url: string; pkce: PkceChallenge }> {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await deriveCodeChallenge(codeVerifier);

    const url = new URL(AUTHORIZATION_URL);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", this.#clientId);
    url.searchParams.set("redirect_uri", this.#redirectUri);
    url.searchParams.set("scope", this.#scopes.join(" "));
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");

    return {
      url: url.toString(),
      pkce: { codeVerifier, codeChallenge, codeChallengeMethod: "S256" },
    };
  }

  /**
   * Exchanges an authorization code for a TokenSet; persists via TokenStore.
   */
  async exchangeCode(code: string, codeVerifier: string): Promise<TokenSet> {
    const response = await requestToken({
      grant_type: "authorization_code",
      client_id: this.#clientId,
      redirect_uri: this.#redirectUri,
      code,
      code_verifier: codeVerifier,
    });
    const tokens = toTokenSet(response, this.#scopes);
    await this.#tokenStore.save(tokens);
    return tokens;
  }

  /** Rotates the refresh token; persists the new TokenSet via TokenStore. */
  async refresh(refreshToken: string): Promise<TokenSet> {
    const response = await requestToken({
      grant_type: "refresh_token",
      client_id: this.#clientId,
      refresh_token: refreshToken,
    });
    const tokens = toTokenSet(response, this.#scopes);
    await this.#tokenStore.save(tokens);
    return tokens;
  }

  /**
   * Returns a currently-valid access token, transparently refreshing (and
   * persisting) when within a short expiry window. Called internally by
   * EtsyHttpClient — resource modules never call this directly.
   */
  async getValidAccessToken(): Promise<string> {
    const tokens = await this.#tokenStore.load();
    if (!tokens) {
      throw new Error(
        "EtsyOAuth: no tokens available. Complete the authorization-code flow " +
          "(createAuthorizationUrl -> exchangeCode) before making authenticated requests.",
      );
    }
    if (tokens.expiresAt - Date.now() > EXPIRY_BUFFER_MS) {
      return tokens.accessToken;
    }
    const refreshed = await this.refresh(tokens.refreshToken);
    return refreshed.accessToken;
  }
}
