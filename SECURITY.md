# Security Policy

## Supported versions

This package is pre-1.0 (`0.x`, breaking changes allowed between minors
until `1.0.0` — see `docs/ARCHITECTURE.md`). Only the latest published
version is supported with security fixes.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for a suspected security
vulnerability. Instead, use GitHub's private vulnerability reporting:

1. Go to the [Security tab](https://github.com/RichardMcQuiston01/unofficial-etsy-api-ts/security) of this repository.
2. Click **"Report a vulnerability"**.

This opens a private advisory visible only to the maintainer and lets us
coordinate a fix before any public disclosure.

For anything that clearly isn't a security issue (a bug, a feature
request), please use the
[public issue tracker](https://github.com/RichardMcQuiston01/unofficial-etsy-api-ts/issues)
instead.

## Scope

This package is a client library — it has no server component and ships
**zero runtime dependencies** (verified in `docs/SECURITY-REVIEW.md`). The
most relevant risk areas are the OAuth 2.0 + PKCE flow
(`src/auth/EtsyOAuth.ts`) and the HTTP transport's handling of the Etsy API
key / OAuth bearer token (`src/http/EtsyHttpClient.ts`) — vulnerabilities
there (e.g., a scenario where a secret could leak into an error, a log, or
an unintended request) are the highest priority to report.
