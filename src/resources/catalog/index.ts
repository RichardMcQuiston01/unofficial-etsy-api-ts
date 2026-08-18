/**
 * Cluster 2 (Inventory & Catalog) resource module. See
 * docs/ARCHITECTURE.md#resource-module-conventions.
 *
 * Covers: ShopListing Inventory, ShopListing Product, ShopListing Offering,
 * SellerTaxonomy, BuyerTaxonomy, Review.
 */
import type { EtsyHttpClient, RequestOptions } from "../../http/EtsyHttpClient.js";
import type {
  GetBuyerTaxonomyNodesResponse,
  GetListingInventoryParams,
  GetListingInventoryResponse,
  GetListingOfferingResponse,
  GetListingProductParams,
  GetListingProductResponse,
  GetListingsInventoryByListingIdsParams,
  GetListingsInventoryByListingIdsResponse,
  GetPropertiesByBuyerTaxonomyIdResponse,
  GetPropertiesByTaxonomyIdResponse,
  GetReviewsByListingParams,
  GetReviewsByListingResponse,
  GetReviewsByShopParams,
  GetReviewsByShopResponse,
  GetSellerTaxonomyNodesResponse,
  UpdateListingInventoryParams,
  UpdateListingInventoryRequestBody,
  UpdateListingInventoryResponse,
} from "../../generated/operations.js";

type Query = NonNullable<RequestOptions["query"]>;

/**
 * Bridges a generated `...Params["query"]` object into
 * `{ query?: RequestOptions["query"] }`, spread into the request options
 * literal. Two adaptations happen here:
 *  - generated query types sometimes allow `null` for "unset" (e.g.
 *    `min_created`/`max_created` on the Review endpoints), but
 *    `RequestOptions.query` doesn't accept `null` (EtsyHttpClient only
 *    skips `undefined`) — `null` is converted to `undefined` so those
 *    fields are omitted from the querystring rather than serialized as the
 *    literal string "null".
 *  - returns `{}` rather than `{ query: undefined }` when there's nothing
 *    to send, since `exactOptionalPropertyTypes` treats an explicit
 *    `undefined` differently from an omitted key.
 */
function withQuery<T extends Record<string, unknown> | undefined>(
  params: T,
): { query: Query } | Record<string, never> {
  if (!params) return {};
  const query: Query = {};
  for (const [key, value] of Object.entries(params)) {
    query[key] = value === null ? undefined : (value as Query[string]);
  }
  return { query };
}

export class ListingInventoryResource {
  #http: EtsyHttpClient;
  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** GET /v3/application/listings/{listing_id}/inventory (operationId: getListingInventory) */
  get(
    listingId: number,
    params?: GetListingInventoryParams["query"],
  ): Promise<GetListingInventoryResponse> {
    return this.#http.request<GetListingInventoryResponse>({
      method: "GET",
      path: "/v3/application/listings/{listing_id}/inventory",
      pathParams: { listing_id: listingId },
      ...withQuery(params),
      auth: "oauth",
      operationId: "getListingInventory",
    });
  }

  /** PUT /v3/application/listings/{listing_id}/inventory (operationId: updateListingInventory) */
  update(
    listingId: number,
    body: UpdateListingInventoryRequestBody,
    query?: UpdateListingInventoryParams["query"],
  ): Promise<UpdateListingInventoryResponse> {
    return this.#http.request<UpdateListingInventoryResponse>({
      method: "PUT",
      path: "/v3/application/listings/{listing_id}/inventory",
      pathParams: { listing_id: listingId },
      ...withQuery(query),
      body: { kind: "json", data: body },
      auth: "oauth",
      operationId: "updateListingInventory",
    });
  }

  /** GET /v3/application/listings/batch/inventory (operationId: getListingsInventoryByListingIds) */
  getByListingIds(
    params: GetListingsInventoryByListingIdsParams["query"],
  ): Promise<GetListingsInventoryByListingIdsResponse> {
    return this.#http.request<GetListingsInventoryByListingIdsResponse>({
      method: "GET",
      path: "/v3/application/listings/batch/inventory",
      ...withQuery(params),
      auth: "oauth",
      operationId: "getListingsInventoryByListingIds",
    });
  }
}

export class SellerTaxonomyResource {
  #http: EtsyHttpClient;
  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** GET /v3/application/seller-taxonomy/nodes (operationId: getSellerTaxonomyNodes) */
  getNodes(): Promise<GetSellerTaxonomyNodesResponse> {
    return this.#http.request<GetSellerTaxonomyNodesResponse>({
      method: "GET",
      path: "/v3/application/seller-taxonomy/nodes",
      auth: "apiKey",
      operationId: "getSellerTaxonomyNodes",
    });
  }

  /** GET /v3/application/seller-taxonomy/nodes/{taxonomy_id}/properties (operationId: getPropertiesByTaxonomyId) */
  getProperties(taxonomyId: number): Promise<GetPropertiesByTaxonomyIdResponse> {
    return this.#http.request<GetPropertiesByTaxonomyIdResponse>({
      method: "GET",
      path: "/v3/application/seller-taxonomy/nodes/{taxonomy_id}/properties",
      pathParams: { taxonomy_id: taxonomyId },
      auth: "apiKey",
      operationId: "getPropertiesByTaxonomyId",
    });
  }
}

