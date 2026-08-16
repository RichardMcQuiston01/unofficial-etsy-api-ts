import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  DeleteListingImageResponse,
  GetListingImageResponse,
  GetListingImagesResponse,
  UploadListingImageRequestBody,
  UploadListingImageResponse,
} from "../../generated/operations.js";

/** `ShopListing Image` operations, nested under `listings.images`. */
export class ListingImagesResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** getListingImages: GET /v3/application/listings/{listing_id}/images [auth=apiKey] */
  getAll(listingId: number): Promise<GetListingImagesResponse> {
    return this.#http.request<GetListingImagesResponse>({
      method: "GET",
      path: "/v3/application/listings/{listing_id}/images",
      pathParams: { listing_id: listingId },
      auth: "apiKey",
      operationId: "getListingImages",
    });
  }

  /** getListingImage: GET /v3/application/listings/{listing_id}/images/{listing_image_id} [auth=apiKey] */
  get(listingId: number, listingImageId: number): Promise<GetListingImageResponse> {
    return this.#http.request<GetListingImageResponse>({
      method: "GET",
      path: "/v3/application/listings/{listing_id}/images/{listing_image_id}",
      pathParams: { listing_id: listingId, listing_image_id: listingImageId },
      auth: "apiKey",
      operationId: "getListingImage",
    });
  }

  /** uploadListingImage: POST /v3/application/shops/{shop_id}/listings/{listing_id}/images [auth=oauth] */
  upload(
    shopId: number,
    listingId: number,
    body: UploadListingImageRequestBody,
  ): Promise<UploadListingImageResponse> {
    return this.#http.request<UploadListingImageResponse>({
      method: "POST",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/images",
      pathParams: { shop_id: shopId, listing_id: listingId },
      body: { kind: "multipart", data: body },
      auth: "oauth",
      operationId: "uploadListingImage",
    });
  }

  /** deleteListingImage: DELETE /v3/application/shops/{shop_id}/listings/{listing_id}/images/{listing_image_id} [auth=oauth] */
  delete(
    shopId: number,
    listingId: number,
    listingImageId: number,
  ): Promise<DeleteListingImageResponse> {
    return this.#http.request<DeleteListingImageResponse>({
      method: "DELETE",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/images/{listing_image_id}",
      pathParams: { shop_id: shopId, listing_id: listingId, listing_image_id: listingImageId },
      auth: "oauth",
      operationId: "deleteListingImage",
    });
  }
}
