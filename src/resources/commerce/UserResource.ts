import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type { GetMeResponse, GetUserResponse } from "../../generated/operations.js";
import { UserAddressesResource } from "./UserAddressesResource.js";

/** Tag: `User` (+ nested `UserAddress`). */
export class UserResource {
  readonly addresses: UserAddressesResource;
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
    this.addresses = new UserAddressesResource(http);
  }

  /** operationId: getMe — GET /v3/application/users/me */
  getMe(): Promise<GetMeResponse> {
    return this.#http.request<GetMeResponse>({
      method: "GET",
      path: "/v3/application/users/me",
      auth: "oauth",
      operationId: "getMe",
    });
  }

  /** operationId: getUser — GET /v3/application/users/{user_id} */
  get(userId: number): Promise<GetUserResponse> {
    return this.#http.request<GetUserResponse>({
      method: "GET",
      path: "/v3/application/users/{user_id}",
      pathParams: { user_id: userId },
      auth: "oauth",
      operationId: "getUser",
    });
  }
}