export class BuyerTaxonomyResource {
  #http: EtsyHttpClient;
  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** GET /v3/application/buyer-taxonomy/nodes (operationId: getBuyerTaxonomyNodes) */
  getNodes(): Promise<GetBuyerTaxonomyNodesResponse> {
    return this.#http.request<GetBuyerTaxonomyNodesResponse>({
      method: "GET",
      path: "/v3/application/buyer-taxonomy/nodes",
      auth: "apiKey",
      operationId: "getBuyerTaxonomyNodes",
    });
  }

  /** GET /v3/application/buyer-taxonomy/nodes/{taxonomy_id}/properties (operationId: getPropertiesByBuyerTaxonomyId) */
  getProperties(taxonomyId: number): Promise<GetPropertiesByBuyerTaxonomyIdResponse> {
    return this.#http.request<GetPropertiesByBuyerTaxonomyIdResponse>({
      method: "GET",
      path: "/v3/application/buyer-taxonomy/nodes/{taxonomy_id}/properties",
      pathParams: { taxonomy_id: taxonomyId },
      auth: "apiKey",
      operationId: "getPropertiesByBuyerTaxonomyId",
    });
  }
}

export class ReviewsResource {
  #http: EtsyHttpClient;
  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** GET /v3/application/listings/{listing_id}/reviews (operationId: getReviewsByListing) */
  getByListing(
    listingId: number,
    params?: GetReviewsByListingParams["query"],
  ): Promise<GetReviewsByListingResponse> {
    return this.#http.request<GetReviewsByListingResponse>({
      method: "GET",
      path: "/v3/application/listings/{listing_id}/reviews",
      pathParams: { listing_id: listingId },
      ...withQuery(params),
      auth: "apiKey",
      operationId: "getReviewsByListing",
    });
  }

  /** GET /v3/application/shops/{shop_id}/reviews (operationId: getReviewsByShop) */
  getByShop(
    shopId: number,
    params?: GetReviewsByShopParams["query"],
  ): Promise<GetReviewsByShopResponse> {
    return this.#http.request<GetReviewsByShopResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/reviews",
      pathParams: { shop_id: shopId },
      ...withQuery(params),
      auth: "apiKey",
      operationId: "getReviewsByShop",
    });
  }
}

/**
 * Cluster 2: Inventory & Catalog. Covers ShopListing Inventory/Product/
 * Offering, SellerTaxonomy, BuyerTaxonomy, and Review operations.
 */
export class CatalogResource {
  readonly inventory: ListingInventoryResource;
  readonly sellerTaxonomy: SellerTaxonomyResource;
  readonly buyerTaxonomy: BuyerTaxonomyResource;
  readonly reviews: ReviewsResource;
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
    this.inventory = new ListingInventoryResource(http);
    this.sellerTaxonomy = new SellerTaxonomyResource(http);
    this.buyerTaxonomy = new BuyerTaxonomyResource(http);
    this.reviews = new ReviewsResource(http);
  }

  /**
   * GET /v3/application/listings/{listing_id}/inventory/products/{product_id}
   * (operationId: getListingProduct). Tag "ShopListing Product" has exactly
   * one operation, so it lives directly on CatalogResource rather than a
   * one-method sub-resource class.
   */
  getProduct(
    listingId: number,
    productId: number,
    params?: GetListingProductParams["query"],
  ): Promise<GetListingProductResponse> {
    return this.#http.request<GetListingProductResponse>({
      method: "GET",
      path: "/v3/application/listings/{listing_id}/inventory/products/{product_id}",
      pathParams: { listing_id: listingId, product_id: productId },
      ...withQuery(params),
      auth: "oauth",
      operationId: "getListingProduct",
    });
  }

  /**
   * GET /v3/application/listings/{listing_id}/products/{product_id}/offerings/{product_offering_id}
   * (operationId: getListingOffering). Tag "ShopListing Offering" has
   * exactly one operation, so it lives directly on CatalogResource rather
   * than a one-method sub-resource class.
   */
  getOffering(
    listingId: number,
    productId: number,
    productOfferingId: number,
  ): Promise<GetListingOfferingResponse> {
    return this.#http.request<GetListingOfferingResponse>({
      method: "GET",
      path: "/v3/application/listings/{listing_id}/products/{product_id}/offerings/{product_offering_id}",
      pathParams: {
        listing_id: listingId,
        product_id: productId,
        product_offering_id: productOfferingId,
      },
      auth: "apiKey",
      operationId: "getListingOffering",
    });
  }
}
