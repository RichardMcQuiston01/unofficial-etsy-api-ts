import { describe, expect, it, vi } from "vitest";
import { EtsyHttpClient } from "../../../src/http/EtsyHttpClient.js";
import { CommerceResource } from "../../../src/resources/commerce/index.js";
import type { EtsyOAuth } from "../../../src/auth/EtsyOAuth.js";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function fakeOAuth(accessToken: string): EtsyOAuth {
  return { getValidAccessToken: async () => accessToken } as unknown as EtsyOAuth;
}

/** Builds a CommerceResource backed by a real EtsyHttpClient with a mocked fetch. */
function buildCommerce(
  fetchMock: ReturnType<typeof vi.fn>,
  opts: { withAuth?: boolean } = { withAuth: true },
) {
  const http = new EtsyHttpClient({
    apiKey: "test-key",
    fetch: fetchMock as unknown as typeof fetch,
    ...(opts.withAuth ? { auth: fakeOAuth("access-token-123") } : {}),
  });
  return new CommerceResource(http);
}

describe("CommerceResource — receipts", () => {
  it("getAll (getShopReceipts) sends oauth + query params, dropping null filter values", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe("/v3/application/shops/123/receipts");
      expect(parsed.searchParams.get("limit")).toBe("25");
      expect(parsed.searchParams.get("sort_on")).toBe("created");
      // was_paid: null must be dropped, not sent as the literal string "null".
      expect(parsed.searchParams.has("was_paid")).toBe(false);
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer access-token-123");
      expect(headers.get("x-api-key")).toBe("test-key");
      return jsonResponse({ count: 0, results: [] });
    });
    const commerce = buildCommerce(fetchMock);

    const result = await commerce.receipts.getAll(123, {
      limit: 25,
      sort_on: "created",
      was_paid: null,
    });

    expect(result).toEqual({ count: 0, results: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("update (updateShopReceipt) sends a form-encoded PUT body", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/receipts/2");
      expect(init?.method).toBe("PUT");
      expect(init?.body).toBeInstanceOf(URLSearchParams);
      expect((init?.body as URLSearchParams).get("was_shipped")).toBe("true");
      return jsonResponse({ receipt_id: 2 });
    });
    const commerce = buildCommerce(fetchMock);

    await commerce.receipts.update(1, 2, { was_shipped: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("createShipment (createReceiptShipment) sends a JSON POST body", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/receipts/2/tracking");
      expect(init?.method).toBe("POST");
      const headers = new Headers(init?.headers);
      expect(headers.get("Content-Type")).toBe("application/json");
      expect(init?.body).toBe(JSON.stringify({ tracking_code: "1Z999", carrier_name: "ups" }));
      return jsonResponse({ receipt_id: 2 });
    });
    const commerce = buildCommerce(fetchMock);

    await commerce.receipts.createShipment(1, 2, {
      tracking_code: "1Z999",
      carrier_name: "ups",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("get (getShopReceipt) reads a single receipt via GET", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/receipts/2");
      return jsonResponse({ receipt_id: 2 });
    });
    const commerce = buildCommerce(fetchMock);

    const result = await commerce.receipts.get(1, 2);
    expect(result).toEqual({ receipt_id: 2 });
  });
});

