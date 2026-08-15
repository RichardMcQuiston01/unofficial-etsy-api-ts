# ROADMAP — `@richardmcquiston01/etsy-api`

A multi-agent, multi-stage plan for building and publishing a framework-agnostic
TypeScript wrapper around **Etsy Open API v3**, from empty repo to a published,
versioned NPM package.

Status: **planning draft for review**. Nothing below has been executed yet.

---

## 1. What we're building against

The repo already vendors Etsy's OpenAPI 3.0 description (`docs/3.0.0.json`,
v3.0.0). Facts pulled directly from it, used to size the work:

| Fact | Value |
|---|---|
| Base URL | `https://openapi.etsy.com` |
| Paths / Operations | 76 paths, **105 operations** (63 GET, 16 POST, 13 DELETE, 12 PUT, 1 PATCH) |
| Tags (resource domains) | 27 (`ShopListing` 17 ops, `Shop ShippingProfile` 14, `Shop Receipt Transactions` 4, `Payment`, `Ledger Entry`, `User`, `UserAddress`, `SellerTaxonomy`, `BuyerTaxonomy`, `Review`, etc.) |
| Schemas to model | 81 (`ShopListing`, `ShopReceipt`, `ListingInventory`, `Payment`, `ErrorSchema`, …) |
| Deprecated operations | 0 |
| Request body encodings | `application/x-www-form-urlencoded` (22 ops), `multipart/form-data` (3 ops: listing file/image/video upload), `application/json` (e.g. `updateListingInventory`) |
| Response codes seen | 200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 501, 503 |
| Error body shape | `{ "error": string }` (`ErrorSchema`, required `error`) |

**Auth** (from `components.securitySchemes` + per-operation `security`):
- Every request needs `x-api-key: <keystring>` (global `security: [{api_key: []}]`).
- 73 of 105 operations additionally require **OAuth 2.0** (authorization-code +
  PKCE). Etsy's keystring *is* the OAuth `client_id`.
- Authorization URL: `https://www.etsy.com/oauth/connect`; token URL:
  `https://openapi.etsy.com/v3/public/oauth/token`.
- Scopes in use: `address_r`, `address_w`, `email_r`, `listings_d`,
  `listings_r`, `listings_w`, `profile_r`, `profile_w`, `shops_r`, `shops_w`,
  `transactions_r`, `transactions_w`.
- Access tokens last **1 hour**; refresh tokens last **90 days** and are
  reissued on each refresh (rotating) — must persist the *new* refresh token
  every time or the chain breaks.
- 32 operations work with the API key alone (public taxonomy/listing reads).

**Rate limits** (per API key, confirmed via Etsy docs/community reports):
- 10,000 requests/day, 10 requests/second, by default.
- Every response carries `x-limit-per-day`, `x-remaining-today`,
  `x-limit-per-second`, `x-remaining-this-second`.
- Exceeding either returns `429` with a `Retry-After` header.

**Pagination**: `limit`/`offset` + `sort_on`/`sort_order` + `includes` on list
endpoints — consistent enough to build one shared pagination helper.

These facts drive the architecture: we need (a) a transport layer that
understands two auth modes, rate-limit headers, and a uniform error shape,
(b) a generated type layer for 81 schemas, and (c) ergonomic resource modules
over 105 operations across 27 domains — a shape that parallelizes well across
agents once the core is settled.

---

## 2. Architecture decisions (locked before Stage 1)

- **Language/target**: TypeScript, compiled to dual ESM + CJS, with a single
  set of `.d.ts` types (`tsup` or `tsc` project references — decided in
  Stage 1 spike).
- **HTTP**: no hard dependency on `axios`/`node-fetch`; use platform `fetch`
  (Node 18+, browsers, edge runtimes) to keep the package framework-agnostic,
  per the README's stated goal. Provide a `fetch` injection point for
  environments without a global `fetch`.
- **Types**: generate the base request/response/schema types from
  `docs/3.0.0.json` rather than hand-transcribing 81 schemas, then hand-write
  ergonomic wrapper types on top. Re-run codegen whenever Etsy revs the spec.
- **Auth**: ship both an API-key-only client and a full OAuth2+PKCE client;
  token storage is pluggable (interface + in-memory default), not
  opinionated about where consumers persist refresh tokens.
- **Errors**: typed `EtsyApiError` wrapping status code + `ErrorSchema.error`
  + rate-limit snapshot, thrown uniformly by the transport layer.
- **Module layout**: one resource module per OpenAPI tag group (e.g.
  `listings`, `shops`, `shippingProfiles`, `receipts`, `transactions`,
  `payments`, `taxonomy`, `users`), composed onto a single `EtsyClient` facade.

---

## 3. Agent roles

