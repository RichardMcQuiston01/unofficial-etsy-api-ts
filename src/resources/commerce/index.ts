import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  PingResponse,
  TokenScopesRequestBody,
  TokenScopesResponse,
} from "../../generated/operations.js";
import { LedgerEntriesResource } from "./LedgerEntriesResource.js";
import { PaymentsResource } from "./PaymentsResource.js";
import { ShopReceiptsResource } from "./ShopReceiptsResource.js";
import { ShopReceiptTransactionsResource } from "./ShopReceiptTransactionsResource.js";
import { UserResource } from "./UserResource.js";

export { LedgerEntriesResource } from "./LedgerEntriesResource.js";
export { PaymentsResource } from "./PaymentsResource.js";
export { ShopReceiptsResource } from "./ShopReceiptsResource.js";
export { ShopReceiptTransactionsResource } from "./ShopReceiptTransactionsResource.js";
export { UserResource } from "./UserResource.js";
export { UserAddressesResource } from "./UserAddressesResource.js";

/**
 * Cluster 4 (Commerce & Identity) resource facade — covers the
 * `Shop Receipt`, `Shop Receipt Transactions`, `Payment`, `Ledger Entry`,
 * `User`, `UserAddress`, and `Other` OpenAPI tags. See
 * docs/ARCHITECTURE.md#resource-module-conventions.
 */
export class CommerceResource {
  readonly receipts: ShopReceiptsResource;
  readonly transactions: ShopReceiptTransactionsResource;
  readonly payments: PaymentsResource;
  readonly ledgerEntries: LedgerEntriesResource;
  readonly user: UserResource;
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
    this.receipts = new ShopReceiptsResource(http);
    this.transactions = new ShopReceiptTransactionsResource(http);
    this.payments = new PaymentsResource(http);
    this.ledgerEntries = new LedgerEntriesResource(http);
    this.user = new UserResource(http);
  }

  /**
   * Tag: `Other`. operationId: ping — GET /v3/application/openapi-ping
   * API-key-only — confirms the current application has access to the Open API.
   */
  ping(): Promise<PingResponse> {
    return this.#http.request<PingResponse>({
      method: "GET",
      path: "/v3/application/openapi-ping",
      auth: "apiKey",
      operationId: "ping",
    });
  }

  /**
   * Tag: `Other`. operationId: tokenScopes — POST /v3/application/scopes
   * API-key-only — returns the OAuth scopes granted to the given access token.
   */
  tokenScopes(body: TokenScopesRequestBody): Promise<TokenScopesResponse> {
    return this.#http.request<TokenScopesResponse>({
      method: "POST",
      path: "/v3/application/scopes",
      body: { kind: "form", data: body },
      auth: "apiKey",
      operationId: "tokenScopes",
    });
  }
}
