import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  ConsolidateShopReturnPoliciesRequestBody,
  ConsolidateShopReturnPoliciesResponse,
  CreateShopReturnPolicyRequestBody,
  CreateShopReturnPolicyResponse,
  DeleteShopReturnPolicyResponse,
  GetShopReturnPoliciesResponse,
  GetShopReturnPolicyResponse,
  UpdateShopReturnPolicyRequestBody,
  UpdateShopReturnPolicyResponse,
} from "../../generated/operations.js";

const BASE_PATH = "/v3/application/shops/{shop_id}/policies/return";
const ITEM_PATH = "/v3/application/shops/{shop_id}/policies/return/{return_policy_id}";
const CONSOLIDATE_PATH = "/v3/application/shops/{shop_id}/policies/return/consolidate";

/** `Shop Return Policy` tag — src/resources/shop/index.ts `ShopResource.returnPolicies`. */
export class ShopReturnPoliciesResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** operationId: createShopReturnPolicy */
  create(
    shopId: number,
    body: CreateShopReturnPolicyRequestBody,
  ): Promise<CreateShopReturnPolicyResponse> {
    return this.#http.request<CreateShopReturnPolicyResponse>({
      method: "POST",
      path: BASE_PATH,
      pathParams: { shop_id: shopId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "createShopReturnPolicy",
    });
  }

  /** operationId: getShopReturnPolicies */
  getAll(shopId: number): Promise<GetShopReturnPoliciesResponse> {
    return this.#http.request<GetShopReturnPoliciesResponse>({
      method: "GET",
      path: BASE_PATH,
      pathParams: { shop_id: shopId },
      auth: "apiKey",
      operationId: "getShopReturnPolicies",
    });
  }

  /** operationId: getShopReturnPolicy */
  get(shopId: number, returnPolicyId: number): Promise<GetShopReturnPolicyResponse> {
    return this.#http.request<GetShopReturnPolicyResponse>({
      method: "GET",
      path: ITEM_PATH,
      pathParams: { shop_id: shopId, return_policy_id: returnPolicyId },
      auth: "apiKey",
      operationId: "getShopReturnPolicy",
    });
  }

  /** operationId: updateShopReturnPolicy */
  update(
    shopId: number,
    returnPolicyId: number,
    body: UpdateShopReturnPolicyRequestBody,
  ): Promise<UpdateShopReturnPolicyResponse> {
    return this.#http.request<UpdateShopReturnPolicyResponse>({
      method: "PUT",
      path: ITEM_PATH,
      pathParams: { shop_id: shopId, return_policy_id: returnPolicyId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "updateShopReturnPolicy",
    });
  }

  /** operationId: deleteShopReturnPolicy */
  delete(shopId: number, returnPolicyId: number): Promise<DeleteShopReturnPolicyResponse> {
    return this.#http.request<DeleteShopReturnPolicyResponse>({
      method: "DELETE",
      path: ITEM_PATH,
      pathParams: { shop_id: shopId, return_policy_id: returnPolicyId },
      auth: "oauth",
      operationId: "deleteShopReturnPolicy",
    });
  }

  /** operationId: consolidateShopReturnPolicies */
  consolidate(
    shopId: number,
    body: ConsolidateShopReturnPoliciesRequestBody,
  ): Promise<ConsolidateShopReturnPoliciesResponse> {
    return this.#http.request<ConsolidateShopReturnPoliciesResponse>({
      method: "POST",
      path: CONSOLIDATE_PATH,
      pathParams: { shop_id: shopId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "consolidateShopReturnPolicies",
    });
  }
}