| Agent | Responsibility |
|---|---|
| **Architect** | Owns Stage 0–1 decisions above, the module boundary contract, and the codegen strategy. Reviews every other agent's output against that contract. |
| **Platform Engineer** | Builds the core transport: fetch wrapper, auth (API key + OAuth2/PKCE + refresh rotation), rate-limit tracking, retry/backoff, pagination helper, `EtsyApiError`. |
| **Codegen Engineer** | Builds/owns the script that turns `docs/3.0.0.json` into base TS types (schemas + per-operation request/response types) and regenerates them on spec updates. |
| **Resource Engineers (×4, parallel)** | Each owns a cluster of tags, implements resource classes on top of the Platform Engineer's client and the Codegen Engineer's types. Clusters below. |
| **Test Engineer** | Mock-server / MSW-based unit tests per resource, plus transport-layer tests (auth refresh, rate-limit backoff, error mapping, pagination). |
| **Docs Engineer** | README (Getting Started/Installation/Examples sections currently empty), TypeDoc API reference, OAuth walkthrough, per-resource usage snippets. |
| **Release Engineer** | Package metadata, dual build, CI (lint/typecheck/test/build matrix), Changesets-based versioning, npm publish + provenance, CHANGELOG automation. |
| **QA / Security Reviewer** | Runs `/security-review`, dependency audit, license check (Apache-2.0 compatibility of deps), verifies no secrets/tokens ever get logged or serialized in errors. |

Resource clusters for the parallel Resource Engineers, sized to roughly even
operation counts:

1. **Listings & Media** — `ShopListing`, `ShopListing File/Image/Video/
   VariationImage/Translation/Personalization` (34 ops)
2. **Inventory & Catalog** — `ShopListing Inventory/Product/Offering`,
   `SellerTaxonomy`, `BuyerTaxonomy`, `Review` (9 ops)
3. **Shop Configuration** — `Shop`, `Shop Section`, `Shop ShippingProfile`,
   `Shop Return Policy`, `Shop ProcessingProfiles`, `Shop
   HolidayPreferences`, `Shop ProductionPartner` (32 ops)
4. **Commerce & Identity** — `Shop Receipt`, `Shop Receipt Transactions`,
   `Payment`, `Ledger Entry`, `User`, `UserAddress`, `Other` (28 ops)

---

## 4. Stages

### Stage 0 — Discovery & contract (Architect, solo)
- Confirm target Node/browser support matrix and TS version floor.
- Finalize module boundary contract (client facade shape, error type, token
  storage interface) other agents build against.
- **Exit criteria**: written contract (interfaces only, no impl) committed
  to `docs/ARCHITECTURE.md`; nothing downstream starts until this merges.

### Stage 1 — Scaffolding (Release Engineer, solo)
- `package.json` (name `@richardmcquiston01/etsy-api`, `exports` map for
  dual ESM/CJS, `sideEffects: false`), `tsconfig.json`, `tsup`/build config,
  ESLint + Prettier, Vitest, `.npmignore`/`files` allowlist.
- GitHub Actions: install → lint → typecheck → test → build on PR.
- **Exit criteria**: `npm run build` and `npm test` succeed on an empty
  `src/index.ts`; CI green on a throwaway commit.

### Stage 2 — Codegen (Codegen Engineer, solo, depends on Stage 0)
- Script (`scripts/codegen.ts`) that reads `docs/3.0.0.json` and emits
  `src/generated/schemas.ts` (81 schema types) and
  `src/generated/operations.ts` (per-operation params/request/response
  types), keyed by `operationId`.
- Regeneration is idempotent and re-runnable when Etsy ships a new spec
  version (drop-in replace `docs/<version>.json`).
- **Exit criteria**: generated output compiles standalone; committed
  generated files reviewed for a handful of spot-checked operations
  (`createDraftListing`, `updateListingInventory`, `uploadListingImage`).

### Stage 3 — Core transport (Platform Engineer, solo, depends on Stage 0+2)
- `EtsyHttpClient`: `fetch`-based, injects `x-api-key`, attaches bearer token
  when present, parses `ErrorSchema` into `EtsyApiError`, tracks
  `x-limit-per-second`/`x-remaining-today` from response headers, retries
  `429`s honoring `Retry-After` with capped backoff.
- `EtsyOAuth`: PKCE code-verifier/challenge generation, authorization URL
  builder, token exchange, rotating refresh (persists new refresh token via
  the pluggable `TokenStore` interface from Stage 0), scope string builder.
- Pagination helper (`paginate()` async iterator over `limit`/`offset` list
  endpoints).
