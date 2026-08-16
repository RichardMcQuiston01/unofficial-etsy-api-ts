# @richardmcquiston01/etsy-api

## Overview

Framework agnostic TypeScript NPM package for interacting with Etsy's API service.

> **Status**: pre-release, under active development. There is no published
> version yet and the client API is not usable. See [ROADMAP.md](./ROADMAP.md)
> for the build plan and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for
> the locked API contract. Installation/usage docs below will be filled in
> once the client ships.

## Getting Started

### Prerequisites

- Node.js 18 or later (also targets browsers and edge runtimes such as
  Cloudflare Workers, Deno, and Bun — see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)).
- An Etsy app keystring/API key, obtained from the
  [Etsy Developers portal](https://www.etsy.com/developers/your-apps).

### Installation

_Not yet published. Installation instructions land when `0.1.0` ships._

### Adding to Project

_Coming once the client facade (`createEtsyClient`) is implemented._

### Examples

_Coming once the client facade (`createEtsyClient`) is implemented._

## Development

Contributor setup for working on this package itself:

```sh
npm install
npm run build        # dual ESM/CJS build via tsup
npm run test          # unit tests via Vitest
npm run test:coverage # unit tests with coverage
npm run lint           # ESLint
npm run format:check    # Prettier check
npm run typecheck        # tsc --noEmit
```

## Buy Me a Coffee

I developed this while I currently looking for work. If this app has helped you or someone you know, please consider donating. I appreciate it.

[**Donate via Stripe**](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800), or scan:

[![Donate via Stripe](./donate.svg)](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800)

## License

Apache 2.0

## Copyright

(c)2026 Richard McQuiston. All rights reserved.
