import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  GetHolidayPreferencesResponse,
  UpdateHolidayPreferencesRequestBody,
  UpdateHolidayPreferencesResponse,
} from "../../generated/operations.js";

/** `Shop HolidayPreferences` tag — src/resources/shop/index.ts `ShopResource.holidayPreferences`. */
export class ShopHolidayPreferencesResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** operationId: getHolidayPreferences */
  getAll(shopId: number): Promise<GetHolidayPreferencesResponse> {
    return this.#http.request<GetHolidayPreferencesResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/holiday-preferences",
      pathParams: { shop_id: shopId },
      auth: "oauth",
      operationId: "getHolidayPreferences",
    });
  }

  /** operationId: updateHolidayPreferences */
  update(
    shopId: number,
    holidayId: number,
    body: UpdateHolidayPreferencesRequestBody,
  ): Promise<UpdateHolidayPreferencesResponse> {
    return this.#http.request<UpdateHolidayPreferencesResponse>({
      method: "PUT",
      path: "/v3/application/shops/{shop_id}/holiday-preferences/{holiday_id}",
      pathParams: { shop_id: shopId, holiday_id: holidayId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "updateHolidayPreferences",
    });
  }
}
