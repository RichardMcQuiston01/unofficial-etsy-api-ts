import { describe, expect, it, vi } from "vitest";
import { EtsyHttpClient } from "../../../src/http/EtsyHttpClient.js";
import type { EtsyOAuth } from "../../../src/auth/EtsyOAuth.js";
import { ListingsResource } from "../../../src/resources/listings/index.js";
import type { UploadListingFileRequestBody } from "../../../src/generated/operations.js";

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

    // openapi-typescript maps `format: binary` fields to `string`, but the
    // real wire value is a Blob (EtsyHttpClient's multipart builder passes
    // Blob instances through untouched) — cast at the call site the same
    // way a real consumer would.
    const result = await resource.files.upload(1, 2, {
      file: blob,
      name: "pattern.pdf",
    } as unknown as UploadListingFileRequestBody);

    expect(result).toEqual({ listing_file_id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
});

describe("ListingsResource.personalization — nullable query normalization", () => {
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
