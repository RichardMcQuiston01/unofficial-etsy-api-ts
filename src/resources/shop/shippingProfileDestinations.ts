import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  CreateShopShippingProfileDestinationRequestBody,
  CreateShopShippingProfileDestinationResponse,
  DeleteShopShippingProfileDestinationResponse,
  GetShopShippingProfileDestinationsByShippingProfileParams,
  GetShopShippingProfileDestinationsByShippingProfileResponse,
  UpdateShopShippingProfileDestinationRequestBody,
  UpdateShopShippingProfileDestinationResponse,
} from "../../generated/operations.js";

const BASE_PATH =
  "/v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}/destinations";
const ITEM_PATH =
  "/v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}/destinations/{shipping_profile_destination_id}";

/**
 * `Shop ShippingProfile` tag (destinations sub-resource) —
 * src/resources/shop/index.ts `ShopResource.shippingProfiles.destinations`.
 */
export class ShopShippingProfileDestinationsResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** operationId: createShopShippingProfileDestination */
  create(
    shopId: number,
    shippingProfileId: number,
    body: CreateShopShippingProfileDestinationRequestBody,
  ): Promise<CreateShopShippingProfileDestinationResponse> {
    return this.#http.request<CreateShopShippingProfileDestinationResponse>({
      method: "POST",
      path: BASE_PATH,
      pathParams: { shop_id: shopId, shipping_profile_id: shippingProfileId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "createShopShippingProfileDestination",
    });
  }

  /** operationId: getShopShippingProfileDestinationsByShippingProfile */
  getAll(
    shopId: number,
    shippingProfileId: number,
    params?: GetShopShippingProfileDestinationsByShippingProfileParams["query"],
  ): Promise<GetShopShippingProfileDestinationsByShippingProfileResponse> {
    return this.#http.request<GetShopShippingProfileDestinationsByShippingProfileResponse>({
      method: "GET",
      path: BASE_PATH,
      pathParams: { shop_id: shopId, shipping_profile_id: shippingProfileId },
      ...(params ? { query: params } : {}),
      auth: "oauth",
      operationId: "getShopShippingProfileDestinationsByShippingProfile",
    });
  }

  /** operationId: updateShopShippingProfileDestination */
  update(
    shopId: number,
    shippingProfileId: number,
    destinationId: number,
    body: UpdateShopShippingProfileDestinationRequestBody,
  ): Promise<UpdateShopShippingProfileDestinationResponse> {
    return this.#http.request<UpdateShopShippingProfileDestinationResponse>({
      method: "PUT",
      path: ITEM_PATH,
      pathParams: {
        shop_id: shopId,
        shipping_profile_id: shippingProfileId,
        shipping_profile_destination_id: destinationId,
      },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "updateShopShippingProfileDestination",
    });
  }

  /** operationId: deleteShopShippingProfileDestination */
  delete(
    shopId: number,
    shippingProfileId: number,
    destinationId: number,
  ): Promise<DeleteShopShippingProfileDestinationResponse> {
    return this.#http.request<DeleteShopShippingProfileDestinationResponse>({
      method: "DELETE",
      path: ITEM_PATH,
      pathParams: {
        shop_id: shopId,
        shipping_profile_id: shippingProfileId,
        shipping_profile_destination_id: destinationId,
      },
      auth: "oauth",
      operationId: "deleteShopShippingProfileDestination",
    });
  }
}
