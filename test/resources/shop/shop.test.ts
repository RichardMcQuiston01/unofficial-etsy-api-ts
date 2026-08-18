import { describe, expect, it, vi } from "vitest";
import { EtsyHttpClient } from "../../../src/http/EtsyHttpClient.js";
import type { EtsyOAuth } from "../../../src/auth/EtsyOAuth.js";
import { ShopResource } from "../../../src/resources/shop/index.js";

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

/** Builds a ShopResource wired to a fetch mock, returning both for assertions. */
function makeShop(fetchImpl: typeof fetch) {
  const http = new EtsyHttpClient({
    apiKey: "test-key",
    fetch: fetchImpl,
    auth: fakeOAuth("access-token-123"),
  });
  return new ShopResource(http);
}

describe("ShopResource — top-level Shop operations", () => {
  it("get() sends an apiKey-only GET to /v3/application/shops/{shop_id}", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/123");
      const headers = new Headers(init?.headers);
      expect(headers.get("x-api-key")).toBe("test-key");
      expect(headers.has("Authorization")).toBe(false);
      return jsonResponse({ shop_id: 123, shop_name: "Test Shop" });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    const result = await shop.get(123);

    expect(result).toEqual({ shop_id: 123, shop_name: "Test Shop" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("update() PUTs a form-encoded body and requires oauth", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(init?.method).toBe("PUT");
      expect(new URL(url).pathname).toBe("/v3/application/shops/123");
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer access-token-123");
      expect(init?.body).toBeInstanceOf(URLSearchParams);
      expect((init?.body as URLSearchParams).get("title")).toBe("New Title");
      return jsonResponse({ shop_id: 123, title: "New Title" });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.update(123, { title: "New Title" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("find() serializes query params onto /v3/application/shops", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe("/v3/application/shops");
      expect(parsed.searchParams.get("shop_name")).toBe("candles");
      expect(parsed.searchParams.get("limit")).toBe("10");
      return jsonResponse({ count: 0, results: [] });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.find({ shop_name: "candles", limit: 10 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getByOwnerUserId() GETs /v3/application/users/{user_id}/shops", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/users/456/shops");
      return jsonResponse({ shop_id: 123 });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.getByOwnerUserId(456);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("ShopResource.sections", () => {
  it("create() POSTs a form body to /shops/{shop_id}/sections", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/sections");
      expect((init?.body as URLSearchParams).get("title")).toBe("Home Decor");
      return jsonResponse({ shop_section_id: 1, title: "Home Decor" }, { status: 200 });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.sections.create(1, { title: "Home Decor" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getAll() GETs the sections collection with apiKey auth", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/sections");
      const headers = new Headers(init?.headers);
      expect(headers.has("Authorization")).toBe(false);
      return jsonResponse({ count: 0, results: [] });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.sections.getAll(1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("get() GETs a single section with apiKey auth", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/sections/9");
      return jsonResponse({ shop_section_id: 9 });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    const result = await shop.sections.get(1, 9);

    expect(result).toEqual({ shop_section_id: 9 });
  });

  it("update() PUTs a form body to a single section", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(init?.method).toBe("PUT");
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/sections/9");
      expect((init?.body as URLSearchParams).get("title")).toBe("Renamed");
      return jsonResponse({ shop_section_id: 9, title: "Renamed" });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.sections.update(1, 9, { title: "Renamed" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("delete() DELETEs a single section and returns undefined for 204", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(init?.method).toBe("DELETE");
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/sections/9");
      return new Response(null, { status: 204 });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    const result = await shop.sections.delete(1, 9);

    expect(result).toBeUndefined();
  });
});

describe("ShopResource.shippingProfiles", () => {
  it("getCarriers() is not shop-scoped and passes through the required query param", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe("/v3/application/shipping-carriers");
      expect(parsed.searchParams.get("origin_country_iso")).toBe("US");
      const headers = new Headers(init?.headers);
      expect(headers.has("Authorization")).toBe(false);
      return jsonResponse({ count: 1, results: [] });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.shippingProfiles.getCarriers({ origin_country_iso: "US" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("create() POSTs a form body requiring oauth", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/shipping-profiles");
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer access-token-123");
      const body = init?.body as URLSearchParams;
      expect(body.get("title")).toBe("Standard");
      expect(body.get("origin_country_iso")).toBe("US");
      return jsonResponse({ shipping_profile_id: 1 });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.shippingProfiles.create(1, {
      title: "Standard",
      origin_country_iso: "US",
      primary_cost: 5,
      secondary_cost: 2,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getAll() GETs the shipping-profiles collection with oauth", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/shipping-profiles");
      return jsonResponse({ count: 0, results: [] });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.shippingProfiles.getAll(1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("get() GETs a single shipping profile", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/shipping-profiles/2");
      return jsonResponse({ shipping_profile_id: 2 });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    const result = await shop.shippingProfiles.get(1, 2);

    expect(result).toEqual({ shipping_profile_id: 2 });
  });

  it("update() PUTs a form body to a single shipping profile", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(init?.method).toBe("PUT");
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/shipping-profiles/2");
      expect((init?.body as URLSearchParams).get("title")).toBe("Expedited");
      return jsonResponse({ shipping_profile_id: 2, title: "Expedited" });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.shippingProfiles.update(1, 2, { title: "Expedited" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("delete() DELETEs a single shipping profile and returns undefined for 204", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(init?.method).toBe("DELETE");
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/shipping-profiles/2");
      return new Response(null, { status: 204 });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    const result = await shop.shippingProfiles.delete(1, 2);

    expect(result).toBeUndefined();
  });

  describe(".destinations", () => {
    it("create() POSTs to the nested destinations path", async () => {
      const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
        expect(init?.method).toBe("POST");
        expect(new URL(url).pathname).toBe(
          "/v3/application/shops/1/shipping-profiles/2/destinations",
        );
        return jsonResponse({ shipping_profile_destination_id: 3 }, { status: 201 });
      });

      const shop = makeShop(fetchMock as unknown as typeof fetch);
      await shop.shippingProfiles.destinations.create(1, 2, {
        primary_cost: 5,
        secondary_cost: 2,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("getAll() omits the query key entirely when no pagination params are passed", async () => {
      const fetchMock = vi.fn(async (url: string | URL) => {
        expect(new URL(url).search).toBe("");
        return jsonResponse({ count: 0, results: [] });
      });

      const shop = makeShop(fetchMock as unknown as typeof fetch);
      await shop.shippingProfiles.destinations.getAll(1, 2);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("getAll() forwards limit/offset when provided", async () => {
      const fetchMock = vi.fn(async (url: string | URL) => {
        const parsed = new URL(url);
        expect(parsed.searchParams.get("limit")).toBe("5");
        expect(parsed.searchParams.get("offset")).toBe("10");
        return jsonResponse({ count: 0, results: [] });
      });

      const shop = makeShop(fetchMock as unknown as typeof fetch);
      await shop.shippingProfiles.destinations.getAll(1, 2, { limit: 5, offset: 10 });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("update() PUTs to the fully-nested destination path", async () => {
      const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
        expect(init?.method).toBe("PUT");
        expect(new URL(url).pathname).toBe(
          "/v3/application/shops/1/shipping-profiles/2/destinations/3",
        );
        expect((init?.body as URLSearchParams).get("primary_cost")).toBe("7");
        return jsonResponse({ shipping_profile_destination_id: 3 });
      });

      const shop = makeShop(fetchMock as unknown as typeof fetch);
      await shop.shippingProfiles.destinations.update(1, 2, 3, { primary_cost: 7 });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("delete() DELETEs the fully-nested destination path", async () => {
      const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
        expect(init?.method).toBe("DELETE");
        expect(new URL(url).pathname).toBe(
          "/v3/application/shops/1/shipping-profiles/2/destinations/3",
        );
        return new Response(null, { status: 204 });
      });

      const shop = makeShop(fetchMock as unknown as typeof fetch);
      const result = await shop.shippingProfiles.destinations.delete(1, 2, 3);

      expect(result).toBeUndefined();
    });
  });

  describe(".upgrades", () => {
    it("create() POSTs to the nested upgrades path", async () => {
      const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
        expect(init?.method).toBe("POST");
        expect(new URL(url).pathname).toBe("/v3/application/shops/1/shipping-profiles/2/upgrades");
        const body = init?.body as URLSearchParams;
        expect(body.get("upgrade_name")).toBe("Fast Shipping");
        return jsonResponse({ upgrade_id: 3 }, { status: 201 });
      });

      const shop = makeShop(fetchMock as unknown as typeof fetch);
      await shop.shippingProfiles.upgrades.create(1, 2, {
        type: 0,
        upgrade_name: "Fast Shipping",
        price: 5,
        secondary_price: 2,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("getAll() GETs the nested upgrades path", async () => {
      const fetchMock = vi.fn(async (url: string | URL) => {
        expect(new URL(url).pathname).toBe("/v3/application/shops/1/shipping-profiles/2/upgrades");
        return jsonResponse({ count: 0, results: [] });
      });

      const shop = makeShop(fetchMock as unknown as typeof fetch);
      await shop.shippingProfiles.upgrades.getAll(1, 2);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("update() PUTs to the fully-nested upgrade path", async () => {
      const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
        expect(init?.method).toBe("PUT");
        expect(new URL(url).pathname).toBe(
          "/v3/application/shops/1/shipping-profiles/2/upgrades/3",
        );
        return jsonResponse({ upgrade_id: 3 });
      });

      const shop = makeShop(fetchMock as unknown as typeof fetch);
      await shop.shippingProfiles.upgrades.update(1, 2, 3, { upgrade_name: "Fast Shipping" });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("delete() DELETEs the fully-nested upgrade path", async () => {
      const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
        expect(init?.method).toBe("DELETE");
        expect(new URL(url).pathname).toBe(
          "/v3/application/shops/1/shipping-profiles/2/upgrades/3",
        );
        return new Response(null, { status: 204 });
      });

      const shop = makeShop(fetchMock as unknown as typeof fetch);
      const result = await shop.shippingProfiles.upgrades.delete(1, 2, 3);

      expect(result).toBeUndefined();
    });
  });
});

describe("ShopResource.returnPolicies", () => {
  it("create() POSTs a form body to the return-policies collection", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/policies/return");
      const body = init?.body as URLSearchParams;
      expect(body.get("accepts_returns")).toBe("true");
      expect(body.get("accepts_exchanges")).toBe("true");
      return jsonResponse({ return_policy_id: 1 }, { status: 201 });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.returnPolicies.create(1, { accepts_returns: true, accepts_exchanges: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("get() GETs a single return policy with apiKey auth", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/policies/return/2");
      const headers = new Headers(init?.headers);
      expect(headers.has("Authorization")).toBe(false);
      return jsonResponse({ return_policy_id: 2 });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    const result = await shop.returnPolicies.get(1, 2);

    expect(result).toEqual({ return_policy_id: 2 });
  });

  it("update() PUTs a form body to a single return policy", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(init?.method).toBe("PUT");
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/policies/return/2");
      expect((init?.body as URLSearchParams).get("accepts_returns")).toBe("false");
      return jsonResponse({ return_policy_id: 2, accepts_returns: false });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.returnPolicies.update(1, 2, { accepts_returns: false, accepts_exchanges: false });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("delete() DELETEs a single return policy and returns undefined for 204", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(init?.method).toBe("DELETE");
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/policies/return/2");
      return new Response(null, { status: 204 });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    const result = await shop.returnPolicies.delete(1, 2);

    expect(result).toBeUndefined();
  });

  it("consolidate() POSTs source/destination ids to the consolidate path", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/policies/return/consolidate");
      const body = init?.body as URLSearchParams;
      expect(body.get("source_return_policy_id")).toBe("10");
      expect(body.get("destination_return_policy_id")).toBe("20");
      return jsonResponse({ return_policy_id: 20 });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.returnPolicies.consolidate(1, {
      source_return_policy_id: 10,
      destination_return_policy_id: 20,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getAll() uses apiKey auth (no Authorization header)", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/policies/return");
      const headers = new Headers(init?.headers);
      expect(headers.has("Authorization")).toBe(false);
      return jsonResponse({ count: 0, results: [] });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.returnPolicies.getAll(1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("ShopResource.processingProfiles", () => {
  it("create() POSTs a readiness-state-definitions form body", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/readiness-state-definitions");
      const body = init?.body as URLSearchParams;
      expect(body.get("readiness_state")).toBe("ready_to_ship");
      return jsonResponse({ readiness_state_definition_id: 1 }, { status: 201 });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.processingProfiles.create(1, {
      readiness_state: "ready_to_ship",
      min_processing_time: 1,
      max_processing_time: 3,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getAll() forwards optional limit/offset query params", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe("/v3/application/shops/1/readiness-state-definitions");
      expect(parsed.searchParams.get("limit")).toBe("25");
      return jsonResponse({ count: 0, results: [] });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.processingProfiles.getAll(1, { limit: 25 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getAll() omits the query key entirely when no params are passed", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).search).toBe("");
      return jsonResponse({ count: 0, results: [] });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.processingProfiles.getAll(1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("get() GETs a single readiness-state-definition", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/readiness-state-definitions/2");
      return jsonResponse({ readiness_state_definition_id: 2 });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    const result = await shop.processingProfiles.get(1, 2);

    expect(result).toEqual({ readiness_state_definition_id: 2 });
  });

  it("update() PUTs a form body to a single readiness-state-definition", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(init?.method).toBe("PUT");
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/readiness-state-definitions/2");
      expect((init?.body as URLSearchParams).get("readiness_state")).toBe("made_to_order");
      return jsonResponse({ readiness_state_definition_id: 2, readiness_state: "made_to_order" });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.processingProfiles.update(1, 2, { readiness_state: "made_to_order" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("delete() DELETEs a single readiness-state-definition and returns undefined for 204", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(init?.method).toBe("DELETE");
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/readiness-state-definitions/2");
      return new Response(null, { status: 204 });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    const result = await shop.processingProfiles.delete(1, 2);

    expect(result).toBeUndefined();
  });
});

describe("ShopResource.holidayPreferences", () => {
  it("update() PUTs is_working to the holiday-preferences path", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(init?.method).toBe("PUT");
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/holiday-preferences/5");
      const body = init?.body as URLSearchParams;
      expect(body.get("is_working")).toBe("false");
      return jsonResponse({ holiday_id: 5, is_working: false });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.holidayPreferences.update(1, 5, { is_working: false });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getAll() GETs the holiday-preferences collection", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/holiday-preferences");
      return jsonResponse([]);
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.holidayPreferences.getAll(1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("ShopResource.productionPartners", () => {
  it("getAll() GETs the production-partners collection", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).pathname).toBe("/v3/application/shops/1/production-partners");
      return jsonResponse({ count: 0, results: [] });
    });

    const shop = makeShop(fetchMock as unknown as typeof fetch);
    await shop.productionPartners.getAll(1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
