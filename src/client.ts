/**
 * Public client facade. See docs/ARCHITECTURE.md#facade-srcclientts.
 */
import type { EtsyClientConfig } from "./config.js";
import type { EtsyOAuth } from "./auth/EtsyOAuth.js";
import { EtsyHttpClient } from "./http/EtsyHttpClient.js";
import { ListingsResource } from "./resources/listings/index.js";
import { CatalogResource } from "./resources/catalog/index.js";
import { ShopResource } from "./resources/shop/index.js";
import { CommerceResource } from "./resources/commerce/index.js";

export interface EtsyClient {
  readonly http: EtsyHttpClient;
  readonly auth?: EtsyOAuth;
  readonly listings: ListingsResource;
  readonly catalog: CatalogResource;
  readonly shop: ShopResource;
  readonly commerce: CommerceResource;
}

/**
 * Constructs an `EtsyClient`: one `EtsyHttpClient` transport shared across
 * all four resource clusters. This is the package's documented entry point
 * — resource classes are also individually exported from `src/index.ts` for
 * consumers who want to construct a narrower client by hand.
 */
export function createEtsyClient(config: EtsyClientConfig): EtsyClient {
  const http = new EtsyHttpClient(config);

  return {
    http,
    ...(config.auth ? { auth: config.auth } : {}),
    listings: new ListingsResource(http),
    catalog: new CatalogResource(http),
    shop: new ShopResource(http),
    commerce: new CommerceResource(http),
  };
}
