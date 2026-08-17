import { describe, expect, it, vi } from "vitest";
import { createEtsyClient } from "../src/client.js";
import { EtsyHttpClient } from "../src/http/EtsyHttpClient.js";
import { ListingsResource } from "../src/resources/listings/index.js";
import { CatalogResource } from "../src/resources/catalog/index.js";
import { ShopResource } from "../src/resources/shop/index.js";
import { CommerceResource } from "../src/resources/commerce/index.js";
import type { EtsyOAuth } from "../src/auth/EtsyOAuth.js";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function fakeOAuth(accessToken: string): EtsyOAuth {
  return { getValidAccessToken: async () => accessToken } as unknown as EtsyOAuth;
}

describe("createEtsyClient", () => {
  it("builds an EtsyClient with one shared EtsyHttpClient and all four resource clusters", () => {
    const client = createEtsyClient({ apiKey: "test-key" });

    expect(client.http).toBeInstanceOf(EtsyHttpClient);
    expect(client.listings).toBeInstanceOf(ListingsResource);
    expect(client.catalog).toBeInstanceOf(CatalogResource);
    expect(client.shop).toBeInstanceOf(ShopResource);
    expect(client.commerce).toBeInstanceOf(CommerceResource);
    expect(client.auth).toBeUndefined();
  });

  it("exposes auth on the client when EtsyClientConfig.auth is provided", () => {
    const auth = fakeOAuth("access-token-123");
    const client = createEtsyClient({ apiKey: "test-key", auth });

    expect(client.auth).toBe(auth);
  });

  it("routes resource calls through the single shared http instance", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/seller-taxonomy/nodes");
      return jsonResponse({ results: [] });
    });

    const client = createEtsyClient({
      apiKey: "test-key",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await client.catalog.sellerTaxonomy.getNodes();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
