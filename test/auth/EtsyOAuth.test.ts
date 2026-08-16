import { afterEach, describe, expect, it, vi } from "vitest";
import { EtsyOAuth } from "../../src/auth/EtsyOAuth.js";
import { InMemoryTokenStore, type TokenSet, type TokenStore } from "../../src/auth/TokenStore.js";

// Independently computed via Node's `crypto` module (SHA-256 + base64url) —
// a different implementation path than the Web Crypto `subtle.digest()`
// call under test, so this is real cross-validation, not a circular
// self-check. For each fixed byte array (standing in for
// crypto.getRandomValues' output), `verifier` is base64url(bytes) and
// `challenge` is base64url(SHA256(verifier)), per RFC 7636 S256.
const PKCE_VECTORS: { randomBytes: number[]; verifier: string; challenge: string }[] = [
  {
    randomBytes: Array.from({ length: 32 }, (_, i) => i),
    verifier: "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8",
    challenge: "6oZqdX5MOLq_qBJ8vppAnT4fk6AP8UiP9zX8-Rev_9A",
  },
  {
    randomBytes: Array.from({ length: 32 }, (_, i) => (i * 7 + 3) % 256),
    verifier: "AwoRGB8mLTQ7QklQV15lbHN6gYiPlp2kq7K5wMfO1dw",
    challenge: "Ucth0C-OcYdc4s8JT_o3Lll7KsfpNlpYmwObmzH89UA",
  },
  {
    randomBytes: Array.from({ length: 32 }, () => 255),
    verifier: "__________________________________________8",
    challenge: "Il9-dTKd1FqjVJddc5hzGTCTk686TGczvBNgGk8bh5Y",
  },
];

function makeOAuth(tokenStore: TokenStore = new InMemoryTokenStore()) {
  return new EtsyOAuth({
    clientId: "test-client-id",
    redirectUri: "https://example.com/callback",
    scopes: ["listings_r", "listings_w"],
    tokenStore,
  });
}

describe("EtsyOAuth PKCE", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("derives the S256 code_verifier/code_challenge correctly for known random-byte vectors", async () => {
    const oauth = makeOAuth();
    for (const { randomBytes, verifier, challenge } of PKCE_VECTORS) {
      vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementationOnce((array) => {
        (array as Uint8Array).set(randomBytes);
        return array;
      });

      const { pkce } = await oauth.createAuthorizationUrl("state");
      expect(pkce.codeVerifier).toBe(verifier);
      expect(pkce.codeChallenge).toBe(challenge);
      expect(pkce.codeChallengeMethod).toBe("S256");
    }
  });

  it("generates a fresh, sufficiently random code_verifier each call", async () => {
    const oauth = makeOAuth();
    const first = await oauth.createAuthorizationUrl("state1");
    const second = await oauth.createAuthorizationUrl("state2");
    expect(first.pkce.codeVerifier).not.toBe(second.pkce.codeVerifier);
    expect(first.pkce.codeVerifier.length).toBeGreaterThanOrEqual(43);
  });

  it("builds an authorization URL with response_type, client_id, redirect_uri, scope, state, and code_challenge", async () => {
    const oauth = makeOAuth();
    const { url, pkce } = await oauth.createAuthorizationUrl("xyz-state");
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe("https://www.etsy.com/oauth/connect");
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("client_id")).toBe("test-client-id");
    expect(parsed.searchParams.get("redirect_uri")).toBe("https://example.com/callback");
    expect(parsed.searchParams.get("scope")).toBe("listings_r listings_w");
    expect(parsed.searchParams.get("state")).toBe("xyz-state");
    expect(parsed.searchParams.get("code_challenge")).toBe(pkce.codeChallenge);
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
  });
});

describe("EtsyOAuth token exchange and refresh", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("exchangeCode posts the authorization_code grant and persists the resulting TokenSet", async () => {
    const tokenStore: TokenStore = new InMemoryTokenStore();
    const oauth = makeOAuth(tokenStore);

    const fetchMock = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      const body = new URLSearchParams(init?.body as string);
      expect(body.get("grant_type")).toBe("authorization_code");
      expect(body.get("client_id")).toBe("test-client-id");
      expect(body.get("code")).toBe("auth-code-123");
      expect(body.get("code_verifier")).toBe("verifier-abc");
      return new Response(
        JSON.stringify({
          access_token: "access-1",
          refresh_token: "refresh-1",
          token_type: "Bearer",
          expires_in: 3600,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const tokens = await oauth.exchangeCode("auth-code-123", "verifier-abc");

    expect(tokens.accessToken).toBe("access-1");
    expect(tokens.refreshToken).toBe("refresh-1");
    expect(tokens.scope).toEqual(["listings_r", "listings_w"]);
    expect(await tokenStore.load()).toEqual(tokens);
  });

  it("getValidAccessToken returns the cached token when far from expiry", async () => {
    const tokenStore: TokenStore = new InMemoryTokenStore();
    const fresh: TokenSet = {
      accessToken: "still-valid",
      refreshToken: "refresh-x",
      expiresAt: Date.now() + 55 * 60 * 1000, // 55 minutes out
      scope: ["listings_r"],
    };
    await tokenStore.save(fresh);
    const oauth = makeOAuth(tokenStore);

    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const token = await oauth.getValidAccessToken();

    expect(token).toBe("still-valid");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("getValidAccessToken proactively refreshes an expired token and persists the rotated refresh token", async () => {
    const tokenStore: TokenStore = new InMemoryTokenStore();
    const expired: TokenSet = {
      accessToken: "old-access",
      refreshToken: "old-refresh",
      expiresAt: Date.now() - 1000, // already expired
      scope: ["listings_r"],
    };
    await tokenStore.save(expired);
    const oauth = makeOAuth(tokenStore);

    const fetchMock = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      const body = new URLSearchParams(init?.body as string);
      expect(body.get("grant_type")).toBe("refresh_token");
      expect(body.get("refresh_token")).toBe("old-refresh");
      return new Response(
        JSON.stringify({
          access_token: "new-access",
          refresh_token: "new-refresh", // rotated
          token_type: "Bearer",
          expires_in: 3600,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const token = await oauth.getValidAccessToken();

    expect(token).toBe("new-access");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const persisted = await tokenStore.load();
    expect(persisted?.refreshToken).toBe("new-refresh");
  });

  it("getValidAccessToken throws when no tokens have been stored yet", async () => {
    const oauth = makeOAuth();
    await expect(oauth.getValidAccessToken()).rejects.toThrow(/no tokens available/i);
  });

  it("surfaces a clear error when the token endpoint rejects the request", async () => {
    const oauth = makeOAuth();
    const fetchMock = vi.fn(
      async () => new Response("invalid_grant: code already used", { status: 400 }),
    );
    globalThis.fetch = fetchMock;

    await expect(oauth.exchangeCode("bad-code", "verifier")).rejects.toThrow(
      /token request failed \(400\).*invalid_grant/is,
    );
  });
});