describe("CommerceResource — transactions", () => {
  it("getByReceipt (getShopReceiptTransactionsByReceipt) issues an oauth GET", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/receipts/2/transactions");
      return jsonResponse({ count: 1, results: [{ transaction_id: 9 }] });
    });
    const commerce = buildCommerce(fetchMock);

    const result = await commerce.transactions.getByReceipt(1, 2);
    expect(result.count).toBe(1);
  });

  it("get (getShopReceiptTransaction) reads a single transaction via GET", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/transactions/9");
      return jsonResponse({ transaction_id: 9 });
    });
    const commerce = buildCommerce(fetchMock);

    const result = await commerce.transactions.get(1, 9);
    expect(result).toEqual({ transaction_id: 9 });
  });

  it("getByListing (getShopReceiptTransactionsByListing) issues an oauth GET", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/listings/2/transactions");
      return jsonResponse({ count: 0, results: [] });
    });
    const commerce = buildCommerce(fetchMock);

    await commerce.transactions.getByListing(1, 2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getByShop (getShopReceiptTransactionsByShop) issues an oauth GET", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/transactions");
      return jsonResponse({ count: 0, results: [] });
    });
    const commerce = buildCommerce(fetchMock);

    await commerce.transactions.getByShop(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("CommerceResource — payments", () => {
  it("getByShop (getPayments) requires payment_ids and comma-joins the array", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe("/v3/application/shops/1/payments");
      expect(parsed.searchParams.get("payment_ids")).toBe("10,20,30");
      return jsonResponse({ count: 3, results: [] });
    });
    const commerce = buildCommerce(fetchMock);

    await commerce.payments.getByShop(1, { payment_ids: [10, 20, 30] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getByReceipt (getShopPaymentByReceiptId) issues an oauth GET", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/receipts/2/payments");
      return jsonResponse({ count: 0, results: [] });
    });
    const commerce = buildCommerce(fetchMock);

    await commerce.payments.getByReceipt(1, 2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getLedgerEntryPayments (getPaymentAccountLedgerEntryPayments) requires ledger_entry_ids and comma-joins the array", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe(
        "/v3/application/shops/1/payment-account/ledger-entries/payments",
      );
      expect(parsed.searchParams.get("ledger_entry_ids")).toBe("5,6");
      return jsonResponse({ count: 0, results: [] });
    });
    const commerce = buildCommerce(fetchMock);

    await commerce.payments.getLedgerEntryPayments(1, { ledger_entry_ids: [5, 6] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("CommerceResource — ledgerEntries", () => {
  it("getAll (getShopPaymentAccountLedgerEntries) requires min_created/max_created", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe("/v3/application/shops/1/payment-account/ledger-entries");
      expect(parsed.searchParams.get("min_created")).toBe("1000");
      expect(parsed.searchParams.get("max_created")).toBe("2000");
      return jsonResponse({ count: 0, results: [] });
    });
    const commerce = buildCommerce(fetchMock);

    await commerce.ledgerEntries.getAll(1, { min_created: 1000, max_created: 2000 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("get (getShopPaymentAccountLedgerEntry) reads a single ledger entry via GET", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe(
        "/v3/application/shops/1/payment-account/ledger-entries/7",
      );
      return jsonResponse({ ledger_entry_id: 7 });
    });
    const commerce = buildCommerce(fetchMock);

    const result = await commerce.ledgerEntries.get(1, 7);
    expect(result).toEqual({ ledger_entry_id: 7 });
  });
});

describe("CommerceResource — user & addresses", () => {
  it("user.getMe() calls /v3/application/users/me with oauth", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).pathname).toBe("/v3/application/users/me");
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer access-token-123");
      return jsonResponse({ user_id: 42 });
    });
    const commerce = buildCommerce(fetchMock);

    const result = await commerce.user.getMe();
    expect(result).toEqual({ user_id: 42 });
  });

  it("user.get() reads a single user via GET", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/users/42");
      return jsonResponse({ user_id: 42 });
    });
    const commerce = buildCommerce(fetchMock);

    const result = await commerce.user.get(42);
    expect(result).toEqual({ user_id: 42 });
  });

  it("user.addresses.getAll() lists addresses with no shop/user path segment", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/user/addresses");
      return jsonResponse({ count: 0, results: [] });
    });
    const commerce = buildCommerce(fetchMock);

    await commerce.user.addresses.getAll();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("user.addresses.get() reads a single address via GET", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/user/addresses/5");
      return jsonResponse({ user_address_id: 5 });
    });
    const commerce = buildCommerce(fetchMock);

    const result = await commerce.user.addresses.get(5);
    expect(result).toEqual({ user_address_id: 5 });
  });

  it("user.addresses.delete() sends DELETE and returns undefined for 204", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).pathname).toBe("/v3/application/user/addresses/5");
      expect(init?.method).toBe("DELETE");
      return new Response(null, { status: 204 });
    });
    const commerce = buildCommerce(fetchMock);

    const result = await commerce.user.addresses.delete(5);
    expect(result).toBeUndefined();
  });
});

describe("CommerceResource — Other (apiKey-only)", () => {
  it("ping() uses apiKey auth and never attaches an Authorization header, even with no OAuth configured", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).pathname).toBe("/v3/application/openapi-ping");
      const headers = new Headers(init?.headers);
      expect(headers.get("x-api-key")).toBe("test-key");
      expect(headers.has("Authorization")).toBe(false);
      return jsonResponse({ application_id: 1 });
    });
    // withAuth: false — proves ping() doesn't require an EtsyOAuth instance.
    const commerce = buildCommerce(fetchMock, { withAuth: false });

    const result = await commerce.ping();
    expect(result).toEqual({ application_id: 1 });
  });

  it("tokenScopes() uses apiKey auth and form-encodes the token field", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).pathname).toBe("/v3/application/scopes");
      expect(init?.method).toBe("POST");
      const headers = new Headers(init?.headers);
      expect(headers.has("Authorization")).toBe(false);
      expect(init?.body).toBeInstanceOf(URLSearchParams);
      expect((init?.body as URLSearchParams).get("token")).toBe("some-access-token");
      return jsonResponse({ scopes: ["listings_r"] });
    });
    const commerce = buildCommerce(fetchMock, { withAuth: false });

    const result = await commerce.tokenScopes({ token: "some-access-token" });
    expect(result).toEqual({ scopes: ["listings_r"] });
  });
});
