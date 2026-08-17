import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  GetShopPaymentAccountLedgerEntriesParams,
  GetShopPaymentAccountLedgerEntriesResponse,
  GetShopPaymentAccountLedgerEntryResponse,
} from "../../generated/operations.js";
import { toQuery } from "./internal.js";

/** Tag: `Ledger Entry`. */
export class LedgerEntriesResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /**
   * operationId: getShopPaymentAccountLedgerEntries — GET /v3/application/shops/{shop_id}/payment-account/ledger-entries
   * `params.min_created`/`max_created` are required by the spec (not optional).
   */
  getAll(
    shopId: number,
    params: GetShopPaymentAccountLedgerEntriesParams["query"],
  ): Promise<GetShopPaymentAccountLedgerEntriesResponse> {
    return this.#http.request<GetShopPaymentAccountLedgerEntriesResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/payment-account/ledger-entries",
      pathParams: { shop_id: shopId },
      query: toQuery(params),
      auth: "oauth",
      operationId: "getShopPaymentAccountLedgerEntries",
    });
  }

  /** operationId: getShopPaymentAccountLedgerEntry — GET /v3/application/shops/{shop_id}/payment-account/ledger-entries/{ledger_entry_id} */
  get(shopId: number, ledgerEntryId: number): Promise<GetShopPaymentAccountLedgerEntryResponse> {
    return this.#http.request<GetShopPaymentAccountLedgerEntryResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/payment-account/ledger-entries/{ledger_entry_id}",
      pathParams: { shop_id: shopId, ledger_entry_id: ledgerEntryId },
      auth: "oauth",
      operationId: "getShopPaymentAccountLedgerEntry",
    });
  }
}
