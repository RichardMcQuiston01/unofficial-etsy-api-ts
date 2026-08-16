# ARCHITECTURE — Stage 0 contract

Owner: **Architect** agent. This is the interfaces-only contract that every
later stage in `ROADMAP.md` builds against. No implementation here — only
type shapes and the conventions Resource Engineers must follow so four
people (or four agents) working in parallel produce a consistent API.

## Locked decisions

Resolved from the ROADMAP's open questions:

| Question        | Decision                                                                                                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime support | Node.js 18+, browsers, and edge runtimes (Workers/Deno/Bun). No Node-only built-ins (`fs`, `http`, etc.) in the core package — platform `fetch` only, injectable for environments that don't provide it globally. |
| Token storage   | Ship the `TokenStore` interface plus a trivial `InMemoryTokenStore` default. No filesystem/DB-backed store in core — stays consumer-provided, per the framework-agnostic goal.                                    |
| Initial version | `0.1.0`. Breaking changes allowed between minors until `1.0.0`.                                                                                                                                                   |
| Release scope   | All four Stage 4 resource clusters ship together in `0.1.0` — no staggered release.                                                                                                                               |

Consequence for Stage 1 (scaffolding): no `fs`/`node:*` imports outside of
optional, separately-exported entry points (if any are ever added later —
none are planned for `0.1.0`).

## Package entry shape

```
src/
  index.ts                 # public exports: createEtsyClient, types, errors
  client.ts                 # EtsyClient facade + createEtsyClient()
  http/
    EtsyHttpClient.ts        # transport: fetch wrapper, auth injection, rate-limit tracking, retry
    EtsyApiError.ts
    pagination.ts
  auth/
    EtsyOAuth.ts             # PKCE + token exchange/refresh
    TokenStore.ts            # interface + InMemoryTokenStore
  generated/
    schemas.ts               # codegen output: 81 OpenAPI schemas -> TS types
    operations.ts             # codegen output: per-operationId param/request/response types
  resources/
    listings/                # Cluster 1: ShopListing + File/Image/Video/VariationImage/Translation/Personalization
    catalog/                 # Cluster 2: Inventory/Product/Offering, SellerTaxonomy, BuyerTaxonomy, Review
    shop/                     # Cluster 3: Shop, Section, ShippingProfile, ReturnPolicy, ProcessingProfiles, HolidayPreferences, ProductionPartner
    commerce/                 # Cluster 4: Receipt, Receipt Transactions, Payment, Ledger Entry, User, UserAddress, Other
```

Codegen (Stage 2) only ever writes to `src/generated/**`. Nothing outside
that directory is regenerated or hand-edited by the codegen script.

## Core types

### Configuration

```ts
interface EtsyClientConfig {
  /** Etsy "keystring" — sent as x-api-key and doubles as the OAuth client_id. */
  apiKey: string;
  /** Injectable fetch implementation; defaults to global fetch. Required in
   *  environments without one. */
  fetch?: typeof fetch;
  /** Defaults to "https://openapi.etsy.com". Override for testing. */
  baseUrl?: string;
  /** Omit for API-key-only usage (32 public operations). Required for the
   *  73 operations that need OAuth scopes. */
  auth?: EtsyOAuth;
  retry?: RetryConfig;
}

interface RetryConfig {
  /** Retries on 429 only, honoring Retry-After. Default 3. */
  maxRetries?: number;
  /** Cap on backoff delay in ms. Default 30_000. */
  maxBackoffMs?: number;
}
```

### Auth (`src/auth`)

```ts
type EtsyScope =
  | "address_r"
  | "address_w"
  | "email_r"
  | "listings_d"
  | "listings_r"
  | "listings_w"
  | "profile_r"
  | "profile_w"
  | "shops_r"
  | "shops_w"
  | "transactions_r"
  | "transactions_w";

interface TokenSet {
  accessToken: string;
  /** Rotates on every refresh — always persist the value returned from refresh(). */
  refreshToken: string;
  /** Epoch ms. Access tokens live 1 hour from issuance. */
  expiresAt: number;
  scope: EtsyScope[];
}

interface TokenStore {
  load(): Promise<TokenSet | null> | TokenSet | null;
  save(tokens: TokenSet): Promise<void> | void;
}

/** Default TokenStore. No persistence across process restarts by design —
 *  consumers needing durability provide their own TokenStore. */
declare class InMemoryTokenStore implements TokenStore {}

interface PkceChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
}

interface EtsyOAuthConfig {
  /** Same value as EtsyClientConfig.apiKey. */
  clientId: string;
  redirectUri: string;
  scopes: EtsyScope[];
  /** Defaults to InMemoryTokenStore. */
  tokenStore?: TokenStore;
}

declare class EtsyOAuth {
  constructor(config: EtsyOAuthConfig);
  /** Builds the etsy.com/oauth/connect URL and generates a fresh PKCE pair.
   *  Caller is responsible for persisting the verifier for the callback.
   *  Async because deriving the S256 code_challenge requires
   *  SubtleCrypto.digest(), which has no synchronous form (amended during
   *  Stage 3 implementation — the original draft of this contract declared
   *  this method synchronous, which turned out to be impossible to satisfy
   *  without either using the weaker "plain" PKCE method or hand-rolling
   *  SHA-256 instead of using the platform's Web Crypto API). */
  createAuthorizationUrl(state: string): Promise<{ url: string; pkce: PkceChallenge }>;
  /** Exchanges an authorization code for a TokenSet; persists via TokenStore. */
  exchangeCode(code: string, codeVerifier: string): Promise<TokenSet>;
  /** Rotates the refresh token; persists the new TokenSet via TokenStore. */
  refresh(refreshToken: string): Promise<TokenSet>;
  /** Returns a currently-valid access token, transparently refreshing (and
   *  persisting) when within a short expiry window. Called internally by
   *  EtsyHttpClient — resource modules never call this directly. */
  getValidAccessToken(): Promise<string>;
}
```

