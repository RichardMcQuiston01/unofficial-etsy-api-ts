import type { EtsyScope, TokenSet, TokenStore } from "./TokenStore.js";
import { InMemoryTokenStore } from "./TokenStore.js";

const AUTHORIZATION_URL = "https://www.etsy.com/oauth/connect";
const TOKEN_URL = "https://openapi.etsy.com/v3/public/oauth/token";

/** Refresh proactively when the access token is within this many ms of expiring. */
const EXPIRY_BUFFER_MS = 60_000;

/** Matches EtsyClientConfig's default — see docs/ARCHITECTURE.md. */
const DEFAULT_TIMEOUT_MS = 30_000;

/** Truncated so an oversized or unexpected token-endpoint body can't blow up caller log sinks. */
const MAX_ERROR_BODY_LENGTH = 500;

/**
 * Thrown when Etsy issued new tokens but `TokenStore.save` failed. Etsy has
 * already rotated the refresh token, so the previous one is dead: the
 * caller must persist `tokens` (e.g. retry the save) or the grant is lost.
 */
export class TokenSaveError extends Error {
  readonly tokens: TokenSet;

  constructor(tokens: TokenSet, cause: unknown) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    super(
      `EtsyOAuth: Etsy issued new tokens but TokenStore.save failed (${reason}). The previous ` +
        "refresh token is no longer valid; persist the `tokens` property of this error.",
      { cause },
    );
    this.name = "TokenSaveError";
    this.tokens = tokens;
  }
}

export interface PkceChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
}

export interface EtsyOAuthConfig {
  /** Same value as EtsyClientConfig.apiKey — Etsy's keystring doubles as the OAuth client_id. */
  clientId: string;
  /** Same value as EtsyClientConfig.apiKeySecret. Sent as `x-api-key:
   *  <clientId>:<clientSecret>` on token-endpoint requests — required since
   *  Etsy's February 2026 shared-secret enforcement. */
  clientSecret: string;
  redirectUri: string;
  scopes: EtsyScope[];
  /** Defaults to InMemoryTokenStore. */
  tokenStore?: TokenStore;
  /** Injectable fetch implementation; defaults to global fetch. Mirrors
   *  EtsyClientConfig.fetch so the OAuth flow works in the same restricted
   *  environments EtsyHttpClient supports. */
  fetch?: typeof fetch;
  /** Per-request timeout in ms for the token endpoint (exchangeCode/refresh),
   *  applied via AbortSignal.timeout(). Default 30_000. Mirrors
   *  EtsyClientConfig.timeoutMs — without this, a stalled token endpoint
   *  would hang getValidAccessToken() (and everything awaiting the shared
   *  #refreshInFlight promise) indefinitely, regardless of the transport's
   *  own timeout. */
  timeoutMs?: number;
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

/** Refreshes in flight, keyed per store then per refresh token, so every EtsyOAuth sharing a store shares the lock. */
const refreshLocks = new WeakMap<TokenStore, Map<string, Promise<TokenSet>>>();

function toTokenSet(response: EtsyTokenResponse, requestedScopes: EtsyScope[]): TokenSet {
  const candidate = response as Partial<Record<keyof EtsyTokenResponse, unknown>>;
  if (typeof candidate.access_token !== "string" || candidate.access_token === "") {
    throw new Error("Etsy OAuth token response is missing a string `access_token`.");
  }
  if (typeof candidate.refresh_token !== "string" || candidate.refresh_token === "") {
    throw new Error("Etsy OAuth token response is missing a string `refresh_token`.");
  }
  if (
    typeof candidate.expires_in !== "number" ||
    !Number.isFinite(candidate.expires_in) ||
    candidate.expires_in <= 0
  ) {
    throw new Error(
      `Etsy OAuth token response has an invalid \`expires_in\` (${String(candidate.expires_in)}); ` +
        "expected a positive finite number of seconds.",
    );
  }
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt: Date.now() + response.expires_in * 1000,
    scope: response.scope ? (response.scope.split(" ") as EtsyScope[]) : requestedScopes,
  };
}

async function requestToken(
  fetchImpl: typeof fetch,
  apiKeyHeader: string,
  body: Record<string, string>,
  timeoutMs: number,
): Promise<EtsyTokenResponse> {
  const response = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "x-api-key": apiKeyHeader,
    },
    body: new URLSearchParams(body),
    signal: AbortSignal.timeout(timeoutMs),
    // x-api-key is not stripped by fetch on cross-origin redirects; never follow one.
    redirect: "error",
  });

  if (!response.ok) {
    const text = await response.text();
    const truncated =
      text.length > MAX_ERROR_BODY_LENGTH ? `${text.slice(0, MAX_ERROR_BODY_LENGTH)}...` : text;
    throw new Error(`Etsy OAuth token request failed (${response.status}): ${truncated}`);
  }

  return (await response.json()) as EtsyTokenResponse;
}

