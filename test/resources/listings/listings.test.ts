import { describe, expect, it, vi } from "vitest";
import { EtsyHttpClient } from "../../../src/http/EtsyHttpClient.js";
import type { EtsyOAuth } from "../../../src/auth/EtsyOAuth.js";
import { ListingsResource } from "../../../src/resources/listings/index.js";

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

/** Builds a ListingsResource wired to a real EtsyHttpClient with an injected fetch mock. */
function makeResource(fetchMock: typeof fetch, auth?: EtsyOAuth) {
  const http = new EtsyHttpClient({
    apiKey: "test-key",
    fetch: fetchMock,
    ...(auth ? { auth } : {}),
  });
  return { resource: new ListingsResource(http), http };
}

describe("ListingsResource — GET (apiKey)", () => {
  it("getListing builds the correct URL, method, and apiKey auth", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/listings/123?includes=Images%2CShop",
      );
      expect(init?.method).toBe("GET");
      const headers = new Headers(init?.headers);
      expect(headers.get("x-api-key")).toBe("test-key");
      expect(headers.has("Authorization")).toBe(false);
      return jsonResponse({ listing_id: 123, title: "A Listing" });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    const result = await resource.get(123, { includes: ["Images", "Shop"] });

    expect(result).toEqual({ listing_id: 123, title: "A Listing" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getListing omits the query string entirely when called with no params", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe("https://openapi.etsy.com/v3/application/listings/1");
      return jsonResponse({ listing_id: 1 });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.get(1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getByListingIds comma-joins the required listing_ids array query param", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/listings/batch?listing_ids=1%2C2%2C3",
      );
      return jsonResponse({ count: 3, results: [] });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.getByListingIds({ listing_ids: [1, 2, 3] });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("findAllActive omits the query string entirely when called with no params", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/listings/active",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.findAllActive();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("findAllActive forwards query params when provided", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/listings/active?keywords=candles",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.findAllActive({ keywords: "candles" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("findAllActiveByShop GETs the shop-scoped active-listings path", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/active",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.findAllActiveByShop(1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("findAllActiveByShop forwards query params when provided", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/active?limit=10",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.findAllActiveByShop(1, { limit: 10 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getFeaturedByShop GETs the featured-listings path", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/featured",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.getFeaturedByShop(1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getFeaturedByShop forwards query params when provided", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/featured?limit=10",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.getFeaturedByShop(1, { limit: 10 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getByShopSectionId requires shop_section_ids and comma-joins the array", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/shop-sections/listings?shop_section_ids=10%2C20",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.getByShopSectionId(1, { shop_section_ids: [10, 20] });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getProperties GETs the listing properties collection", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/properties",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.getProperties(1, 2);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getProperty GETs a single listing property", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/listings/2/properties/3",
      );
      return jsonResponse({ property_id: 3 });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    const result = await resource.getProperty(2, 3);

    expect(result).toEqual({ property_id: 3 });
  });
});

describe("ListingsResource — write operations (oauth)", () => {
  it("create() form-encodes the body, sets the Authorization header, and hits the right path", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/42/listings",
      );
      expect(init?.method).toBe("POST");
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer test-token");
      expect(init?.body).toBeInstanceOf(URLSearchParams);
      const body = init?.body as URLSearchParams;
      expect(body.get("quantity")).toBe("1");
      expect(body.get("title")).toBe("Hand-thrown mug");
      return jsonResponse({ listing_id: 999 }, { status: 201 });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    const result = await resource.create(42, {
      quantity: 1,
      title: "Hand-thrown mug",
      description: "A mug",
      price: 20,
      who_made: "i_did",
      when_made: "made_to_order",
      taxonomy_id: 1,
      shipping_profile_id: 1,
    });

    expect(result).toEqual({ listing_id: 999 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("delete() sends a DELETE and returns undefined for a 204 response", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe("https://openapi.etsy.com/v3/application/listings/7");
      expect(init?.method).toBe("DELETE");
      return new Response(null, { status: 204 });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    const result = await resource.delete(7);

    expect(result).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when an oauth operation is called without an auth-configured client", async () => {
    const fetchMock = vi.fn();
    const { resource } = makeResource(fetchMock);

    await expect(resource.delete(7)).rejects.toThrow(/requires OAuth/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("update() PATCHes a form-encoded body to the shop-scoped listing path", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2",
      );
      expect(init?.method).toBe("PATCH");
      expect((init?.body as URLSearchParams).get("title")).toBe("Updated title");
      return jsonResponse({ listing_id: 2, title: "Updated title" });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    await resource.update(1, 2, { title: "Updated title" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getByShop() GETs the shop-scoped listings collection with oauth", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    await resource.getByShop(1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getByShop() forwards query params when provided", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings?limit=10",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    await resource.getByShop(1, { limit: 10 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getShippingByListingIds requires listing_ids and comma-joins the array, with oauth", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/listings/batch/shipping?listing_ids=1%2C2",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    await resource.getShippingByListingIds({ listing_ids: [1, 2] });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getByShopReceipt() GETs the receipt-scoped listings path with oauth", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/receipts/2/listings",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    await resource.getByShopReceipt(1, 2);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getByShopReceipt() forwards query params when provided", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/receipts/2/listings?limit=10",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    await resource.getByShopReceipt(1, 2, { limit: 10 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getByShopReturnPolicy() GETs the return-policy-scoped listings path with oauth", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/policies/return/2/listings",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    await resource.getByShopReturnPolicy(1, 2);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getByShopReturnPolicy() forwards query params when provided", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/policies/return/2/listings?legacy=true",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    await resource.getByShopReturnPolicy(1, 2, { legacy: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("updateProperty() PUTs a form-encoded body to the listing property path", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/properties/3",
      );
      expect(init?.method).toBe("PUT");
      return jsonResponse({ property_id: 3 });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    await resource.updateProperty(1, 2, 3, {
      value_ids: [1],
      values: ["Red"],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("deleteProperty() sends a DELETE and returns undefined for a 204 response", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/properties/3",
      );
      expect(init?.method).toBe("DELETE");
      return new Response(null, { status: 204 });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    const result = await resource.deleteProperty(1, 2, 3);

    expect(result).toBeUndefined();
  });
});

describe("ListingsResource.files — multipart upload", () => {
  it("upload() sends a multipart/form-data body built from a Blob", async () => {
    const blob = new Blob(["fake-file-bytes"], { type: "application/octet-stream" });
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/files",
      );
      expect(init?.method).toBe("POST");
      expect(init?.body).toBeInstanceOf(FormData);
      const body = init?.body as FormData;
      const file = body.get("file") as Blob;
      expect(file).toBeInstanceOf(Blob);
      expect(file.size).toBe(blob.size);
      expect(body.get("name")).toBe("pattern.pdf");
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer test-token");
      return jsonResponse({ listing_file_id: 1 }, { status: 201 });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    const result = await resource.files.upload(1, 2, {
      file: blob,
      name: "pattern.pdf",
    });

    expect(result).toEqual({ listing_file_id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getAll() lists files for a listing with oauth", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/files",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    await resource.files.getAll(1, 2);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("get() reads a single file with oauth", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/files/3",
      );
      return jsonResponse({ listing_file_id: 3 });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    const result = await resource.files.get(1, 2, 3);

    expect(result).toEqual({ listing_file_id: 3 });
  });

  it("delete() sends a DELETE and returns undefined for a 204 response", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/files/3",
      );
      expect(init?.method).toBe("DELETE");
      return new Response(null, { status: 204 });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    const result = await resource.files.delete(1, 2, 3);

    expect(result).toBeUndefined();
  });
});

describe("ListingsResource.images — no shop_id in the read path", () => {
  it("getAll() reads via /v3/application/listings/{listing_id}/images with apiKey auth", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/listings/5/images",
      );
      const headers = new Headers(init?.headers);
      expect(headers.has("Authorization")).toBe(false);
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.images.getAll(5);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("get() reads a single image with apiKey auth", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/listings/5/images/9",
      );
      return jsonResponse({ listing_image_id: 9 });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    const result = await resource.images.get(5, 9);

    expect(result).toEqual({ listing_image_id: 9 });
  });

  it("upload() sends a multipart/form-data body built from a Blob, with oauth auth", async () => {
    const blob = new Blob(["fake-image-bytes"], { type: "image/png" });
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/images",
      );
      expect(init?.method).toBe("POST");
      expect(init?.body).toBeInstanceOf(FormData);
      const body = init?.body as FormData;
      const image = body.get("image") as Blob;
      expect(image).toBeInstanceOf(Blob);
      expect(image.size).toBe(blob.size);
      return jsonResponse({ listing_image_id: 1 }, { status: 201 });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    const result = await resource.images.upload(1, 2, {
      image: blob,
    });

    expect(result).toEqual({ listing_image_id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("delete() sends a DELETE and returns undefined for a 204 response", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/images/9",
      );
      expect(init?.method).toBe("DELETE");
      return new Response(null, { status: 204 });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    const result = await resource.images.delete(1, 2, 9);

    expect(result).toBeUndefined();
  });
});

describe("ListingsResource.videos", () => {
  it("upload() sends a multipart/form-data body built from a Blob, with oauth auth", async () => {
    const blob = new Blob(["fake-video-bytes"], { type: "video/mp4" });
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/videos",
      );
      expect(init?.method).toBe("POST");
      expect(init?.body).toBeInstanceOf(FormData);
      const body = init?.body as FormData;
      const video = body.get("video") as Blob;
      expect(video).toBeInstanceOf(Blob);
      expect(video.size).toBe(blob.size);
      expect(body.get("name")).toBe("demo.mp4");
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer test-token");
      return jsonResponse({ video_id: 1 }, { status: 201 });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    const result = await resource.videos.upload(1, 2, {
      video: blob,
      name: "demo.mp4",
    });

    expect(result).toEqual({ video_id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("get() reads a single video via GET with apiKey auth", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/listings/5/videos/9",
      );
      expect(init?.method).toBe("GET");
      const headers = new Headers(init?.headers);
      expect(headers.has("Authorization")).toBe(false);
      return jsonResponse({ video_id: 9 });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.videos.get(5, 9);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getAll() lists videos for a listing with apiKey auth", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/listings/5/videos",
      );
      return jsonResponse({ count: 0, results: [] });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.videos.getAll(5);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("delete() sends a DELETE and returns undefined for a 204 response", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/videos/9",
      );
      expect(init?.method).toBe("DELETE");
      return new Response(null, { status: 204 });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    const result = await resource.videos.delete(1, 2, 9);

    expect(result).toBeUndefined();
  });
});

describe("ListingsResource.variationImages", () => {
  it("getAll() lists variation images with apiKey auth", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/variation-images",
      );
      const headers = new Headers(init?.headers);
      expect(headers.has("Authorization")).toBe(false);
      return jsonResponse({ variation_images: [] });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.variationImages.getAll(1, 2);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("update() sends a JSON body with oauth auth", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/variation-images",
      );
      expect(init?.method).toBe("POST");
      const headers = new Headers(init?.headers);
      expect(headers.get("Content-Type")).toBe("application/json");
      expect(headers.get("Authorization")).toBe("Bearer test-token");
      expect(init?.body).toBe(
        JSON.stringify({ variation_images: [{ property_id: 1, value_id: 2, image_id: 3 }] }),
      );
      return jsonResponse({ variation_images: [] });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    await resource.variationImages.update(1, 2, {
      variation_images: [{ property_id: 1, value_id: 2, image_id: 3 }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("ListingsResource.translations", () => {
  it("create() form-encodes the body with oauth auth and the {language} path param", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/translations/fr",
      );
      expect(init?.method).toBe("POST");
      expect(init?.body).toBeInstanceOf(URLSearchParams);
      const body = init?.body as URLSearchParams;
      expect(body.get("title")).toBe("Une tasse");
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer test-token");
      return jsonResponse({ title: "Une tasse", description: "Une belle tasse" });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    await resource.translations.create(1, 2, "fr", {
      title: "Une tasse",
      description: "Une belle tasse",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("get() reads via GET with apiKey auth", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/translations/de",
      );
      expect(init?.method).toBe("GET");
      const headers = new Headers(init?.headers);
      expect(headers.has("Authorization")).toBe(false);
      return jsonResponse({ title: "Eine Tasse", description: "Eine schöne Tasse" });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.translations.get(1, 2, "de");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("update() PUTs a form-encoded body with oauth auth", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/translations/fr",
      );
      expect(init?.method).toBe("PUT");
      expect((init?.body as URLSearchParams).get("title")).toBe("Une tasse mise à jour");
      return jsonResponse({ title: "Une tasse mise à jour" });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    await resource.translations.update(1, 2, "fr", {
      title: "Une tasse mise à jour",
      description: "Une belle tasse mise à jour",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("ListingsResource.personalization — nullable query normalization", () => {
  it("get() reads via GET with apiKey auth", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/listings/2/personalization",
      );
      const headers = new Headers(init?.headers);
      expect(headers.has("Authorization")).toBe(false);
      return jsonResponse({ personalization_questions: [] });
    });
    const { resource } = makeResource(fetchMock as unknown as typeof fetch);

    await resource.personalization.get(2);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("delete() sends a DELETE and returns undefined for a 204 response", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/personalization",
      );
      expect(init?.method).toBe("DELETE");
      return new Response(null, { status: 204 });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    const result = await resource.personalization.delete(1, 2);

    expect(result).toBeUndefined();
  });

  it("update() omits the query param when supports_multiple_personalization_questions is null", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/personalization",
      );
      const headers = new Headers(init?.headers);
      expect(headers.get("Content-Type")).toBe("application/json");
      return jsonResponse({}, { status: 201 });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    await resource.personalization.update(
      1,
      2,
      { personalization_questions: [] },
      { supports_multiple_personalization_questions: null },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("update() forwards a real boolean query value", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/1/listings/2/personalization?supports_multiple_personalization_questions=true",
      );
      return jsonResponse({}, { status: 201 });
    });
    const { resource } = makeResource(
      fetchMock as unknown as typeof fetch,
      fakeOAuth("test-token"),
    );

    await resource.personalization.update(
      1,
      2,
      { personalization_questions: [] },
      { supports_multiple_personalization_questions: true },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