### Errors & rate limits (`src/http`)

```ts
interface RateLimitSnapshot {
  limitPerDay?: number;
  remainingToday?: number;
  limitPerSecond?: number;
  remainingThisSecond?: number;
}

declare class EtsyApiError extends Error {
  readonly status: number;
  /** The `error` field from Etsy's ErrorSchema body. */
  readonly etsyError: string;
  readonly rateLimit?: RateLimitSnapshot;
  /** operationId of the call that failed, for debugging/logging. */
  readonly operationId?: string;
}
```

`EtsyApiError` is the **only** error type resource methods throw for
non-2xx responses. Network/transport failures are rethrown as-is (not
wrapped), so consumers can distinguish "Etsy said no" from "the request
never completed."

### Transport (`src/http/EtsyHttpClient.ts`)

```ts
type RequestBody =
  | { kind: "json"; data: unknown }
  | { kind: "form"; data: Record<string, unknown> } // x-www-form-urlencoded
  | { kind: "multipart"; data: Record<string, unknown> }; // file/image/video upload

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Template path, e.g. "/v3/application/shops/{shop_id}/listings". */
  path: string;
  pathParams?: Record<string, string | number>;
  query?: Record<string, string | number | boolean | Array<string | number> | undefined>;
  body?: RequestBody;
  /** "apiKey" for the 32 public operations; "oauth" for the 73 that need a
   *  scope. Determines whether EtsyHttpClient calls auth.getValidAccessToken(). */
  auth: "apiKey" | "oauth";
  /** For error attribution and future request-level telemetry. */
  operationId: string;
}

declare class EtsyHttpClient {
  constructor(config: EtsyClientConfig);
  request<T>(options: RequestOptions): Promise<T>;
  /** Most recent rate-limit snapshot seen from any response. */
  getLastRateLimit(): RateLimitSnapshot | undefined;
}
```

Retry policy: only `429` is retried, honoring `Retry-After` when present
and falling back to exponential backoff capped at `RetryConfig.maxBackoffMs`.
`500`/`503` are surfaced as `EtsyApiError`, not retried automatically —
resource-level retries are a consumer decision.

Array query params (`listing_ids`, `production_partner_ids`, etc.) and
array form fields (`materials`, `tags`) are serialized as **comma-joined
strings**, matching every array parameter observed in the OpenAPI spec
(none declare an explicit `style`/`explode`, so Etsy's default applies).
Resource Engineers do not hand-roll this — `EtsyHttpClient.request()` does
it once, centrally.

### Pagination (`src/http/pagination.ts`)

```ts
interface PaginationParams {
  limit?: number;
  offset?: number;
}

interface PaginatedResult<T> {
  count: number;
  results: T[];
}

/** Wraps any list endpoint into an async iterator over individual items,
 *  advancing offset by the page size until a short page is returned. */
declare function paginate<T>(
  fetchPage: (params: PaginationParams) => Promise<PaginatedResult<T>>,
  start?: PaginationParams,
): AsyncIterable<T>;
```

## Resource module conventions

Each Resource Engineer's cluster is a plain class exposing one method per
`operationId` in that cluster — no shared base class, just the convention
below, so Codegen-generated types (`src/generated/operations.ts`) plug in
directly as method parameter/return types.

- **Naming**: strip the tag's redundant prefix and verb-lead the rest,
  camelCase. `getListingsByShop` (tag `ShopListing`) → `listings.getByShop(shopId, params?)`.
  `createShopShippingProfile` → `shop.shippingProfiles.create(shopId, body)`.
  When a tag has sub-resources (e.g. `ShopListing File`), nest a property:
  `listings.files.upload(shopId, listingId, body)`.
- **Signature order**: path params in the order they appear in the URL,
  then a single `body` object (for writes) or `params` object (for
  query/filter args on reads). Never a positional params list beyond path
  segments.
- **Return types**: exactly the generated response type for that
  `operationId` — no hand-added fields, no unwrapping `results` arrays
  (callers get the raw Etsy response shape; `paginate()` is opt-in sugar
  on top, not baked into every list method).
- **No resource method calls `fetch` directly** — always through the
  `EtsyHttpClient` instance the facade constructs and injects.

## Facade (`src/client.ts`)

```ts
interface EtsyClient {
  readonly http: EtsyHttpClient;
  readonly auth?: EtsyOAuth;
  listings: ListingsResource; // Cluster 1
  catalog: CatalogResource; // Cluster 2
  shop: ShopResource; // Cluster 3
  commerce: CommerceResource; // Cluster 4
}

declare function createEtsyClient(config: EtsyClientConfig): EtsyClient;
```

`createEtsyClient` is the package's single public entry point for
constructing a client. Resource classes are also individually exported
from `src/index.ts` for consumers who want to construct a narrower client
by hand, but `createEtsyClient` is the documented, default path.

## Sign-off gate

Every Stage 4 resource-cluster PR is reviewed against this document before
merge — specifically: does every new method go through `EtsyHttpClient`,
does its naming follow the convention above, and does its signature use
generated types from `src/generated/operations.ts` rather than hand-rolled
duplicates. Stage 2 (Codegen) and Stage 3 (Platform Engineer/core
transport) block all of Stage 4 until both land, since every resource
method needs generated types and a working `EtsyHttpClient` to call.
