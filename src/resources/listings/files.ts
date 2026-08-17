import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  DeleteListingFileResponse,
  GetAllListingFilesResponse,
  GetListingFileResponse,
  UploadListingFileRequestBody,
  UploadListingFileResponse,
} from "../../generated/operations.js";

/** `ShopListing File` operations, nested under `listings.files`. */
export class ListingFilesResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** getAllListingFiles: GET /v3/application/shops/{shop_id}/listings/{listing_id}/files [auth=oauth] */
  getAll(shopId: number, listingId: number): Promise<GetAllListingFilesResponse> {
    return this.#http.request<GetAllListingFilesResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/files",
      pathParams: { shop_id: shopId, listing_id: listingId },
      auth: "oauth",
      operationId: "getAllListingFiles",
    });
  }

  /** getListingFile: GET /v3/application/shops/{shop_id}/listings/{listing_id}/files/{listing_file_id} [auth=oauth] */
  get(shopId: number, listingId: number, listingFileId: number): Promise<GetListingFileResponse> {
    return this.#http.request<GetListingFileResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/files/{listing_file_id}",
      pathParams: { shop_id: shopId, listing_id: listingId, listing_file_id: listingFileId },
      auth: "oauth",
      operationId: "getListingFile",
    });
  }

  /** uploadListingFile: POST /v3/application/shops/{shop_id}/listings/{listing_id}/files [auth=oauth] */
  upload(
    shopId: number,
    listingId: number,
    body: UploadListingFileRequestBody,
  ): Promise<UploadListingFileResponse> {
    return this.#http.request<UploadListingFileResponse>({
      method: "POST",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/files",
      pathParams: { shop_id: shopId, listing_id: listingId },
      body: { kind: "multipart", data: body },
      auth: "oauth",
      operationId: "uploadListingFile",
    });
  }

  /** deleteListingFile: DELETE /v3/application/shops/{shop_id}/listings/{listing_id}/files/{listing_file_id} [auth=oauth] */
  delete(
    shopId: number,
    listingId: number,
    listingFileId: number,
  ): Promise<DeleteListingFileResponse> {
    return this.#http.request<DeleteListingFileResponse>({
      method: "DELETE",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/files/{listing_file_id}",
      pathParams: { shop_id: shopId, listing_id: listingId, listing_file_id: listingFileId },
      auth: "oauth",
      operationId: "deleteListingFile",
    });
  }
}
