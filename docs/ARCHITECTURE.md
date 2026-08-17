# ARCHITECTURE — Stage 0 contract

Owner: **Architect** agent. This is the interfaces-only contract that every
later stage in `ROADMAP.md` builds against. No implementation here — only
type shapes and the conventions Resource Engineers must follow so four
people (or four agents) working in parallel produce a consistent API.

## Locked decisions

Resolved from the ROADMAP's open questions:

| Question        | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime support | Node.js 20+, browsers, and edge runtimes (Workers/Deno/Bun). No Node-only built-ins (`fs`, `http`, etc.) in the core package — platform `fetch` only, injectable for environments that don't provide it globally. Raised from the original "Node.js 18+" during Stage 4: `vitest`/`eslint` (the dev toolchain, not the shipped `dist/` code) require Node ≥20 to even start, so Node 18 CI was silently broken since Stage 1 — no PR had ever actually been validated on Node 18. Rather than downgrade the toolchain, the stated support floor was raised to match what CI can actually verify.                                                                                    |
| Token storage   | Ship the `TokenStore` interface plus a trivial `InMemoryTokenStore` default. No filesystem/DB-backed store in core — stays consumer-provided, per the framework-agnostic goal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Initial version | `0.1.0`. Breaking changes allowed between minors until `1.0.0`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Release scope   | All four Stage 4 resource clusters ship together in `0.1.0` — no staggered release.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Coverage gate   | `vitest.config.ts`'s `coverage.thresholds`: ≥90% (statements/branches/functions/lines) globally on `src/`, 100% on `src/http/**` and `src/auth/**` — the transport and auth layers, where a silent gap is highest-risk. Enforced in CI via `npm run test:coverage` (already a required step for every push/PR against `dev`/`main`); a coverage regression fails the build the same as a lint or type error. Set during Stage 5 once every resource cluster and the transport/auth layers actually reached 100% on all four metrics — the 90% global floor leaves headroom for future additions without being a real gate on `src/http`/`src/auth`, where 100% is enforced exactly. |

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
  /** Per-request timeout in ms, applied via AbortSignal.timeout(). Default
   *  30_000. Each 429 retry gets a fresh timeout window. Added during Stage
   *  3 implementation — the original contract had no cancellation story,
   *  which meant a stalled Etsy response could hang a caller indefinitely. */
  timeoutMs?: number;
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
  /** Injectable fetch implementation; defaults to global fetch. Added
   *  during Stage 3 implementation to match EtsyClientConfig.fetch — the
   *  original contract left the OAuth token endpoint calls tied to
   *  globalThis.fetch, so a consumer in a restricted environment could
   *  construct an EtsyHttpClient but not complete the OAuth flow. */
  fetch?: typeof fetch;
  /** Per-request timeout in ms for the token endpoint (exchangeCode/refresh),
   *  applied via AbortSignal.timeout(). Default 30_000, matching
   *  EtsyClientConfig.timeoutMs. Added during pre-release hardening — without
   *  it, a stalled token endpoint would hang getValidAccessToken() (and
   *  everything awaiting the shared in-flight refresh) indefinitely,
   *  regardless of the transport's own timeout. */
  timeoutMs?: number;
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
   *  EtsyHttpClient — resource modules never call this directly. Concurrent
   *  calls that land during a refresh share a single in-flight refresh()
   *  rather than each spending the (rotating) refresh token — a second
   *  refresh() with an already-consumed refresh token would fail. */
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
  /** Caller-provided cancellation, combined with EtsyClientConfig.timeoutMs.
   *  Added during Stage 3 implementation alongside timeoutMs. */
  signal?: AbortSignal;
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
 *  advancing offset by the page size until a short page is returned.
 *  Rejects with RangeError on the first iteration (the first `next()` or
 *  `for await` step, since `paginate()` itself returns an async generator
 *  without running any body yet) for a non-positive limit or a negative
 *  offset — a limit <= 0 can never satisfy the short-page termination
 *  check, which would otherwise loop forever. */
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

## Release process (Stage 7)

Versioning and publishing use [Changesets](https://github.com/changesets/changesets)
(`.changeset/config.json`: `baseBranch: "dev"`, `access: "public"`). A
contributor records a changeset (`npm run changeset`) alongside a PR when the
change is user-facing; `npm run version-packages` (run manually, ahead of a
release) consumes pending changesets to bump `package.json` and append to
`CHANGELOG.md`.

Publishing is a separate, explicit step from merging to `dev`/`main`:
`.github/workflows/release.yml` triggers only on a `vX.Y.Z` tag push, re-runs
the full CI toolchain as a safety gate, verifies the tag matches
`package.json`'s version, then runs `npm publish --provenance --access public`
(provenance requires the workflow's `id-token: write` permission and npm's
trusted-publishing OIDC flow) using an `NPM_TOKEN` repo secret. No workflow
publishes automatically on a branch push — a release is always a deliberate
tag push by a maintainer.

`package.json`'s `publishConfig` (`access: "public"`, `provenance: true`)
means a manual `npm publish` from a maintainer's machine defaults to the same
flags, so the tag-push workflow and a manual publish can't accidentally
diverge in visibility/provenance.

Verified before this was considered done (Stage 7 exit criteria): `npm pack
--dry-run` produces exactly `LICENSE`, `README.md`, `package.json`, and
`dist/**` (9 files, ~158KB packed / ~1.5MB unpacked — the `.d.ts`/`.d.cts`
size is dominated by the full generated operation/schema type surface, which
is expected for an OpenAPI-derived SDK); a packed tarball installs cleanly
into three scratch consumer projects and resolves correctly via `import`
(ESM), `require` (CJS), and TypeScript's `NodeNext` module resolution.

## Documentation (Stage 6)

`README.md` covers Prerequisites/Installation/Adding to Project/Examples
(quickstarts for both auth modes). `docs/guides/{listings,catalog,shop,commerce}.md`
are per-cluster usage guides — every example in them is checked against the
actual generated request/response types before being written, not
freehand. `typedoc.json` generates the full API reference from
`src/index.ts`'s public exports (`npm run docs:api`, output to `docs/api/`,
gitignored — a build artifact, not committed); `.github/workflows/docs.yml`
deploys it to GitHub Pages on push to `main` (requires Pages enabled once
under repo settings, a manual step like `NPM_TOKEN`).

While wiring up TypeDoc, it surfaced that `CatalogResource`'s four
sub-resource classes (`ListingInventoryResource`, `SellerTaxonomyResource`,
`BuyerTaxonomyResource`, `ReviewsResource`) weren't exported from
`src/resources/catalog/index.ts` or re-exported from `src/index.ts`,
unlike every other cluster's sub-resources — an inconsistency from Stage 4
that TypeDoc's cross-reference warnings caught. Fixed to match the
established pattern. Also exported `UploadListingFileRequestBody`/
`UploadListingImageRequestBody`/`UploadListingVideoRequestBody` from
`src/index.ts` (previously internal-only) — the documented binary-upload
workaround (`{ file: blob, ... } as unknown as UploadListing*RequestBody`,
per PR #11's original note) requires importing the type by name, which
was impossible without this.

## Sign-off gate

Every Stage 4 resource-cluster PR is reviewed against this document before
merge — specifically: does every new method go through `EtsyHttpClient`,
does its naming follow the convention above, and does its signature use
generated types from `src/generated/operations.ts` rather than hand-rolled
duplicates. Stage 2 (Codegen) and Stage 3 (Platform Engineer/core
transport) block all of Stage 4 until both land, since every resource
method needs generated types and a working `EtsyHttpClient` to call.
