# Security review — Stage 8

Owner: **QA/Security Reviewer**. Per `ROADMAP.md` Stage 8, this records the
QA/security sign-off against the full codebase (Stages 0–7: architecture
contract, scaffolding, codegen, core transport/auth, all four Stage 4
resource clusters, the client facade, the coverage gate, and packaging/
release engineering) ahead of publishing `0.1.0` — and again, unchanged
unless new findings surface, when `0.1.0` promotes to `1.0.0` per Stage 9.

## 1. Code-level security review

A full-diff review (`origin/main...dev` — `main` predates this project, so
this is effectively the entire package) was run against the standard
categories: injection, auth/authorization, crypto/secrets handling, unsafe
deserialization/code execution, and data exposure, with extra scrutiny on
this package's specific risk areas:

- **PKCE `code_verifier` randomness** (`src/auth/EtsyOAuth.ts`,
  `generateCodeVerifier`): 32 bytes (256 bits) from
  `crypto.getRandomValues()` via the Web Crypto API — a CSPRNG, not
  `Math.random()`.
- **Token/secret exposure in errors**: `EtsyApiError`
  (`src/http/EtsyApiError.ts`) only ever carries `status`, `etsyError`
  (Etsy's own response body, not request data), `operationId`, and
  `rateLimit`. The `x-api-key` and `Authorization: Bearer` request headers
  are never attached to a thrown error or logged anywhere — in fact the
  package contains **no `console.*`/log calls at all** in `src/`, so there
  is no code path that could log a secret even accidentally.
- **PKCE `code_verifier` "logging"**: never logged; returned to the caller
  from `createAuthorizationUrl()` by design, since RFC 7636 requires the
  _caller_ to persist it across the redirect to the token exchange —
  standard for every PKCE client library, not a leak.
- **CSRF `state` handling**: `createAuthorizationUrl(state)` forwards an
  opaque, caller-supplied `state` into the authorization URL unmodified and
  never inspects or validates it in `exchangeCode()`. This correctly leaves
  CSRF-state verification to the consumer (standard OAuth client library
  design) without doing anything that would undermine a consumer's own
  validation.
- **Path parameter handling** (`EtsyHttpClient#buildUrl`): every
  `pathParams` value passes through `encodeURIComponent()` before
  substitution into the URL template, so a parameter value cannot introduce
  new path segments, query strings, or escape to a different origin.
- **Request body construction** (`buildFormBody`/`buildMultipartBody`):
  built via `URLSearchParams`/`FormData`, not string concatenation — no
  header/body injection vector.
- **Refresh-token handling**: rotating refresh tokens are persisted only
  through the consumer-supplied `TokenStore`; concurrent refreshes are
  deduped behind a single in-flight promise so a race can't cause a token
  to be dropped or double-spent.
- **`scripts/codegen.ts` and CI/release workflows**: codegen only reads
  spec files from the repo's own `docs/` directory (maintainer-controlled)
  and writes only under `src/generated/`. `.github/workflows/release.yml`
  publishes only on a maintainer-pushed `vX.Y.Z` tag, passes `NPM_TOKEN`
  via an env var (never interpolated into a shell string), and has no step
  that interpolates untrusted input (PR titles, branch names, issue bodies)
  into a `run:` block.

**Result: no HIGH or MEDIUM severity findings.** Every resource method
across all four Stage 4 clusters routes through `EtsyHttpClient.request()`
with templated `pathParams` and generated types — no hand-rolled URL or
request construction anywhere in `src/resources/**`.

## 2. Dependency audit

`npm audit` (production install tree): **zero runtime dependencies** — the
published package has no third-party code running in a consumer's process.
This eliminates supply-chain risk for anything that actually ships.

`npm audit` (full tree, including devDependencies):

| Package                                                                       | Severity | Advisory                                                                                                                                    | Scope                                            |
| ----------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `esbuild` 0.27.7 (transitive via `tsup`→`bundle-require` and `vitest`→`vite`) | Low      | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) — arbitrary file read via the esbuild dev server, **Windows only** | Dev-only; not present in the published `dist/**` |

Investigated a fix: `npm audit fix` (and `--force`) cannot bump past
0.27.7 without `tsup`/`vitest` themselves releasing a version that widens
their `esbuild` dependency range — `tsup@8.5.1` is already latest, and
`vitest`'s only newer line is a `5.0.0` release candidate (not stable).
Forcing a pre-release major bump of a core dev-tool to chase a
Windows-only, dev-server-only, low-severity advisory is not worth the
churn/regression risk. Flagged in Stage 1's original scaffolding commit
for this review; **accepted, no action** — re-evaluate once `tsup`/`vitest`
ship a fix upstream.

## 3. License compatibility

Zero runtime dependencies (see above) — no license to reconcile for what
ships to consumers. `devDependencies` (full tree, `npx license-checker
--summary`): MIT (207), Apache-2.0 (18), ISC (10), BSD-2-Clause (6),
BSD-3-Clause (6), MPL-2.0 (3, file-level weak copyleft — not bundled/
distributed), Python-2.0 (1), BlueOak-1.0.0 (1), `(MIT OR CC0-1.0)` (1).
No GPL/AGPL or other license incompatible with Apache-2.0.

## 4. Manual checks

- **No token/secret ever appears in a thrown error, log, or serialized
  object.** Verified: no `console.*` calls exist anywhere in `src/`;
  audited every `throw new Error(...)`/`new EtsyApiError(...)` call site
  — none interpolate `apiKey`, `accessToken`, `refreshToken`, or
  `codeVerifier`.
- **PKCE verifier never logged.** Confirmed above — never logged, only
  ever returned to the caller (by design) or sent as a form field directly
  to Etsy's token endpoint over HTTPS.

## Sign-off

No unresolved HIGH or MEDIUM findings. The one LOW dependency advisory is
dev-only, platform-scoped (Windows), has no available non-breaking fix, and
does not affect the published package. **Stage 8 exit criteria met** —
this review is the sign-off for publishing `0.1.0`, and again when `0.1.0`
promotes to `1.0.0`.

Also added during this stage: root `SECURITY.md`, a standard vulnerability-
reporting policy (GitHub surfaces this in the repo's Security tab) —
previously missing, since this was the first point a security review had
been done.
