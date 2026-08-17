/**
 * @richardmcquiston01/etsy-api — public entry point.
 */
export { createEtsyClient } from "./client.js";
export type { EtsyClient } from "./client.js";

export type { EtsyClientConfig, RetryConfig } from "./config.js";

export { EtsyHttpClient } from "./http/EtsyHttpClient.js";
export type { RequestBody, RequestOptions } from "./http/EtsyHttpClient.js";
export { EtsyApiError } from "./http/EtsyApiError.js";
export type { EtsyApiErrorOptions, RateLimitSnapshot } from "./http/EtsyApiError.js";
export { paginate } from "./http/pagination.js";
export type { PaginatedResult, PaginationParams } from "./http/pagination.js";

export { EtsyOAuth } from "./auth/EtsyOAuth.js";
export type { EtsyOAuthConfig, PkceChallenge } from "./auth/EtsyOAuth.js";
export { InMemoryTokenStore } from "./auth/TokenStore.js";
export type { EtsyScope, TokenSet, TokenStore } from "./auth/TokenStore.js";

export { ListingsResource } from "./resources/listings/index.js";
export {
  ListingFilesResource,
  ListingImagesResource,
  ListingPersonalizationResource,
  ListingTranslationsResource,
  ListingVariationImagesResource,
  ListingVideosResource,
} from "./resources/listings/index.js";

export { CatalogResource } from "./resources/catalog/index.js";

export { ShopResource } from "./resources/shop/index.js";
export {
  ShopSectionsResource,
  ShopShippingProfilesResource,
  ShopShippingProfileDestinationsResource,
  ShopShippingProfileUpgradesResource,
  ShopReturnPoliciesResource,
  ShopProcessingProfilesResource,
  ShopHolidayPreferencesResource,
  ShopProductionPartnersResource,
} from "./resources/shop/index.js";

export { CommerceResource } from "./resources/commerce/index.js";
export {
  LedgerEntriesResource,
  PaymentsResource,
  ShopReceiptsResource,
  ShopReceiptTransactionsResource,
  UserResource,
  UserAddressesResource,
} from "./resources/commerce/index.js";
