import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  CreateShopShippingProfileUpgradeRequestBody,
  CreateShopShippingProfileUpgradeResponse,
  DeleteShopShippingProfileUpgradeResponse,
  GetShopShippingProfileUpgradesResponse,
  UpdateShopShippingProfileUpgradeRequestBody,
  UpdateShopShippingProfileUpgradeResponse,
} from "../../generated/operations.js";

const BASE_PATH =
  "/v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}/upgrades";
const ITEM_PATH =
  "/v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}/upgrades/{upgrade_id}";

/**
 * `Shop ShippingProfile` tag (upgrades sub-resource) —
 * src/resources/shop/index.ts `ShopResource.shippingProfiles.upgrades`.
 */
export class ShopShippingProfileUpgradesResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** operationId: createShopShippingProfileUpgrade */
  create(
    shopId: number,
    shippingProfileId: number,
    body: CreateShopShippingProfileUpgradeRequestBody,
  ): Promise<CreateShopShippingProfileUpgradeResponse> {
    return this.#http.request<CreateShopShippingProfileUpgradeResponse>({
      method: "POST",
      path: BASE_PATH,
      pathParams: { shop_id: shopId, shipping_profile_id: shippingProfileId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "createShopShippingProfileUpgrade",
    });
  }

  /** operationId: getShopShippingProfileUpgrades */
  getAll(
    shopId: number,
    shippingProfileId: number,
  ): Promise<GetShopShippingProfileUpgradesResponse> {
    return this.#http.request<GetShopShippingProfileUpgradesResponse>({
      method: "GET",
      path: BASE_PATH,
      pathParams: { shop_id: shopId, shipping_profile_id: shippingProfileId },
      auth: "oauth",
      operationId: "getShopShippingProfileUpgrades",
    });
  }

  /** operationId: updateShopShippingProfileUpgrade */
  update(
    shopId: number,
    shippingProfileId: number,
    upgradeId: number,
    body: UpdateShopShippingProfileUpgradeRequestBody,
  ): Promise<UpdateShopShippingProfileUpgradeResponse> {
    return this.#http.request<UpdateShopShippingProfileUpgradeResponse>({
      method: "PUT",
      path: ITEM_PATH,
      pathParams: {
        shop_id: shopId,
        shipping_profile_id: shippingProfileId,
        upgrade_id: upgradeId,
      },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "updateShopShippingProfileUpgrade",
    });
  }

  /** operationId: deleteShopShippingProfileUpgrade */
  delete(
    shopId: number,
    shippingProfileId: number,
    upgradeId: number,
  ): Promise<DeleteShopShippingProfileUpgradeResponse> {
    return this.#http.request<DeleteShopShippingProfileUpgradeResponse>({
      method: "DELETE",
      path: ITEM_PATH,
      pathParams: {
        shop_id: shopId,
        shipping_profile_id: shippingProfileId,
        upgrade_id: upgradeId,
      },
      auth: "oauth",
      operationId: "deleteShopShippingProfileUpgrade",
    });
  }
}
