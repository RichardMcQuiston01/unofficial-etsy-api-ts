import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  GetShopReceiptTransactionResponse,
  GetShopReceiptTransactionsByListingParams,
  GetShopReceiptTransactionsByListingResponse,
  GetShopReceiptTransactionsByReceiptParams,
  GetShopReceiptTransactionsByReceiptResponse,
  GetShopReceiptTransactionsByShopParams,
  GetShopReceiptTransactionsByShopResponse,
} from "../../generated/operations.js";
import { toQuery } from "./internal.js";

/** Tag: `Shop Receipt Transactions`. */
export class ShopReceiptTransactionsResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** operationId: getShopReceiptTransaction — GET /v3/application/shops/{shop_id}/transactions/{transaction_id} */
  get(shopId: number, transactionId: number): Promise<GetShopReceiptTransactionResponse> {
    return this.#http.request<GetShopReceiptTransactionResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/transactions/{transaction_id}",
      pathParams: { shop_id: shopId, transaction_id: transactionId },
      auth: "oauth",
      operationId: "getShopReceiptTransaction",
    });
  }

  /** operationId: getShopReceiptTransactionsByListing — GET /v3/application/shops/{shop_id}/listings/{listing_id}/transactions */
  getByListing(
    shopId: number,
    listingId: number,
    params?: GetShopReceiptTransactionsByListingParams["query"],
  ): Promise<GetShopReceiptTransactionsByListingResponse> {
    return this.#http.request<GetShopReceiptTransactionsByListingResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/transactions",
      pathParams: { shop_id: shopId, listing_id: listingId },
      query: toQuery(params),
      auth: "oauth",
      operationId: "getShopReceiptTransactionsByListing",
    });
  }

  /** operationId: getShopReceiptTransactionsByReceipt — GET /v3/application/shops/{shop_id}/receipts/{receipt_id}/transactions */
  getByReceipt(
    shopId: number,
    receiptId: number,
    params?: GetShopReceiptTransactionsByReceiptParams["query"],
  ): Promise<GetShopReceiptTransactionsByReceiptResponse> {
    return this.#http.request<GetShopReceiptTransactionsByReceiptResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/receipts/{receipt_id}/transactions",
      pathParams: { shop_id: shopId, receipt_id: receiptId },
      query: toQuery(params),
      auth: "oauth",
      operationId: "getShopReceiptTransactionsByReceipt",
    });
  }

  /** operationId: getShopReceiptTransactionsByShop — GET /v3/application/shops/{shop_id}/transactions */
  getByShop(
    shopId: number,
    params?: GetShopReceiptTransactionsByShopParams["query"],
  ): Promise<GetShopReceiptTransactionsByShopResponse> {
    return this.#http.request<GetShopReceiptTransactionsByShopResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/transactions",
      pathParams: { shop_id: shopId },
      query: toQuery(params),
      auth: "oauth",
      operationId: "getShopReceiptTransactionsByShop",
    });
  }
}
