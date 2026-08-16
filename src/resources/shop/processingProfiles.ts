import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  CreateShopReadinessStateDefinitionRequestBody,
  CreateShopReadinessStateDefinitionResponse,
  DeleteShopReadinessStateDefinitionResponse,
  GetShopReadinessStateDefinitionResponse,
  GetShopReadinessStateDefinitionsParams,
  GetShopReadinessStateDefinitionsResponse,
  UpdateShopReadinessStateDefinitionRequestBody,
  UpdateShopReadinessStateDefinitionResponse,
} from "../../generated/operations.js";

const BASE_PATH = "/v3/application/shops/{shop_id}/readiness-state-definitions";
const ITEM_PATH =
  "/v3/application/shops/{shop_id}/readiness-state-definitions/{readiness_state_definition_id}";

/**
 * `Shop ProcessingProfiles` tag — the OpenAPI tag name for what the API
 * itself calls "readiness state definitions" (the URL segment and every
 * schema/parameter name). src/resources/shop/index.ts `ShopResource.processingProfiles`.
 */
export class ShopProcessingProfilesResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** operationId: createShopReadinessStateDefinition */
  create(
    shopId: number,
    body: CreateShopReadinessStateDefinitionRequestBody,
  ): Promise<CreateShopReadinessStateDefinitionResponse> {
    return this.#http.request<CreateShopReadinessStateDefinitionResponse>({
      method: "POST",
      path: BASE_PATH,
      pathParams: { shop_id: shopId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "createShopReadinessStateDefinition",
    });
  }

  /** operationId: getShopReadinessStateDefinitions */
  getAll(
    shopId: number,
    params?: GetShopReadinessStateDefinitionsParams["query"],
  ): Promise<GetShopReadinessStateDefinitionsResponse> {
    return this.#http.request<GetShopReadinessStateDefinitionsResponse>({
      method: "GET",
      path: BASE_PATH,
      pathParams: { shop_id: shopId },
      ...(params ? { query: params } : {}),
      auth: "oauth",
      operationId: "getShopReadinessStateDefinitions",
    });
  }

  /** operationId: getShopReadinessStateDefinition */
  get(
    shopId: number,
    readinessStateDefinitionId: number,
  ): Promise<GetShopReadinessStateDefinitionResponse> {
    return this.#http.request<GetShopReadinessStateDefinitionResponse>({
      method: "GET",
      path: ITEM_PATH,
      pathParams: {
        shop_id: shopId,
        readiness_state_definition_id: readinessStateDefinitionId,
      },
      auth: "oauth",
      operationId: "getShopReadinessStateDefinition",
    });
  }

  /** operationId: updateShopReadinessStateDefinition */
  update(
    shopId: number,
    readinessStateDefinitionId: number,
    body: UpdateShopReadinessStateDefinitionRequestBody,
  ): Promise<UpdateShopReadinessStateDefinitionResponse> {
    return this.#http.request<UpdateShopReadinessStateDefinitionResponse>({
      method: "PUT",
      path: ITEM_PATH,
      pathParams: {
        shop_id: shopId,
        readiness_state_definition_id: readinessStateDefinitionId,
      },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "updateShopReadinessStateDefinition",
    });
  }

  /** operationId: deleteShopReadinessStateDefinition */
  delete(
    shopId: number,
    readinessStateDefinitionId: number,
  ): Promise<DeleteShopReadinessStateDefinitionResponse> {
    return this.#http.request<DeleteShopReadinessStateDefinitionResponse>({
      method: "DELETE",
      path: ITEM_PATH,
      pathParams: {
        shop_id: shopId,
        readiness_state_definition_id: readinessStateDefinitionId,
      },
      auth: "oauth",
      operationId: "deleteShopReadinessStateDefinition",
    });
  }
}
