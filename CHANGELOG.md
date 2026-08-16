# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project scaffolding: `package.json` (dual ESM/CJS build via `tsup`,
  `exports` map, `engines.node >=18`), `tsconfig.json`, ESLint 10 flat
  config (`typescript-eslint`), Prettier, Vitest with coverage, and a
  `.gitignore`.
- GitHub Actions CI workflow running format/lint/typecheck/test/build on
  Node 18/20/22 for every push and PR against `dev`/`main`.
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

[Unreleased]: https://github.com/RichardMcQuiston01/unofficial-etsy-api-ts/compare/dev...HEAD