/** PKCE + OAuth 2.0 authorization-code flow, and rotating token refresh. */
export class EtsyOAuth {
  #clientId: string;
  #clientSecret: string;
  #redirectUri: string;
  #scopes: EtsyScope[];
  #tokenStore: TokenStore;
  #fetch: typeof fetch;
  #timeoutMs: number;

  constructor(config: EtsyOAuthConfig) {
    const fetchImpl = config.fetch ?? globalThis.fetch?.bind(globalThis);
    if (!fetchImpl) {
      throw new Error(
        "EtsyOAuth requires a fetch implementation. Pass one via `fetch` in " +
          "EtsyOAuthConfig, or run in an environment with a global fetch.",
      );
    }

    this.#clientId = config.clientId;
    this.#clientSecret = config.clientSecret;
    this.#redirectUri = config.redirectUri;
    this.#scopes = config.scopes;
    this.#tokenStore = config.tokenStore ?? new InMemoryTokenStore();
    this.#fetch = fetchImpl;
    this.#timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Builds the etsy.com/oauth/connect URL and generates a fresh PKCE pair.
   * Caller is responsible for persisting the verifier and `state` for the
   * callback (e.g. in a session), comparing the callback's `state` to the
   * stored value, and only then passing the verifier to exchangeCode().
   */
  async createAuthorizationUrl(state: string): Promise<{ url: string; pkce: PkceChallenge }> {
    if (state.trim() === "") {
      throw new Error(
        "EtsyOAuth: `state` must be a non-empty random value; a blank state does not bind " +
          "the callback to the session that started the flow.",
      );
    }
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
    const response = await requestToken(
      this.#fetch,
      `${this.#clientId}:${this.#clientSecret}`,
      {
        grant_type: "authorization_code",
        client_id: this.#clientId,
        redirect_uri: this.#redirectUri,
        code,
        code_verifier: codeVerifier,
      },
      this.#timeoutMs,
    );
    return this.#persist(toTokenSet(response, this.#scopes));
  }

  /**
   * Rotates the refresh token; persists the new TokenSet via TokenStore.
   * Single-flight per (store, refresh token): concurrent callers spending the
   * same token share one request. If the store's `save` fails after Etsy has
   * rotated the token, throws TokenSaveError carrying the new tokens.
   */
  refresh(refreshToken: string): Promise<TokenSet> {
    let locks = refreshLocks.get(this.#tokenStore);
    if (!locks) {
      locks = new Map();
      refreshLocks.set(this.#tokenStore, locks);
    }
    const existing = locks.get(refreshToken);
    if (existing) return existing;

    const pending = this.#requestRefresh(refreshToken).finally(() => {
      locks.delete(refreshToken);
    });
    locks.set(refreshToken, pending);
    return pending;
  }

  async #requestRefresh(refreshToken: string): Promise<TokenSet> {
    const response = await requestToken(
      this.#fetch,
      `${this.#clientId}:${this.#clientSecret}`,
      {
        grant_type: "refresh_token",
        client_id: this.#clientId,
        refresh_token: refreshToken,
      },
      this.#timeoutMs,
    );
    return this.#persist(toTokenSet(response, this.#scopes));
  }

  async #persist(tokens: TokenSet): Promise<TokenSet> {
    try {
      await this.#tokenStore.save(tokens);
    } catch (error) {
      throw new TokenSaveError(tokens, error);
    }
    return tokens;
  }

  /**
   * Returns a currently-valid access token, transparently refreshing (and
   * persisting) when within a short expiry window. Called internally by
   * EtsyHttpClient — resource modules never call this directly.
   */
  async getValidAccessToken(): Promise<string> {
    const tokens = await this.#loadTokens();
    if (tokens.expiresAt - Date.now() > EXPIRY_BUFFER_MS) {
      return tokens.accessToken;
    }
    const refreshed = await this.refresh(tokens.refreshToken);
    return refreshed.accessToken;
  }

  /**
   * Called by EtsyHttpClient after Etsy answers 401 to `rejectedAccessToken`.
   * Refreshes unless the store already holds a different (newer) access
   * token, in which case that one is returned without spending the refresh token.
   */
  async refreshAfterRejection(rejectedAccessToken: string): Promise<string> {
    const tokens = await this.#loadTokens();
    if (tokens.accessToken !== rejectedAccessToken) return tokens.accessToken;
    const refreshed = await this.refresh(tokens.refreshToken);
    return refreshed.accessToken;
  }

  async #loadTokens(): Promise<TokenSet> {
    const tokens = await this.#tokenStore.load();
    if (!tokens) {
      throw new Error(
        "EtsyOAuth: no tokens available. Complete the authorization-code flow " +
          "(createAuthorizationUrl -> exchangeCode) before making authenticated requests.",
      );
    }
    return tokens;
  }
}
