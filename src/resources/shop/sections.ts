import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  CreateShopSectionRequestBody,
  CreateShopSectionResponse,
  DeleteShopSectionResponse,
  GetShopSectionResponse,
  GetShopSectionsResponse,
  UpdateShopSectionRequestBody,
  UpdateShopSectionResponse,
} from "../../generated/operations.js";

const BASE_PATH = "/v3/application/shops/{shop_id}/sections";
const ITEM_PATH = "/v3/application/shops/{shop_id}/sections/{shop_section_id}";

/** `Shop Section` tag — src/resources/shop/index.ts `ShopResource.sections`. */
export class ShopSectionsResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** operationId: createShopSection */
  create(shopId: number, body: CreateShopSectionRequestBody): Promise<CreateShopSectionResponse> {
    return this.#http.request<CreateShopSectionResponse>({
      method: "POST",
      path: BASE_PATH,
      pathParams: { shop_id: shopId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "createShopSection",
    });
  }

  /** operationId: getShopSections */
  getAll(shopId: number): Promise<GetShopSectionsResponse> {
    return this.#http.request<GetShopSectionsResponse>({
      method: "GET",
      path: BASE_PATH,
      pathParams: { shop_id: shopId },
      auth: "apiKey",
      operationId: "getShopSections",
    });
  }

  /** operationId: getShopSection */
  get(shopId: number, shopSectionId: number): Promise<GetShopSectionResponse> {
    return this.#http.request<GetShopSectionResponse>({
      method: "GET",
      path: ITEM_PATH,
      pathParams: { shop_id: shopId, shop_section_id: shopSectionId },
      auth: "apiKey",
      operationId: "getShopSection",
    });
  }

  /** operationId: updateShopSection */
  update(
    shopId: number,
    shopSectionId: number,
    body: UpdateShopSectionRequestBody,
  ): Promise<UpdateShopSectionResponse> {
    return this.#http.request<UpdateShopSectionResponse>({
      method: "PUT",
      path: ITEM_PATH,
      pathParams: { shop_id: shopId, shop_section_id: shopSectionId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "updateShopSection",
    });
  }

  /** operationId: deleteShopSection */
  delete(shopId: number, shopSectionId: number): Promise<DeleteShopSectionResponse> {
    return this.#http.request<DeleteShopSectionResponse>({
      method: "DELETE",
      path: ITEM_PATH,
      pathParams: { shop_id: shopId, shop_section_id: shopSectionId },
      auth: "oauth",
      operationId: "deleteShopSection",
    });
  }
}
