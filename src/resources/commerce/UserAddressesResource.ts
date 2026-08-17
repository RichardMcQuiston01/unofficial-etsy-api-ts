import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  DeleteUserAddressResponse,
  GetUserAddressesParams,
  GetUserAddressesResponse,
  GetUserAddressResponse,
} from "../../generated/operations.js";
import { toQuery } from "./internal.js";

/** Tag: `UserAddress`. */
export class UserAddressesResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** operationId: getUserAddresses — GET /v3/application/user/addresses */
  getAll(params?: GetUserAddressesParams["query"]): Promise<GetUserAddressesResponse> {
    return this.#http.request<GetUserAddressesResponse>({
      method: "GET",
      path: "/v3/application/user/addresses",
      query: toQuery(params),
      auth: "oauth",
      operationId: "getUserAddresses",
    });
  }

  /** operationId: getUserAddress — GET /v3/application/user/addresses/{user_address_id} */
  get(userAddressId: number): Promise<GetUserAddressResponse> {
    return this.#http.request<GetUserAddressResponse>({
      method: "GET",
      path: "/v3/application/user/addresses/{user_address_id}",
      pathParams: { user_address_id: userAddressId },
      auth: "oauth",
      operationId: "getUserAddress",
    });
  }

  /** operationId: deleteUserAddress — DELETE /v3/application/user/addresses/{user_address_id} */
  delete(userAddressId: number): Promise<DeleteUserAddressResponse> {
    return this.#http.request<DeleteUserAddressResponse>({
      method: "DELETE",
      path: "/v3/application/user/addresses/{user_address_id}",
      pathParams: { user_address_id: userAddressId },
      auth: "oauth",
      operationId: "deleteUserAddress",
    });
  }
}
