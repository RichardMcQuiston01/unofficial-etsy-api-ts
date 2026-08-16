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

### Changed

- Pinned `typescript` to `^5.9.3` (down from `^6.0.3`): `openapi-typescript`
  peer-depends on `typescript@^5.x`, and 5.9 satisfies every other
  tool's constraints too, so this keeps the whole devDependency graph
  on one TypeScript version instead of overriding a peer conflict.

[Unreleased]: https://github.com/RichardMcQuiston01/unofficial-etsy-api-ts/compare/dev...HEAD
