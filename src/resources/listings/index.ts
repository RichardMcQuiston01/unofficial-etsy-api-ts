import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  CreateDraftListingRequestBody,
  CreateDraftListingResponse,
  DeleteListingPropertyResponse,
  DeleteListingResponse,
  FindAllActiveListingsByShopParams,
  FindAllActiveListingsByShopResponse,
  FindAllListingsActiveParams,
  FindAllListingsActiveResponse,
  GetFeaturedListingsByShopParams,
  GetFeaturedListingsByShopResponse,
  GetListingParams,
  GetListingPropertiesResponse,
  GetListingPropertyResponse,
  GetListingResponse,
  GetListingsByListingIdsParams,
  GetListingsByListingIdsResponse,
  GetListingsByShopParams,
  GetListingsByShopReceiptParams,
  GetListingsByShopReceiptResponse,
  GetListingsByShopResponse,
  GetListingsByShopReturnPolicyParams,
  GetListingsByShopReturnPolicyResponse,
  GetListingsByShopSectionIdParams,
  GetListingsByShopSectionIdResponse,
  GetListingsShippingByListingIdsParams,
  GetListingsShippingByListingIdsResponse,
  UpdateListingPropertyRequestBody,
  UpdateListingPropertyResponse,
  UpdateListingRequestBody,
  UpdateListingResponse,
} from "../../generated/operations.js";
import { ListingFilesResource } from "./files.js";
import { ListingImagesResource } from "./images.js";
import { ListingPersonalizationResource } from "./personalization.js";
import { ListingTranslationsResource } from "./translations.js";
import { ListingVariationImagesResource } from "./variationImages.js";
import { ListingVideosResource } from "./videos.js";

export { ListingFilesResource } from "./files.js";
export { ListingImagesResource } from "./images.js";
export { ListingPersonalizationResource } from "./personalization.js";
export { ListingTranslationsResource } from "./translations.js";
export { ListingVariationImagesResource } from "./variationImages.js";
export { ListingVideosResource } from "./videos.js";

/**
 * `ShopListing` (+ nested File/Image/Video/VariationImage/Translation/
 * Personalization) resource cluster. See docs/ARCHITECTURE.md for the
 * module contract every method here follows.
 */
