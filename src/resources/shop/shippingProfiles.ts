import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  CreateShopShippingProfileRequestBody,
  CreateShopShippingProfileResponse,
  DeleteShopShippingProfileResponse,
  GetShippingCarriersParams,
  GetShippingCarriersResponse,
  GetShopShippingProfileResponse,
  GetShopShippingProfilesResponse,
  UpdateShopShippingProfileRequestBody,
  UpdateShopShippingProfileResponse,
} from "../../generated/operations.js";
import { ShopShippingProfileDestinationsResource } from "./shippingProfileDestinations.js";
import { ShopShippingProfileUpgradesResource } from "./shippingProfileUpgrades.js";

const BASE_PATH = "/v3/application/shops/{shop_id}/shipping-profiles";
const ITEM_PATH = "/v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}";

/**
 * `Shop ShippingProfile` tag — src/resources/shop/index.ts `ShopResource.shippingProfiles`.
 * Nests `destinations` and `upgrades` sub-resources.
 */
export class ShopShippingProfilesResource {
  readonly destinations: ShopShippingProfileDestinationsResource;
  readonly upgrades: ShopShippingProfileUpgradesResource;
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
    this.destinations = new ShopShippingProfileDestinationsResource(http);
    this.upgrades = new ShopShippingProfileUpgradesResource(http);
  }

  /**
   * operationId: getShippingCarriers
   * Not shop-scoped (no shop_id path param) — grouped here only because its
   * OpenAPI tag is `Shop ShippingProfile`.
   */
  getCarriers(params: GetShippingCarriersParams["query"]): Promise<GetShippingCarriersResponse> {
    return this.#http.request<GetShippingCarriersResponse>({
      method: "GET",
      path: "/v3/application/shipping-carriers",
      query: params,
      auth: "apiKey",
      operationId: "getShippingCarriers",
    });
  }

  /** operationId: createShopShippingProfile */
  create(
    shopId: number,
    body: CreateShopShippingProfileRequestBody,
  ): Promise<CreateShopShippingProfileResponse> {
    return this.#http.request<CreateShopShippingProfileResponse>({
      method: "POST",
      path: BASE_PATH,
      pathParams: { shop_id: shopId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "createShopShippingProfile",
    });
  }

  /** operationId: getShopShippingProfiles */
  getAll(shopId: number): Promise<GetShopShippingProfilesResponse> {
    return this.#http.request<GetShopShippingProfilesResponse>({
      method: "GET",
      path: BASE_PATH,
      pathParams: { shop_id: shopId },
      auth: "oauth",
      operationId: "getShopShippingProfiles",
    });
  }

  /** operationId: getShopShippingProfile */
  get(shopId: number, shippingProfileId: number): Promise<GetShopShippingProfileResponse> {
    return this.#http.request<GetShopShippingProfileResponse>({
      method: "GET",
      path: ITEM_PATH,
      pathParams: { shop_id: shopId, shipping_profile_id: shippingProfileId },
      auth: "oauth",
      operationId: "getShopShippingProfile",
    });
  }

  /** operationId: updateShopShippingProfile */
  update(
    shopId: number,
    shippingProfileId: number,
    body: UpdateShopShippingProfileRequestBody,
  ): Promise<UpdateShopShippingProfileResponse> {
    return this.#http.request<UpdateShopShippingProfileResponse>({
      method: "PUT",
      path: ITEM_PATH,
      pathParams: { shop_id: shopId, shipping_profile_id: shippingProfileId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "updateShopShippingProfile",
    });
  }

  /** operationId: deleteShopShippingProfile */
  delete(shopId: number, shippingProfileId: number): Promise<DeleteShopShippingProfileResponse> {
    return this.#http.request<DeleteShopShippingProfileResponse>({
      method: "DELETE",
      path: ITEM_PATH,
      pathParams: { shop_id: shopId, shipping_profile_id: shippingProfileId },
      auth: "oauth",
      operationId: "deleteShopShippingProfile",
    });
  }
}
