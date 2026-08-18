import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  DeleteListingVideoResponse,
  GetListingVideoResponse,
  GetListingVideosResponse,
  UploadListingVideoRequestBody,
  UploadListingVideoResponse,
} from "../../generated/operations.js";

/** UploadListingVideoRequestBody with `video` corrected to `Blob | null` — the generated
 *  type says `string | null` (openapi-typescript's mapping for `format: binary`), but the
 *  real wire value is a Blob, which EtsyHttpClient's multipart builder passes through as-is. */
export type UploadListingVideoInput = Omit<UploadListingVideoRequestBody, "video"> & {
  video?: Blob | null;
};

/** `ShopListing Video` operations, nested under `listings.videos`. */
export class ListingVideosResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** getListingVideos: GET /v3/application/listings/{listing_id}/videos [auth=apiKey] */
  getAll(listingId: number): Promise<GetListingVideosResponse> {
    return this.#http.request<GetListingVideosResponse>({
      method: "GET",
      path: "/v3/application/listings/{listing_id}/videos",
      pathParams: { listing_id: listingId },
      auth: "apiKey",
      operationId: "getListingVideos",
    });
  }

  /** getListingVideo: GET /v3/application/listings/{listing_id}/videos/{video_id} [auth=apiKey] */
  get(listingId: number, videoId: number): Promise<GetListingVideoResponse> {
    return this.#http.request<GetListingVideoResponse>({
      method: "GET",
      path: "/v3/application/listings/{listing_id}/videos/{video_id}",
      pathParams: { listing_id: listingId, video_id: videoId },
      auth: "apiKey",
      operationId: "getListingVideo",
    });
  }

  /** uploadListingVideo: POST /v3/application/shops/{shop_id}/listings/{listing_id}/videos [auth=oauth] */
  upload(
    shopId: number,
    listingId: number,
    body: UploadListingVideoInput,
  ): Promise<UploadListingVideoResponse> {
    return this.#http.request<UploadListingVideoResponse>({
      method: "POST",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/videos",
      pathParams: { shop_id: shopId, listing_id: listingId },
      body: { kind: "multipart", data: body },
      auth: "oauth",
      operationId: "uploadListingVideo",
    });
  }

  /** deleteListingVideo: DELETE /v3/application/shops/{shop_id}/listings/{listing_id}/videos/{video_id} [auth=oauth] */
  delete(shopId: number, listingId: number, videoId: number): Promise<DeleteListingVideoResponse> {
    return this.#http.request<DeleteListingVideoResponse>({
      method: "DELETE",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/videos/{video_id}",
      pathParams: { shop_id: shopId, listing_id: listingId, video_id: videoId },
      auth: "oauth",
      operationId: "deleteListingVideo",
    });
  }
}
