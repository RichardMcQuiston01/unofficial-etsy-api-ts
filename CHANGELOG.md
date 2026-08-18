# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `src/http/EtsyHttpClient.ts`: retry-backoff `sleep()` between 429 retries
  is now abortable via the caller's `AbortSignal`, so cancelling mid-backoff
  no longer waits out the full delay (up to `maxBackoffMs`, default 30s).
- `src/http/EtsyHttpClient.ts`: `EtsyApiError`'s `rateLimit` now prefers the
  failing response's own rate-limit snapshot over the persisted
  cross-request one, which could otherwise be stale.
- `src/http/EtsyHttpClient.ts`: `buildMultipartBody` now wraps
  `ArrayBuffer`/typed-array (`Uint8Array`, `Buffer`, `DataView`) values in a
  `Blob`, instead of only accepting pre-constructed `Blob` instances — fixes
  multipart uploads for Node callers reading files with `fs.readFile`.
- `src/http/pagination.ts`: `paginate()` now also stops once the running
  offset reaches the endpoint's reported `count`, as a defensive upper
  bound alongside the existing short-page check, for endpoints that keep
  returning full pages past the reported total.
- `src/auth/EtsyOAuth.ts`: the token endpoint (`exchangeCode`/`refresh`) now
  has a per-request timeout (`EtsyOAuthConfig.timeoutMs`, default 30s,
  matching `EtsyClientConfig.timeoutMs`) and truncates oversized error
  response bodies before including them in the thrown error.
- GitHub Actions workflows (`ci.yml`, `release.yml`, `docs.yml`): checkout
  steps now set `persist-credentials: false`; `docs.yml`'s Pages
  permissions are scoped to the `deploy` job instead of the whole workflow.
- `.gitignore`: broadened the `.env*` pattern (with a `!.env.example`
  exception) instead of listing specific env-file variants individually.
- Stale documentation fixes: `ROADMAP.md`'s Node version note, `docs/guides/{listings,commerce}.md`'s
  `auth` placeholder wording, `docs/ARCHITECTURE.md`'s `paginate()` doc
  comment, and a README grammar fix.
- `ListingFilesResource.upload`/`ListingImagesResource.upload`/`ListingVideosResource.upload`
  now take a dedicated `UploadListing{File,Image,Video}Input` type (the
  generated request-body type with its binary field corrected from
  `string | null` to `Blob | null`) instead of the raw generated type, so
  callers no longer need an `as unknown as UploadListing*RequestBody` cast
  — see `docs/guides/listings.md`.
- `scripts/codegen.ts`: the `AUTO-GENERATED from docs/<file>` banner now
  names the actual spec file `findLatestSpecFile()` selected, instead of
  `spec.info.version` — the two could diverge if a future spec update ships
  under a new filename without bumping the internal version. `test/codegen.test.ts`
  now resolves the same highest-semver spec file instead of hardcoding
  `docs/3.0.0.json`.
- `CHANGELOG.md`'s `[0.1.0]` entry: corrected two stale notes left over from
  Stage 1 (`engines.node >=18`, Node 18 in CI) to match the released
  `>=20` configuration.
- `ROADMAP.md`: Stage 7/8/9 exit criteria no longer describe a
  `0.1.0-beta.x` pre-release tag or an already-cut `1.0.0` — no beta tag
  was ever pushed, and `0.1.0` publishes directly.
- `test/package.test.ts`: the `package.json` version assertion is now a
  fully-anchored semver check (`/^0\.1\.(0|[1-9]\d*)$/`) instead of an
  unanchored prefix match, which accepted malformed values like
  `0.1.0garbage` or `0.1.01`.

Reviewed and rejected as incorrect: an automated finding that
`createReceiptShipment` should use form-encoding instead of JSON — the
vendored OpenAPI spec (`docs/3.0.0.json`) confirms `application/json` is
the correct encoding, matching the existing implementation.

## [0.1.0] - 2026-08-17

### Added

