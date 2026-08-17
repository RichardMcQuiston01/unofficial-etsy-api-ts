import type { EtsyHttpClient } from "../../http/EtsyHttpClient.js";
import type {
  CreateReceiptShipmentRequestBody,
  CreateReceiptShipmentResponse,
  GetShopReceiptParams,
  GetShopReceiptResponse,
  GetShopReceiptsParams,
  GetShopReceiptsResponse,
  UpdateShopReceiptRequestBody,
  UpdateShopReceiptResponse,
} from "../../generated/operations.js";
import { toQuery } from "./internal.js";

/** Tag: `Shop Receipt`. */
export class ShopReceiptsResource {
  #http: EtsyHttpClient;

  constructor(http: EtsyHttpClient) {
    this.#http = http;
  }

  /** operationId: getShopReceipts — GET /v3/application/shops/{shop_id}/receipts */
  getAll(
    shopId: number,
    params?: GetShopReceiptsParams["query"],
  ): Promise<GetShopReceiptsResponse> {
    return this.#http.request<GetShopReceiptsResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/receipts",
      pathParams: { shop_id: shopId },
      query: toQuery(params),
      auth: "oauth",
      operationId: "getShopReceipts",
    });
  }

  /** operationId: getShopReceipt — GET /v3/application/shops/{shop_id}/receipts/{receipt_id} */
  get(
    shopId: number,
    receiptId: number,
    params?: GetShopReceiptParams["query"],
  ): Promise<GetShopReceiptResponse> {
    return this.#http.request<GetShopReceiptResponse>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/receipts/{receipt_id}",
      pathParams: { shop_id: shopId, receipt_id: receiptId },
      query: toQuery(params),
      auth: "oauth",
      operationId: "getShopReceipt",
    });
  }

  /** operationId: updateShopReceipt — PUT /v3/application/shops/{shop_id}/receipts/{receipt_id} */
  update(
    shopId: number,
    receiptId: number,
    body: UpdateShopReceiptRequestBody,
  ): Promise<UpdateShopReceiptResponse> {
    return this.#http.request<UpdateShopReceiptResponse>({
      method: "PUT",
      path: "/v3/application/shops/{shop_id}/receipts/{receipt_id}",
      pathParams: { shop_id: shopId, receipt_id: receiptId },
      body: { kind: "form", data: body },
      auth: "oauth",
      operationId: "updateShopReceipt",
    });
  }

  /** operationId: createReceiptShipment — POST /v3/application/shops/{shop_id}/receipts/{receipt_id}/tracking */
  createShipment(
    shopId: number,
    receiptId: number,
    body: CreateReceiptShipmentRequestBody,
  ): Promise<CreateReceiptShipmentResponse> {
    return this.#http.request<CreateReceiptShipmentResponse>({
      method: "POST",
      path: "/v3/application/shops/{shop_id}/receipts/{receipt_id}/tracking",
      pathParams: { shop_id: shopId, receipt_id: receiptId },
      body: { kind: "json", data: body },
      auth: "oauth",
      operationId: "createReceiptShipment",
    });
  }
}
