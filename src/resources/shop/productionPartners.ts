import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type { GetShopProductionPartnersResponse } from "../../generated/operations.js";

/** `Shop ProductionPartner` tag — src/resources/shop/index.ts `ShopResource.productionPartners`. */
export class ShopProductionPartnersResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** operationId: getShopProductionPartners */
  getAll(shopId: number): Promise<GetShopProductionPartnersResponse> {
    return this.#http.request<GetShopProductionPartnersResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/production-partners",
      pathParams: { shop_id: shopId },
      auth: "oauth",
      operationId: "getShopProductionPartners",
    });
  }
}