- Project scaffolding: `package.json` (dual ESM/CJS build via `tsup`,
  `exports` map, `engines.node >=20`), `tsconfig.json`, ESLint 10 flat
  config (`typescript-eslint`), Prettier, Vitest with coverage, and a
  `.gitignore`.
- GitHub Actions CI workflow running format/lint/typecheck/test/build on
  Node 20/22 for every push and PR against `dev`/`main`.
- `ROADMAP.md`: multi-agent, multi-stage plan for building the package.
- `docs/ARCHITECTURE.md`: Stage 0 interfaces-only contract (client config,
  transport, auth/OAuth2+PKCE, error/rate-limit types, resource module
  conventions) that later stages build against.
- README: "Buy Me a Coffee" donation section.
- `donate.svg`: QR code linking to the Stripe donation URL, generated
  with segno.
- `scripts/codegen.ts`: generates `src/generated/openapi.ts` (raw
  `openapi-typescript` output), `src/generated/schemas.ts` (one type
  alias per OpenAPI schema, 81 today), and `src/generated/operations.ts`
  (`<OperationId>Params` / `RequestBody` / `Response` types, 105
  operations today) from `docs/<version>.json`. Picks the highest-semver
  spec file present, so a new Etsy spec version is a drop-in file
  replace plus a rerun. Output is deterministic/idempotent and
  Prettier-formatted on write.
- `npm run codegen` script and test coverage (`test/codegen.test.ts`)
  asserting every schema and operationId in the spec has a
  corresponding generated export.
- Core transport and auth (Stage 3, `docs/ARCHITECTURE.md`):
  - `src/http/EtsyHttpClient.ts`: `fetch`-based transport. Injects
    `x-api-key` on every request and an OAuth bearer token for
    operations that need one; serializes JSON/form/multipart request
    bodies (array fields comma-joined, per the spec); tracks the most
    recent rate-limit snapshot (`x-limit-per-day`,
    `x-remaining-today`, `x-limit-per-second`,
    `x-remaining-this-second`); retries `429` only, honoring
    `Retry-After` with a capped exponential-backoff fallback; maps
    every other non-2xx response to `EtsyApiError`.
  - `src/http/EtsyApiError.ts`, `src/http/pagination.ts`
    (`paginate()`, a `limit`/`offset` list endpoint → `AsyncIterable`
    helper).
  - `src/auth/EtsyOAuth.ts`: OAuth 2.0 authorization-code flow with
    PKCE (S256, via the Web Crypto API — no Node-only `crypto`
    import), token exchange, and rotating refresh with proactive
    renewal before expiry.
  - `src/auth/TokenStore.ts`: `TokenStore` interface plus the default
    `InMemoryTokenStore`.
  - `src/config.ts`: `EtsyClientConfig` / `RetryConfig`, shared by the
    transport and the not-yet-built client facade.
  - Test suites (`test/http/`, `test/auth/`): happy-path requests,
    429-retry (including exhaustion), proactive expired-token
    refresh, rotating refresh-token persistence, request-body
    encoding (form/JSON/multipart), error mapping, and PKCE
    code_verifier/code_challenge derivation checked against
    independently-computed (Node `crypto`, a different implementation
    path than the Web Crypto API under test) known vectors. 97%+
    statement / 100% function coverage on the new code.
- `src/resources/catalog/index.ts`: `CatalogResource` (Stage 4 resource
  cluster — Inventory & Catalog), covering all 11 `ShopListing
Inventory`/`Product`/`Offering`, `SellerTaxonomy`, `BuyerTaxonomy`, and
  `Review` operations, grouped as `catalog.inventory`,
  `catalog.sellerTaxonomy`, `catalog.buyerTaxonomy`, `catalog.reviews`,
  plus `catalog.getProduct()`/`getOffering()` for the two single-operation
  tags. Every method routes through `EtsyHttpClient`, using the exact
  generated `<OperationId>Params`/`RequestBody`/`Response` types per
  `docs/ARCHITECTURE.md`'s resource module conventions. Smoke tests in
  `test/resources/catalog/catalog.test.ts` cover all 11 operations.
