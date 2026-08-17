import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  CreateListingTranslationRequestBody,
  CreateListingTranslationResponse,
  GetListingTranslationResponse,
  UpdateListingTranslationRequestBody,
  UpdateListingTranslationResponse,
} from "../../generated/operations.js";

/** `ShopListing Translation` operations, nested under `listings.translations`. */
export class ListingTranslationsResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** getListingTranslation: GET /v3/application/shops/{shop_id}/listings/{listing_id}/translations/{language} [auth=apiKey] */
  get(shopId: number, listingId: number, language: string): Promise<GetListingTranslationResponse> {
    return this.#http.request<GetListingTranslationResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/translations/{language}",
      pathParams: { shop_id: shopId, listing_id: listingId, language },
      auth: "apiKey",
      operationId: "getListingTranslation",
    });
  }

  /** createListingTranslation: POST /v3/application/shops/{shop_id}/listings/{listing_id}/translations/{language} [auth=oauth] */
  create(
    shopId: number,
    listingId: number,
    language: string,
    body: CreateListingTranslationRequestBody,
  ): Promise<CreateListingTranslationResponse> {
    return this.#http.request<CreateListingTranslationResponse>({
      method: "POST",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/translations/{language}",
      pathParams: { shop_id: shopId, listing_id: listingId, language },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "createListingTranslation",
    });
  }

  /** updateListingTranslation: PUT /v3/application/shops/{shop_id}/listings/{listing_id}/translations/{language} [auth=oauth] */
  update(
    shopId: number,
    listingId: number,
    language: string,
    body: UpdateListingTranslationRequestBody,
  ): Promise<UpdateListingTranslationResponse> {
    return this.#http.request<UpdateListingTranslationResponse>({
      method: "PUT",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/translations/{language}",
      pathParams: { shop_id: shopId, listing_id: listingId, language },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "updateListingTranslation",
    });
  }
}
