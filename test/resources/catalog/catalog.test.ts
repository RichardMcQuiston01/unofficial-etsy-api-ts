import { describe, expect, it, vi } from "vitest";
import { EtsyHttpClient } from "../../../src/http/EtsyHttpClient.js";
import { CatalogResource } from "../../../src/resources/catalog/index.js";
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

function makeCatalog(fetchMock: typeof fetch) {
  const http = new EtsyHttpClient({
    apiKey: "test-key",
    fetch: fetchMock,
    auth: fakeOAuth("access-token-123"),
  });
  return { catalog: new CatalogResource(http), http };
}

describe("CatalogResource — buyer/seller taxonomy", () => {
  it("getSellerTaxonomyNodes: GET /v3/application/seller-taxonomy/nodes with apiKey auth, no bearer", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).pathname).toBe("/v3/application/seller-taxonomy/nodes");
      const headers = new Headers(init?.headers);
      expect(headers.get("x-api-key")).toBe("test-key");
      expect(headers.has("Authorization")).toBe(false);
      return jsonResponse({ results: [] });
    });
    const { catalog } = makeCatalog(fetchMock as unknown as typeof fetch);

    await catalog.sellerTaxonomy.getNodes();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).method).toBe("GET");
  });

  it("getPropertiesByTaxonomyId: substitutes taxonomy_id path param", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/seller-taxonomy/nodes/1429/properties");
      return jsonResponse({ properties: [] });
    });
    const { catalog } = makeCatalog(fetchMock as unknown as typeof fetch);

    await catalog.sellerTaxonomy.getProperties(1429);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getBuyerTaxonomyNodes: GET /v3/application/buyer-taxonomy/nodes", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/buyer-taxonomy/nodes");
      return jsonResponse({ results: [] });
    });
    const { catalog } = makeCatalog(fetchMock as unknown as typeof fetch);

    await catalog.buyerTaxonomy.getNodes();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getPropertiesByBuyerTaxonomyId: substitutes taxonomy_id path param", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/buyer-taxonomy/nodes/42/properties");
      return jsonResponse({ properties: [] });
    });
    const { catalog } = makeCatalog(fetchMock as unknown as typeof fetch);

    await catalog.buyerTaxonomy.getProperties(42);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("CatalogResource — inventory", () => {
  it("getListingInventory: oauth-authed, path param, optional query", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe("/v3/application/listings/111/inventory");
      expect(parsed.searchParams.get("show_deleted")).toBe("true");
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer access-token-123");
      return jsonResponse({ products: [] });
    });
    const { catalog } = makeCatalog(fetchMock as unknown as typeof fetch);

    await catalog.inventory.get(111, { show_deleted: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("updateListingInventory: PUT with a JSON body and Content-Type: application/json", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).pathname).toBe("/v3/application/listings/222/inventory");
      expect((init as RequestInit).method).toBe("PUT");
      const headers = new Headers(init?.headers);
      expect(headers.get("Content-Type")).toBe("application/json");
      const body = JSON.parse((init as RequestInit).body as string) as { products: unknown[] };
      expect(body.products).toHaveLength(1);
      return jsonResponse({ products: [] });
    });
    const { catalog } = makeCatalog(fetchMock as unknown as typeof fetch);

    await catalog.inventory.update(222, {
      products: [
        {
          sku: "SKU-1",
          property_values: [],
          offerings: [{ price: 9.99, quantity: 5, is_enabled: true, readiness_state_id: null }],
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getListingsInventoryByListingIds: comma-joins the listing_ids array query param", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe("/v3/application/listings/batch/inventory");
      expect(parsed.searchParams.get("listing_ids")).toBe("1,2,3");
      return jsonResponse({ count: 0, results: [] });
    });
    const { catalog } = makeCatalog(fetchMock as unknown as typeof fetch);

    await catalog.inventory.getByListingIds({ listing_ids: [1, 2, 3] });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("CatalogResource — product & offering", () => {
  it("getListingProduct (getProduct): oauth-authed, two path params", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).pathname).toBe("/v3/application/listings/111/inventory/products/222");
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer access-token-123");
      return jsonResponse({ product_id: 222 });
    });
    const { catalog } = makeCatalog(fetchMock as unknown as typeof fetch);

    await catalog.getProduct(111, 222);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getListingOffering (getOffering): apiKey-authed, three path params, no bearer", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).pathname).toBe("/v3/application/listings/111/products/222/offerings/333");
      const headers = new Headers(init?.headers);
      expect(headers.has("Authorization")).toBe(false);
      return jsonResponse({ offering_id: 333 });
    });
    const { catalog } = makeCatalog(fetchMock as unknown as typeof fetch);

    await catalog.getOffering(111, 222, 333);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("CatalogResource — reviews", () => {
  it("getReviewsByListing: path param plus optional query, omits null fields", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe("/v3/application/listings/111/reviews");
      expect(parsed.searchParams.get("limit")).toBe("10");
      expect(parsed.searchParams.has("min_created")).toBe(false);
      return jsonResponse({ count: 0, results: [] });
    });
    const { catalog } = makeCatalog(fetchMock as unknown as typeof fetch);

    await catalog.reviews.getByListing(111, { limit: 10, min_created: null });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getReviewsByShop: shop_id path param", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/999/reviews");
      return jsonResponse({ count: 0, results: [] });
    });
    const { catalog } = makeCatalog(fetchMock as unknown as typeof fetch);

    await catalog.reviews.getByShop(999);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