export class ListingsResource {
  readonly files: ListingFilesResource;
  readonly images: ListingImagesResource;
  readonly videos: ListingVideosResource;
  readonly variationImages: ListingVariationImagesResource;
  readonly translations: ListingTranslationsResource;
  readonly personalization: ListingPersonalizationResource;
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
    this.files = new ListingFilesResource(http);
    this.images = new ListingImagesResource(http);
    this.videos = new ListingVideosResource(http);
    this.variationImages = new ListingVariationImagesResource(http);
    this.translations = new ListingTranslationsResource(http);
    this.personalization = new ListingPersonalizationResource(http);
  }

  /** createDraftListing: POST /v3/application/shops/{shop_id}/listings [auth=oauth] */
  create(shopId: number, body: CreateDraftListingRequestBody): Promise<CreateDraftListingResponse> {
    return this.#http.request<CreateDraftListingResponse>({
      method: "POST",
      path: "/v3/application/shops/{shop_id}/listings",
      pathParams: { shop_id: shopId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "createDraftListing",
    });
  }

  /** getListing: GET /v3/application/listings/{listing_id} [auth=apiKey] */
  get(listingId: number, params?: GetListingParams["query"]): Promise<GetListingResponse> {
    return this.#http.request<GetListingResponse>({
      method: "GET",
      path: "/v3/application/listings/{listing_id}",
      pathParams: { listing_id: listingId },
      ...(params ? { query: params } : {}),
      auth: "apiKey",
      operationId: "getListing",
    });
  }

  /** deleteListing: DELETE /v3/application/listings/{listing_id} [auth=oauth] */
  delete(listingId: number): Promise<DeleteListingResponse> {
    return this.#http.request<DeleteListingResponse>({
      method: "DELETE",
      path: "/v3/application/listings/{listing_id}",
      pathParams: { listing_id: listingId },
      auth: "oauth",
      operationId: "deleteListing",
    });
  }

  /** updateListing: PATCH /v3/application/shops/{shop_id}/listings/{listing_id} [auth=oauth] */
  update(
    shopId: number,
    listingId: number,
    body: UpdateListingRequestBody,
  ): Promise<UpdateListingResponse> {
    return this.#http.request<UpdateListingResponse>({
      method: "PATCH",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}",
      pathParams: { shop_id: shopId, listing_id: listingId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "updateListing",
    });
  }

  /** getListingsByShop: GET /v3/application/shops/{shop_id}/listings [auth=oauth] */
  getByShop(
    shopId: number,
    params?: GetListingsByShopParams["query"],
  ): Promise<GetListingsByShopResponse> {
    return this.#http.request<GetListingsByShopResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/listings",
      pathParams: { shop_id: shopId },
      ...(params ? { query: params } : {}),
      auth: "oauth",
      operationId: "getListingsByShop",
    });
  }

  /** findAllListingsActive: GET /v3/application/listings/active [auth=apiKey] */
  findAllActive(
    params?: FindAllListingsActiveParams["query"],
  ): Promise<FindAllListingsActiveResponse> {
    return this.#http.request<FindAllListingsActiveResponse>({
      method: "GET",
      path: "/v3/application/listings/active",
      ...(params ? { query: params } : {}),
      auth: "apiKey",
      operationId: "findAllListingsActive",
    });
  }

  /** findAllActiveListingsByShop: GET /v3/application/shops/{shop_id}/listings/active [auth=apiKey] */
  findAllActiveByShop(
    shopId: number,
    params?: FindAllActiveListingsByShopParams["query"],
  ): Promise<FindAllActiveListingsByShopResponse> {
    return this.#http.request<FindAllActiveListingsByShopResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/listings/active",
      pathParams: { shop_id: shopId },
      ...(params ? { query: params } : {}),
      auth: "apiKey",
      operationId: "findAllActiveListingsByShop",
    });
  }

  /** getFeaturedListingsByShop: GET /v3/application/shops/{shop_id}/listings/featured [auth=apiKey] */
  getFeaturedByShop(
    shopId: number,
    params?: GetFeaturedListingsByShopParams["query"],
  ): Promise<GetFeaturedListingsByShopResponse> {
    return this.#http.request<GetFeaturedListingsByShopResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/listings/featured",
      pathParams: { shop_id: shopId },
      ...(params ? { query: params } : {}),
      auth: "apiKey",
      operationId: "getFeaturedListingsByShop",
    });
  }

  /** getListingsByListingIds: GET /v3/application/listings/batch [auth=apiKey] */
  getByListingIds(
    params: GetListingsByListingIdsParams["query"],
  ): Promise<GetListingsByListingIdsResponse> {
    return this.#http.request<GetListingsByListingIdsResponse>({
      method: "GET",
      path: "/v3/application/listings/batch",
      query: params,
      auth: "apiKey",
      operationId: "getListingsByListingIds",
    });
  }

  /** getListingsShippingByListingIds: GET /v3/application/listings/batch/shipping [auth=oauth] */
  getShippingByListingIds(
    params: GetListingsShippingByListingIdsParams["query"],
  ): Promise<GetListingsShippingByListingIdsResponse> {
    return this.#http.request<GetListingsShippingByListingIdsResponse>({
      method: "GET",
      path: "/v3/application/listings/batch/shipping",
      query: params,
      auth: "oauth",
      operationId: "getListingsShippingByListingIds",
    });
  }

  /** getListingsByShopReceipt: GET /v3/application/shops/{shop_id}/receipts/{receipt_id}/listings [auth=oauth] */
  getByShopReceipt(
    shopId: number,
    receiptId: number,
    params?: GetListingsByShopReceiptParams["query"],
  ): Promise<GetListingsByShopReceiptResponse> {
    return this.#http.request<GetListingsByShopReceiptResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/receipts/{receipt_id}/listings",
      pathParams: { shop_id: shopId, receipt_id: receiptId },
      ...(params ? { query: params } : {}),
      auth: "oauth",
      operationId: "getListingsByShopReceipt",
    });
  }

  /** getListingsByShopReturnPolicy: GET /v3/application/shops/{shop_id}/policies/return/{return_policy_id}/listings [auth=oauth] */
  getByShopReturnPolicy(
    shopId: number,
    returnPolicyId: number,
    params?: GetListingsByShopReturnPolicyParams["query"],
  ): Promise<GetListingsByShopReturnPolicyResponse> {
    return this.#http.request<GetListingsByShopReturnPolicyResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/policies/return/{return_policy_id}/listings",
      pathParams: { shop_id: shopId, return_policy_id: returnPolicyId },
      ...(params ? { query: params } : {}),
      auth: "oauth",
      operationId: "getListingsByShopReturnPolicy",
    });
  }

  /**
   * getListingsByShopSectionId: GET /v3/application/shops/{shop_id}/shop-sections/listings [auth=apiKey]
   * `shop_section_ids` is a required query array (not a path segment) per
   * the generated `GetListingsByShopSectionIdParams["query"]` shape.
   */
  getByShopSectionId(
    shopId: number,
    params: GetListingsByShopSectionIdParams["query"],
  ): Promise<GetListingsByShopSectionIdResponse> {
    return this.#http.request<GetListingsByShopSectionIdResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/shop-sections/listings",
      pathParams: { shop_id: shopId },
      query: params,
      auth: "apiKey",
      operationId: "getListingsByShopSectionId",
    });
  }

  /** getListingProperties: GET /v3/application/shops/{shop_id}/listings/{listing_id}/properties [auth=apiKey] */
  getProperties(shopId: number, listingId: number): Promise<GetListingPropertiesResponse> {
    return this.#http.request<GetListingPropertiesResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/properties",
      pathParams: { shop_id: shopId, listing_id: listingId },
      auth: "apiKey",
      operationId: "getListingProperties",
    });
  }

  /** getListingProperty: GET /v3/application/listings/{listing_id}/properties/{property_id} [auth=apiKey] */
  getProperty(listingId: number, propertyId: number): Promise<GetListingPropertyResponse> {
    return this.#http.request<GetListingPropertyResponse>({
      method: "GET",
      path: "/v3/application/listings/{listing_id}/properties/{property_id}",
      pathParams: { listing_id: listingId, property_id: propertyId },
      auth: "apiKey",
      operationId: "getListingProperty",
    });
  }

  /** updateListingProperty: PUT /v3/application/shops/{shop_id}/listings/{listing_id}/properties/{property_id} [auth=oauth] */
  updateProperty(
    shopId: number,
    listingId: number,
    propertyId: number,
    body: UpdateListingPropertyRequestBody,
  ): Promise<UpdateListingPropertyResponse> {
    return this.#http.request<UpdateListingPropertyResponse>({
      method: "PUT",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/properties/{property_id}",
      pathParams: { shop_id: shopId, listing_id: listingId, property_id: propertyId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "updateListingProperty",
    });
  }

  /** deleteListingProperty: DELETE /v3/application/shops/{shop_id}/listings/{listing_id}/properties/{property_id} [auth=oauth] */
  deleteProperty(
    shopId: number,
    listingId: number,
    propertyId: number,
  ): Promise<DeleteListingPropertyResponse> {
    return this.#http.request<DeleteListingPropertyResponse>({
      method: "DELETE",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/properties/{property_id}",
      pathParams: { shop_id: shopId, listing_id: listingId, property_id: propertyId },
      auth: "oauth",
      operationId: "deleteListingProperty",
    });
  }
}
