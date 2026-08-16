import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  FindShopsParams,
  FindShopsResponse,
  GetShopByOwnerUserIdResponse,
  GetShopResponse,
  UpdateShopRequestBody,
  UpdateShopResponse,
} from "../../generated/operations.js";
import { ShopSectionsResource } from "./sections.js";
import { ShopShippingProfilesResource } from "./shippingProfiles.js";
import { ShopReturnPoliciesResource } from "./returnPolicies.js";
import { ShopProcessingProfilesResource } from "./processingProfiles.js";
import { ShopHolidayPreferencesResource } from "./holidayPreferences.js";
import { ShopProductionPartnersResource } from "./productionPartners.js";

export { ShopSectionsResource } from "./sections.js";
export { ShopShippingProfilesResource } from "./shippingProfiles.js";
export { ShopShippingProfileDestinationsResource } from "./shippingProfileDestinations.js";
export { ShopShippingProfileUpgradesResource } from "./shippingProfileUpgrades.js";
export { ShopReturnPoliciesResource } from "./returnPolicies.js";
export { ShopProcessingProfilesResource } from "./processingProfiles.js";
export { ShopHolidayPreferencesResource } from "./holidayPreferences.js";
export { ShopProductionPartnersResource } from "./productionPartners.js";

/**
 * Cluster 3 (Shop Configuration) facade — `Shop`, `Shop Section`,
 * `Shop ShippingProfile`, `Shop Return Policy`, `Shop ProcessingProfiles`,
 * `Shop HolidayPreferences`, `Shop ProductionPartner`. See
 * docs/ARCHITECTURE.md for the module boundary contract.
 */
export class ShopResource {
  readonly sections: ShopSectionsResource;
  readonly shippingProfiles: ShopShippingProfilesResource;
  readonly returnPolicies: ShopReturnPoliciesResource;
  readonly processingProfiles: ShopProcessingProfilesResource;
  readonly holidayPreferences: ShopHolidayPreferencesResource;
  readonly productionPartners: ShopProductionPartnersResource;
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
    this.sections = new ShopSectionsResource(http);
    this.shippingProfiles = new ShopShippingProfilesResource(http);
    this.returnPolicies = new ShopReturnPoliciesResource(http);
    this.processingProfiles = new ShopProcessingProfilesResource(http);
    this.holidayPreferences = new ShopHolidayPreferencesResource(http);
    this.productionPartners = new ShopProductionPartnersResource(http);
  }

  /** operationId: getShop */
  get(shopId: number): Promise<GetShopResponse> {
    return this.#http.request<GetShopResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}",
      pathParams: { shop_id: shopId },
      auth: "apiKey",
      operationId: "getShop",
    });
  }

  /** operationId: updateShop */
  update(shopId: number, body: UpdateShopRequestBody): Promise<UpdateShopResponse> {
    return this.#http.request<UpdateShopResponse>({
      method: "PUT",
      path: "/v3/application/shops/{shop_id}",
      pathParams: { shop_id: shopId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "updateShop",
    });
  }

  /** operationId: getShopByOwnerUserId */
  getByOwnerUserId(userId: number): Promise<GetShopByOwnerUserIdResponse> {
    return this.#http.request<GetShopByOwnerUserIdResponse>({
      method: "GET",
      path: "/v3/application/users/{user_id}/shops",
      pathParams: { user_id: userId },
      auth: "apiKey",
      operationId: "getShopByOwnerUserId",
    });
  }

  /** operationId: findShops */
  find(params: FindShopsParams["query"]): Promise<FindShopsResponse> {
    return this.#http.request<FindShopsResponse>({
      method: "GET",
      path: "/v3/application/shops",
      query: params,
      auth: "apiKey",
      operationId: "findShops",
    });
  }
}
