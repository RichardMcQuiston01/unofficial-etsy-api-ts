import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  GetListingVariationImagesResponse,
  UpdateVariationImagesRequestBody,
  UpdateVariationImagesResponse,
} from "../../generated/operations.js";

/** `ShopListing VariationImage` operations, nested under `listings.variationImages`. */
export class ListingVariationImagesResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** getListingVariationImages: GET /v3/application/shops/{shop_id}/listings/{listing_id}/variation-images [auth=apiKey] */
  getAll(shopId: number, listingId: number): Promise<GetListingVariationImagesResponse> {
    return this.#http.request<GetListingVariationImagesResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/variation-images",
      pathParams: { shop_id: shopId, listing_id: listingId },
      auth: "apiKey",
      operationId: "getListingVariationImages",
    });
  }

  /** updateVariationImages: POST /v3/application/shops/{shop_id}/listings/{listing_id}/variation-images [auth=oauth] */
  update(
    shopId: number,
    listingId: number,
    body: UpdateVariationImagesRequestBody,
  ): Promise<UpdateVariationImagesResponse> {
    return this.#http.request<UpdateVariationImagesResponse>({
      method: "POST",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/variation-images",
      pathParams: { shop_id: shopId, listing_id: listingId },
      body: { kind: "json", data: body },
      auth: "oauth",
      operationId: "updateVariationImages",
    });
  }
}
