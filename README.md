# @richardmcquiston01/etsy-api

## Overview

Framework agnostic TypeScript NPM package for interacting with Etsy's API service.

> **Status**: pre-release, under active development. There is no published
> version yet. See [ROADMAP.md](./ROADMAP.md) for the build plan and
> [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the locked API
> contract. The client facade and all four resource clusters (listings,
> catalog, shop, commerce) are implemented; install/publish instructions
> below will be filled in once `0.1.0` ships to npm. See
> [docs/SECURITY-REVIEW.md](./docs/SECURITY-REVIEW.md) for the Stage 8
> QA/security audit, and [SECURITY.md](./SECURITY.md) to report a
> vulnerability.

## Getting Started

### Prerequisites

- Node.js 20 or later (also targets browsers and edge runtimes such as
  Cloudflare Workers, Deno, and Bun — see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)).
- An Etsy app keystring/API key, obtained from the
  [Etsy Developers portal](https://www.etsy.com/developers/your-apps).

### Installation

_Not yet published. Installation instructions land when `0.1.0` ships._

### Adding to Project

```ts
import { createEtsyClient } from "@richardmcquiston01/etsy-api";

const etsy = createEtsyClient({ apiKey: "<your Etsy keystring>" });
```

`createEtsyClient` returns an `EtsyClient` with one `listings`/`catalog`/
`shop`/`commerce` resource cluster each, all sharing a single
`EtsyHttpClient` transport. Resource classes are also individually
exported for consumers who want to construct a narrower client by hand.

### Examples

**API-key-only** (the 32 public operations — taxonomy, listing search,
shop lookups, etc. — need no OAuth):

```ts
import { createEtsyClient } from "@richardmcquiston01/etsy-api";

const etsy = createEtsyClient({ apiKey: "<your Etsy keystring>" });

const { results: listings } = await etsy.listings.findAllActive({ keywords: "wall art" });
const shop = await etsy.shop.get(12345);
```

**OAuth2 + PKCE** (required for the other 73 operations — creating/updating
listings, reading receipts and payments, etc.):

```ts
import { createEtsyClient, EtsyOAuth } from "@richardmcquiston01/etsy-api";

const auth = new EtsyOAuth({
  clientId: "<your Etsy keystring>",
  redirectUri: "https://example.com/oauth/callback",
  scopes: ["listings_r", "listings_w", "shops_r"],
});

// 1. Send the user to Etsy to authorize; persist `pkce.codeVerifier` for
//    the callback (e.g. in a session).
const { url, pkce } = await auth.createAuthorizationUrl("<random state>");

// 2. On the OAuth callback, exchange the returned `code` for tokens.
await auth.exchangeCode("<code from callback query string>", pkce.codeVerifier);

// 3. Build the client — EtsyHttpClient calls auth.getValidAccessToken()
//    (refreshing transparently) for every operation that needs a scope.
const etsy = createEtsyClient({ apiKey: "<your Etsy keystring>", auth });

const receipts = await etsy.commerce.receipts.getAll(12345);
```

## Development

Contributor setup for working on this package itself:

```sh
npm install
npm run codegen        # regenerate src/generated/** from docs/<version>.json
npm run build          # dual ESM/CJS build via tsup
npm run test            # unit tests via Vitest
npm run test:coverage    # unit tests with coverage
npm run lint              # ESLint
npm run format:check       # Prettier check
npm run typecheck           # tsc --noEmit
```

`npm run test:coverage` enforces the coverage gate in `vitest.config.ts`
(≥90% statements/branches/functions/lines on `src/`, 100% on `src/http/**`
and `src/auth/**`) and fails the build below it, same as CI.

`src/generated/**` (schema and per-operation request/response types) is
generated from `docs/<version>.json` — see `docs/ARCHITECTURE.md`. To pick up
a new Etsy spec version, drop the new `docs/<X.Y.Z>.json` file in place and
rerun `npm run codegen`; it always uses the highest-semver spec file present.

### Releasing

Versioning and publishing go through [Changesets](https://github.com/changesets/changesets):

```sh
npm run changeset          # record a change: bump type (patch/minor/major) + summary
npm run version-packages   # apply pending changesets: bump package.json, update CHANGELOG.md
npm run release            # build + `changeset publish` (normally only run by CI)
```

To cut a release: merge the version bump from `npm run version-packages`,
then push a `vX.Y.Z` tag matching `package.json`'s version. `.github/workflows/release.yml`
runs the full toolchain (format/lint/typecheck/test:coverage/build) as a
safety gate, verifies the tag matches `package.json`, then runs
`npm publish --provenance --access public` using the repo's `NPM_TOKEN`
secret. Nothing publishes on a push to `dev`/`main` — only on a tag push.

## Buy Me a Coffee

I developed this while I currently looking for work. If this app has helped you or someone you know, please consider donating. I appreciate it.

[**Donate via Stripe**](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800), or scan:

[![Donate via Stripe](./donate.svg)](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800)

## License

Apache 2.0

## Copyright

(c)2026 Richard McQuiston. All rights reserved.
