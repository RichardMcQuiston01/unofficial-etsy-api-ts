import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  GetPaymentAccountLedgerEntryPaymentsParams,
  GetPaymentAccountLedgerEntryPaymentsResponse,
  GetPaymentsParams,
  GetPaymentsResponse,
  GetShopPaymentByReceiptIdResponse,
} from "../../generated/operations.js";
import { toQuery } from "./internal.js";

/** Tag: `Payment`. */
export class PaymentsResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /**
   * operationId: getPayments — GET /v3/application/shops/{shop_id}/payments
   * `params.payment_ids` is required by the spec (not optional), unlike
   * most list-endpoint `params` objects in this cluster.
   */
  getByShop(shopId: number, params: GetPaymentsParams["query"]): Promise<GetPaymentsResponse> {
    return this.#http.request<GetPaymentsResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/payments",
      pathParams: { shop_id: shopId },
      query: toQuery(params),
      auth: "oauth",
      operationId: "getPayments",
    });
  }

  /** operationId: getShopPaymentByReceiptId — GET /v3/application/shops/{shop_id}/receipts/{receipt_id}/payments */
  getByReceipt(shopId: number, receiptId: number): Promise<GetShopPaymentByReceiptIdResponse> {
    return this.#http.request<GetShopPaymentByReceiptIdResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/receipts/{receipt_id}/payments",
      pathParams: { shop_id: shopId, receipt_id: receiptId },
      auth: "oauth",
      operationId: "getShopPaymentByReceiptId",
    });
  }

  /**
   * operationId: getPaymentAccountLedgerEntryPayments — GET /v3/application/shops/{shop_id}/payment-account/ledger-entries/payments
   * `params.ledger_entry_ids` is required by the spec (not optional).
   */
  getLedgerEntryPayments(
    shopId: number,
    params: GetPaymentAccountLedgerEntryPaymentsParams["query"],
  ): Promise<GetPaymentAccountLedgerEntryPaymentsResponse> {
    return this.#http.request<GetPaymentAccountLedgerEntryPaymentsResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/payment-account/ledger-entries/payments",
      pathParams: { shop_id: shopId },
      query: toQuery(params),
      auth: "oauth",
      operationId: "getPaymentAccountLedgerEntryPayments",
    });
  }
}