- `src/resources/shop/`: `ShopResource` (Stage 4 resource cluster — Shop
  Configuration), covering all 37 `Shop`/`Shop Section`/
  `Shop ShippingProfile`/`Shop Return Policy`/`Shop ProcessingProfiles`/
  `Shop HolidayPreferences`/`Shop ProductionPartner` operations, grouped
  as `shop.sections`, `shop.shippingProfiles` (nesting `.destinations`
  and `.upgrades`), `shop.returnPolicies`, `shop.processingProfiles`,
  `shop.holidayPreferences`, `shop.productionPartners`, plus top-level
  `Shop` tag methods (`get`/`update`/`getByOwnerUserId`/`find`). Every
  method routes through `EtsyHttpClient`, using the exact generated
  `<OperationId>Params`/`RequestBody`/`Response` types per
  `docs/ARCHITECTURE.md`'s resource module conventions. 24 smoke tests
  in `test/resources/shop/shop.test.ts`.
- `src/resources/commerce/`: `CommerceResource` (Stage 4 resource cluster
  — Commerce & Identity), covering all 20 `Shop Receipt`/
  `Shop Receipt Transactions`/`Payment`/`Ledger Entry`/`User`/
  `UserAddress`/`Other` operations, grouped as `commerce.receipts`,
  `commerce.transactions`, `commerce.payments`, `commerce.ledgerEntries`,
  `commerce.user` (nesting `.addresses`), plus top-level
  `ping()`/`tokenScopes()` for the `Other` tag (the only two
  apiKey-only operations in this cluster — everything else needs
  `oauth`, since it's private shop/user data). Every method routes
  through `EtsyHttpClient`, using the exact generated
  `<OperationId>Params`/`RequestBody`/`Response` types per
  `docs/ARCHITECTURE.md`'s resource module conventions. Smoke tests in
  `test/resources/commerce/commerce.test.ts`.
- `src/resources/listings/`: `ListingsResource` (Stage 4 resource cluster
  — Listings & Media), covering all 37 `ShopListing` (+ File/Image/
  Video/VariationImage/Translation/Personalization) operations, grouped
  as `listings.files`, `listings.images`, `listings.videos`,
  `listings.variationImages`, `listings.translations`,
  `listings.personalization`, plus 17 top-level `ShopListing` tag
  methods (`create`/`get`/`delete`/`update`/`getByShop`/etc.). Every
  method routes through `EtsyHttpClient`, using the exact generated
  `<OperationId>Params`/`RequestBody`/`Response` types per
  `docs/ARCHITECTURE.md`'s resource module conventions. Smoke tests in
  `test/resources/listings/listings.test.ts`.
- `src/client.ts`: `createEtsyClient()` and the `EtsyClient` facade —
  constructs a single shared `EtsyHttpClient` and wires up `listings`,
  `catalog`, `shop`, and `commerce`, plus the optional `auth` passed
  through from `EtsyClientConfig`. The package's single public entry
  point for constructing a client, per `docs/ARCHITECTURE.md`'s Facade
  section. `src/index.ts` now also exports every resource class (and
  their exported sub-resources), `EtsyOAuth`/`InMemoryTokenStore`,
  `EtsyApiError`, and `paginate()`, for consumers who want to construct a
  narrower client by hand. Tests in `test/client.test.ts`.
- README: filled in "Adding to Project" and "Examples" with a
  `createEtsyClient` quickstart, one API-key-only and one OAuth2/PKCE.
- Stage 5 (Testing): a coverage gate, `vitest.config.ts`'s
  `coverage.thresholds` — ≥90% (statements/branches/functions/lines)
  globally on `src/`, 100% on `src/http/**` and `src/auth/**` — enforced
  in CI via `npm run test:coverage` (already a required step on every
  push/PR against `dev`/`main`). Closed every remaining coverage gap
  first so the gate reflects a real bar rather than codifying the
  existing shortfall: added targeted tests across `src/http`/`src/auth`
  (missing-fetch/missing-Web-Crypto constructor guards, malformed/partial
  rate-limit headers, malformed `Retry-After`, error-extraction edge
  cases, `combineSignals()`'s already-aborted and
  timeout-vs-caller-signal paths, `EtsyOAuth`'s response-scope-string and
  default-`InMemoryTokenStore` branches) and smoke-tested every
  previously-untested resource method across all four Stage 4 clusters
  (`commerce`, `shop`, `listings` — `catalog` was already fully covered).
  `src/`, `src/http`, and `src/auth` all now sit at 100% on every metric.
- Stage 7 (Packaging & release engineering): [Changesets](https://github.com/changesets/changesets)
  (`.changeset/config.json`, `npm run changeset`/`version-packages`/`release`
  scripts) for versioning and `CHANGELOG.md` generation going forward, plus
  `.github/workflows/release.yml` — a `vX.Y.Z`-tag-triggered workflow that
  re-runs the full CI toolchain, verifies the tag matches `package.json`,
  then `npm publish --provenance --access public`s using an `NPM_TOKEN`
  repo secret. `package.json` gained a matching `publishConfig` (`access:
"public"`, `provenance: true`) so a manual publish can't diverge from the
  automated one. Verified `npm pack --dry-run`'s file list (exactly
  `LICENSE`/`README.md`/`package.json`/`dist/**`) and that a packed tarball
  installs and resolves correctly via `import`, `require`, and TypeScript's
  `NodeNext` resolution in three scratch consumer projects — see
  `docs/ARCHITECTURE.md`'s new Release process section.
- Stage 8 (QA & security review): `docs/SECURITY-REVIEW.md`, the sign-off
  audit against the full codebase — a code-level security review (no
  hand-rolled request/URL construction, PKCE `code_verifier` uses a CSPRNG,
  no secret ever appears in a thrown error or log, CI/release workflows
  have no untrusted-input injection points), a dependency audit (zero
  runtime dependencies; one dev-only, Windows-only, low-severity `esbuild`
  advisory with no available non-breaking fix, accepted), and a license
  audit (zero runtime dependencies to reconcile; no GPL/AGPL in
  `devDependencies`). No unresolved high/critical findings. Also adds root
  `SECURITY.md` (a standard vulnerability-reporting policy, pointing to
  GitHub's private security-advisory flow).
- Stage 6 (Documentation): README's Installation section (the `npm install`
  command) and a new "Guides & API reference" section; four per-cluster
  usage guides (`docs/guides/{listings,catalog,shop,commerce}.md`) —
  every code example in them is compiled against the real published
  package (via a scratch consumer project, same technique as Stage 7's
  exports-map verification) rather than freehand, which caught two real
  API-shape bugs before they shipped (`updateListingInventory`'s
  `readiness_state_id` and `updateListingPersonalization`'s `required`
  field are both actually required, not optional; `updateListing` has no
  `price` field — price lives on inventory offerings). TypeDoc
  (`typedoc.json`, `npm run docs:api`) generates the full API reference
  from `src/index.ts`'s public exports into `docs/api/` (gitignored);
  `.github/workflows/docs.yml` deploys it to GitHub Pages on push to
  `main` (requires Pages enabled once, a manual step like `NPM_TOKEN`).
  Wiring up TypeDoc surfaced two real gaps in the public API surface,
  both fixed: `CatalogResource`'s four sub-resource classes
  (`ListingInventoryResource`, `SellerTaxonomyResource`,
  `BuyerTaxonomyResource`, `ReviewsResource`) weren't exported, unlike
  every other cluster's sub-resources — an inconsistency from Stage 4;
  and `UploadListingFileRequestBody`/`UploadListingImageRequestBody`/
  `UploadListingVideoRequestBody` weren't exported either, making the
  documented binary-upload cast-at-call-site workaround (from PR #11)
  impossible to actually write in a consumer's own code.

### Changed

- Pinned `typescript` to `^5.9.3` (down from `^6.0.3`): `openapi-typescript`
  peer-depends on `typescript@^5.x`, and 5.9 satisfies every other
  tool's constraints too, so this keeps the whole devDependency graph
  on one TypeScript version instead of overriding a peer conflict.
- `docs/ARCHITECTURE.md`: `EtsyOAuth.createAuthorizationUrl()` is now
  documented as `async`/`Promise`-returning rather than synchronous —
  amended during Stage 3 implementation, since deriving the PKCE S256
  `code_challenge` requires `SubtleCrypto.digest()`, which has no
  synchronous form.
- **Raised minimum supported Node.js from 18+ to 20+** (`package.json`
  `engines.node`, `docs/ARCHITECTURE.md`'s locked runtime-support
  decision, `README.md`). Root cause: `vitest@4`/`eslint@10` (the dev
  toolchain, not the shipped `dist/` code) require Node ≥20 to even
  start — `vitest run` fails immediately on Node 18 with `SyntaxError:
'node:util' does not provide an export named 'styleText'`. This meant
  the CI matrix's Node 18.x leg had been failing on every PR since
  Stage 1 without anyone noticing (local verification during Stages
  1-4 ran on Node 22). Dropped the 18.x leg from
  `.github/workflows/ci.yml`'s matrix (now `[20.x, 22.x]`) rather than
  downgrading the toolchain.

### Fixed

Addressed automated PR review findings on Stage 3, all verified against
the actual code before fixing:

- **`EtsyOAuth.getValidAccessToken()`**: two concurrent calls racing near
  expiry both called `refresh()` with the same (rotating) refresh token;
  the second exchange would fail with an already-consumed token. Now
  dedupes concurrent refreshes behind a single in-flight promise.
- **`EtsyHttpClient`**: the injected/global `fetch` was stored unbound and
  invoked as `this.#fetch(...)`, which throws `TypeError: Illegal
invocation` in spec-compliant browsers (the receiver becomes the
  `EtsyHttpClient` instance instead of the global). Now bound at
  construction.
- **`paginate()`**: `{ limit: 0 }` looped forever — `results.length < 0`
  is never true, so the "short page" termination check could never fire
  and `offset` never advanced. Now validates `limit` (positive integer)
  and `offset` (non-negative integer) up front and throws `RangeError`.
- **`EtsyHttpClient`**: requests had no timeout or cancellation, so a
  stalled Etsy response hung the caller indefinitely (multiplied by the
  429 retry loop). Added `EtsyClientConfig.timeoutMs` (default 30s, via
  `AbortSignal.timeout()`, a fresh window per retry attempt) and
  `RequestOptions.signal` for caller-provided cancellation, combined
  without relying on `AbortSignal.any()` (unavailable on Node 18).
- **`EtsyOAuth`**: the token endpoint always used `globalThis.fetch`
  directly, so a consumer in a restricted environment could construct an
  `EtsyHttpClient` (injectable fetch) but not complete the OAuth flow.
  Added `EtsyOAuthConfig.fetch`, mirroring `EtsyClientConfig.fetch`.
- **`EtsyHttpClient`**: `new URL(path, baseUrl)` silently discarded any
  path prefix on a non-default `baseUrl` (e.g. a mock server mounted at
  `/etsy`), since an absolute-path relative reference replaces the
  entire base path per the URL spec. Now joins `baseUrl`'s path with the
  request path explicitly.
- `.gitignore`: ignore `.claude/`, which holds local Claude Code
  tooling state (e.g. isolated git worktrees for parallel Stage 4
  work) that shouldn't be tracked in the repo.

[Unreleased]: https://github.com/RichardMcQuiston01/unofficial-etsy-api-ts/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/RichardMcQuiston01/unofficial-etsy-api-ts/releases/tag/v0.1.0