- **Exit criteria**: unit tests (own, ahead of Test Engineer's suite) cover
  a happy-path request, a 429-retry, a 401 with expired-token refresh, and
  PKCE challenge generation against a known test vector.

### Stage 4 — Resource modules (4 Resource Engineers, parallel, depends on Stage 2+3)
- Each engineer implements their cluster's resource class(es) using
  `EtsyHttpClient` + generated types only — no direct `fetch` calls.
- Form-encoded vs. multipart vs. JSON bodies handled per operation per the
  spec (array params serialized as Etsy expects for
  `x-www-form-urlencoded`, e.g. `materials`, `tags`, `production_partner_ids`).
- Each cluster lands as its own PR against the Stage 0 contract so review
  load doesn't block on the other three.
- **Exit criteria**: every operation in the cluster has a typed method with
  a doc comment linking back to its `operationId`; Architect signs off each
  PR against the contract before merge.

### Stage 5 — Testing (Test Engineer, depends on Stage 3, overlaps Stage 4)
- Shared MSW (or `undici` mock agent) fixtures per resource cluster, built
  incrementally as each Stage 4 PR lands rather than after all four finish.
- Contract tests validating request shape (headers, body encoding, query
  serialization) against the OpenAPI spec per operation.
- Coverage target agreed with Architect (e.g. ≥85% on `src/`, 100% on
  transport/auth).
- **Exit criteria**: full suite green in CI; coverage gate enforced.

### Stage 6 — Documentation (Docs Engineer, depends on Stage 4 substantially complete)
- Fill in README's empty sections: Prerequisites, Installation, Adding to
  Project, Examples (API-key-only quickstart + full OAuth2/PKCE quickstart).
- TypeDoc-generated API reference published alongside the package (e.g.
  `docs/api/` or GitHub Pages).
- Per-cluster usage guides (listings CRUD + media upload, shop setup,
  order/transaction retrieval, payments/ledger).
- **Exit criteria**: README renders correctly on npmjs.com preview; a
  fresh read-through by the Architect confirms a new consumer can get an
  authenticated client working from the README alone.

### Stage 7 — Packaging & release engineering (Release Engineer, depends on Stage 1)
- Changesets for versioning + auto-generated `CHANGELOG.md`.
- npm publish workflow (provenance via `--provenance`, `NPM_TOKEN` secret,
  publish gated on Stage 5's CI + tag push).
- Verify package size/tree-shakeability, confirm `exports` map resolves
  correctly for both `import` and `require` consumers (smoke-test in a
  throwaway consumer project).
- **Exit criteria**: `npm publish --dry-run` produces the expected file
  list; a tagged pre-release (`0.1.0-beta.0`) installs cleanly in a scratch
  project via both ESM and CJS entry points.

### Stage 8 — QA & security review (QA/Security Reviewer, depends on Stage 4–7)
- Run `/security-review` against the full diff.
- Dependency audit (`npm audit`, license compatibility with Apache-2.0).
- Manual check: no token/secret ever appears in thrown errors, logs, or
  serialized objects; PKCE verifier never logged.
- **Exit criteria**: no unresolved high/critical findings; sign-off recorded
  in the PR that promotes `0.1.0-beta.x` to `1.0.0`.

### Stage 9 — Beta → GA
- Publish `0.1.0` (or `0.x` line) to npm, dogfood against a real Etsy app
  (sandbox keys), collect feedback for 1–2 weeks.
- Address feedback, then cut `1.0.0`.
- **Exit criteria**: `1.0.0` published; README/CHANGELOG reflect it;
  `CHANGELOG.md` (currently empty) has real entries from Changesets.

---

## 5. Sequencing summary

```
Stage 0 (Architect)
   └─▶ Stage 1 (Release Eng)        Stage 2 (Codegen Eng)
                 └────────────┬────────────┘
                        Stage 3 (Platform Eng)
                                 │
        ┌───────────┬───────────┼───────────┐
     Stage 4a     Stage 4b    Stage 4c    Stage 4d   (Resource Engs, parallel)
        └───────────┴───────────┴───────────┘
                                 │
                    Stage 5 (Test Eng, overlaps 4)
                                 │
              ┌──────────────────┴──────────────────┐
        Stage 6 (Docs Eng)                  Stage 7 (Release Eng)
              └──────────────────┬──────────────────┘
                        Stage 8 (QA/Security)
                                 │
                        Stage 9 (Beta → GA)
```

Stage 5 (test scaffolding) should start as soon as Stage 3 lands, consuming
each Stage 4 PR as it merges rather than waiting for all four clusters —
this is the main opportunity to compress wall-clock time beyond the naive
"resource engineers in parallel" win.

---

## 6. Open questions for you

1. **Node/browser support matrix** — any minimum Node version or specific
   runtimes (Cloudflare Workers, Deno, Bun) to target explicitly?
2. **Token persistence** — should the package ship a default `TokenStore`
   (e.g. filesystem for Node) or stay storage-agnostic with in-memory only?
3. **Versioning line** — start at `0.1.0` while iterating, or go straight
   for `1.0.0` given the API surface is well-specified by the OpenAPI doc?
4. **Scope** — should Stage 4's four clusters all ship in the first release,
   or would you rather GA with Listings + Shop Configuration first and add
   Commerce/Payments in a follow-up minor?

---

*This document is a planning artifact. Once you've reviewed and adjusted the
stages/clusters/open questions above, the next step is executing Stage 0.*
