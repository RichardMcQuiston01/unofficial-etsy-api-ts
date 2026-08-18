import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  DeleteListingPersonalizationResponse,
  GetListingPersonalizationResponse,
  UpdateListingPersonalizationParams,
  UpdateListingPersonalizationRequestBody,
  UpdateListingPersonalizationResponse,
} from "../../generated/operations.js";

/** `ShopListing Personalization` operations, nested under `listings.personalization`. */
export class ListingPersonalizationResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** getListingPersonalization: GET /v3/application/listings/{listing_id}/personalization [auth=apiKey] */
  get(listingId: number): Promise<GetListingPersonalizationResponse> {
    return this.#http.request<GetListingPersonalizationResponse>({
      method: "GET",
      path: "/v3/application/listings/{listing_id}/personalization",
      pathParams: { listing_id: listingId },
      auth: "apiKey",
      operationId: "getListingPersonalization",
    });
  }

  /**
   * updateListingPersonalization: POST /v3/application/shops/{shop_id}/listings/{listing_id}/personalization [auth=oauth]
   * Upsert semantics (creates the personalization config on first call, replaces it thereafter) —
   * named `update()` rather than `create()` to reflect that, per the task brief.
   */
  update(
    shopId: number,
    listingId: number,
    body: UpdateListingPersonalizationRequestBody,
    query?: UpdateListingPersonalizationParams["query"],
  ): Promise<UpdateListingPersonalizationResponse> {
    // The generated query type allows `boolean | null`; EtsyHttpClient's
    // RequestOptions.query value union has no `null` member (only
    // string/number/boolean/array/undefined), so a `null` here is normalized
    // to "omit the param" rather than forwarded as a literal null.
    const supportsMultiple = query?.supports_multiple_personalization_questions;
    return this.#http.request<UpdateListingPersonalizationResponse>({
      method: "POST",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/personalization",
      pathParams: { shop_id: shopId, listing_id: listingId },
      ...(supportsMultiple !== undefined && supportsMultiple !== null
        ? { query: { supports_multiple_personalization_questions: supportsMultiple } }
        : {}),
      body: { kind: "json", data: body },
      auth: "oauth",
      operationId: "updateListingPersonalization",
    });
  }

  /** deleteListingPersonalization: DELETE /v3/application/shops/{shop_id}/listings/{listing_id}/personalization [auth=oauth] */
  delete(shopId: number, listingId: number): Promise<DeleteListingPersonalizationResponse> {
    return this.#http.request<DeleteListingPersonalizationResponse>({
      method: "DELETE",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/personalization",
      pathParams: { shop_id: shopId, listing_id: listingId },
      auth: "oauth",
      operationId: "deleteListingPersonalization",
    });
  }
}
