import { describe, expect, it, vi } from "vitest";
import { EtsyHttpClient } from "../../src/http/EtsyHttpClient.js";
import { EtsyApiError } from "../../src/http/EtsyApiError.js";
import type { EtsyOAuth } from "../../src/auth/EtsyOAuth.js";

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

describe("EtsyHttpClient — happy path", () => {
  it("sends x-api-key, substitutes path params, and serializes query params (arrays comma-joined)", async () => {
    const fetchMock = vi.fn(async (url: string | URL, _init?: RequestInit) => {
      const parsed = new URL(url);
      expect(parsed.toString()).toBe(
        "https://openapi.etsy.com/v3/application/shops/123/listings/active?limit=10&listing_ids=1%2C2%2C3",
      );
      return jsonResponse({ count: 1, results: [{ listing_id: 1 }] });
    });

    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock as unknown as typeof fetch,
    });

    const result = await client.request<{ count: number }>({
      method: "GET",
      path: "/v3/application/shops/{shop_id}/listings/active",
      pathParams: { shop_id: 123 },
      query: { limit: 10, listing_ids: [1, 2, 3] },
      auth: "apiKey",
      operationId: "findAllActiveListingsByShop",
    });

    expect(result.count).toBe(1);
    const [, init] = fetchMock.mock.calls[0]!;
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("x-api-key")).toBe("test-key");
    expect(headers.has("Authorization")).toBe(false);
  });

  it("returns undefined for a 204 No Content response", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock,
    });

    const result = await client.request({
      method: "DELETE",
      path: "/v3/application/listings/{listing_id}",
      pathParams: { listing_id: 1 },
      auth: "apiKey",
      operationId: "deleteListing",
    });

    expect(result).toBeUndefined();
  });

  it("attaches an Authorization bearer header for oauth-authed operations", async () => {
    const fetchMock = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer abc123");
      return jsonResponse({ listing_id: 1 });
    });

    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock as unknown as typeof fetch,
      auth: fakeOAuth("abc123"),
    });

    await client.request({
      method: "GET",
      path: "/v3/application/listings/{listing_id}",
      pathParams: { listing_id: 1 },
      auth: "oauth",
      operationId: "getListing",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws a clear error for an oauth-required operation when no auth is configured", async () => {
    const fetchMock = vi.fn();
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock,
    });

    await expect(
      client.request({
        method: "GET",
        path: "/v3/application/user/addresses",
        auth: "oauth",
        operationId: "getUserAddresses",
      }),
    ).rejects.toThrow(/requires OAuth/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when a path parameter is missing", async () => {
    const fetchMock = vi.fn();
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock,
    });

    await expect(
      client.request({
        method: "GET",
        path: "/v3/application/listings/{listing_id}",
        auth: "apiKey",
        operationId: "getListing",
      }),
    ).rejects.toThrow(/unresolved path parameter/i);
  });

  it("tracks the most recent rate-limit snapshot across requests", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        { ping: "pong" },
        {
          headers: {
            "Content-Type": "application/json",
            "x-limit-per-day": "10000",
            "x-remaining-today": "9999",
            "x-limit-per-second": "10",
            "x-remaining-this-second": "9",
          },
        },
      ),
    );
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock,
    });

    expect(client.getLastRateLimit()).toBeUndefined();
    await client.request({
      method: "GET",
      path: "/v3/application/openapi-ping",
      auth: "apiKey",
      operationId: "ping",
    });

    expect(client.getLastRateLimit()).toEqual({
      limitPerDay: 10000,
      remainingToday: 9999,
      limitPerSecond: 10,
      remainingThisSecond: 9,
    });
  });

  it("tracks a partial snapshot when only some rate-limit headers are present, ignoring malformed values", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        { ping: "pong" },
        {
          headers: {
            "Content-Type": "application/json",
            "x-limit-per-day": "not-a-number",
            "x-remaining-today": "9999",
          },
        },
      ),
    );
    const client = new EtsyHttpClient({ apiKey: "test-key", fetch: fetchMock });

    await client.request({
      method: "GET",
      path: "/v3/application/openapi-ping",
      auth: "apiKey",
      operationId: "ping",
    });

    expect(client.getLastRateLimit()).toEqual({ remainingToday: 9999 });
  });

  it("tracks a partial snapshot when only the per-second headers are present", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        { ping: "pong" },
        {
          headers: {
            "Content-Type": "application/json",
            "x-limit-per-second": "10",
            "x-remaining-this-second": "1",
          },
        },
      ),
    );
    const client = new EtsyHttpClient({ apiKey: "test-key", fetch: fetchMock });

    await client.request({
      method: "GET",
      path: "/v3/application/openapi-ping",
      auth: "apiKey",
      operationId: "ping",
    });

    expect(client.getLastRateLimit()).toEqual({ limitPerSecond: 10, remainingThisSecond: 1 });
  });
});

describe("EtsyHttpClient — request bodies", () => {
  it("form-encodes body data, comma-joining arrays, and lets fetch set the Content-Type", async () => {
    const fetchMock = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      expect(init?.body).toBeInstanceOf(URLSearchParams);
      const body = init?.body as URLSearchParams;
      expect(body.get("title")).toBe("My Listing");
      expect(body.get("materials")).toBe("wood,glass");
      return jsonResponse({ listing_id: 1 }, { status: 201 });
    });
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock as unknown as typeof fetch,
      auth: fakeOAuth("abc123"),
    });

    await client.request({
      method: "POST",
      path: "/v3/application/shops/{shop_id}/listings",
      pathParams: { shop_id: 1 },
      body: {
        kind: "form",
        data: { title: "My Listing", materials: ["wood", "glass"], omit_me: undefined },
      },
      auth: "oauth",
      operationId: "createDraftListing",
    });
  });

  it("JSON-encodes body data and sets Content-Type: application/json", async () => {
    const fetchMock = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("Content-Type")).toBe("application/json");
      expect(init?.body).toBe(JSON.stringify({ products: [] }));
      return jsonResponse({ listing_id: 1 });
    });
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock as unknown as typeof fetch,
      auth: fakeOAuth("abc123"),
    });

    await client.request({
      method: "PUT",
      path: "/v3/application/listings/{listing_id}/inventory",
      pathParams: { listing_id: 1 },
      body: { kind: "json", data: { products: [] } },
      auth: "oauth",
      operationId: "updateListingInventory",
    });
  });

  it("builds multipart bodies as FormData, passing Blob content through unmodified", async () => {
    const blob = new Blob(["fake-image-bytes"], { type: "image/png" });
    const fetchMock = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      expect(init?.body).toBeInstanceOf(FormData);
      const body = init?.body as FormData;
      // FormData.set() wraps a Blob in a File (per spec), so it's a new
      // object — assert content equality, not reference equality.
      const image = body.get("image") as Blob;
      expect(image).toBeInstanceOf(Blob);
      expect(image.size).toBe(blob.size);
      expect(image.type).toBe(blob.type);
      expect(body.get("rank")).toBe("1");
      expect(body.has("alt_text")).toBe(false);
      return jsonResponse({ listing_image_id: 1 }, { status: 201 });
    });
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock as unknown as typeof fetch,
      auth: fakeOAuth("abc123"),
    });

    await client.request({
      method: "POST",
      path: "/v3/application/shops/{shop_id}/listings/{listing_id}/images",
      pathParams: { shop_id: 1, listing_id: 2 },
      body: { kind: "multipart", data: { image: blob, rank: 1, alt_text: undefined } },
      auth: "oauth",
      operationId: "uploadListingImage",
    });
  });
});

describe("EtsyHttpClient — errors", () => {
  it("maps a non-2xx response to EtsyApiError using the ErrorSchema `error` field", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: "Listing not found" }, { status: 404 }),
    );
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock,
    });

    const promise = client.request({
      method: "GET",
      path: "/v3/application/listings/{listing_id}",
      pathParams: { listing_id: 999 },
      auth: "apiKey",
      operationId: "getListing",
    });

    await expect(promise).rejects.toThrow(EtsyApiError);
    await expect(promise).rejects.toMatchObject({
      status: 404,
      etsyError: "Listing not found",
      operationId: "getListing",
    });
  });

  it("attaches the rate-limit snapshot to EtsyApiError when the error response carries rate-limit headers", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "Internal error" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "x-limit-per-day": "5000",
            "x-remaining-today": "10",
            "x-limit-per-second": "10",
            "x-remaining-this-second": "1",
          },
        }),
    );
    const client = new EtsyHttpClient({ apiKey: "test-key", fetch: fetchMock });

    const error = await client
      .request({
        method: "GET",
        path: "/v3/application/openapi-ping",
        auth: "apiKey",
        operationId: "ping",
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(EtsyApiError);
    expect((error as EtsyApiError).rateLimit).toEqual({
      limitPerDay: 5000,
      remainingToday: 10,
      limitPerSecond: 10,
      remainingThisSecond: 1,
    });
  });

  it("does not retry on 401/403/404/500/503 — only 429 is retried", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: "Internal error" }, { status: 500 }));
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock,
    });

    await expect(
      client.request({
        method: "GET",
        path: "/v3/application/openapi-ping",
        auth: "apiKey",
        operationId: "ping",
      }),
    ).rejects.toThrow(EtsyApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to statusText when the error body isn't valid JSON", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response("<html>Bad Gateway</html>", { status: 502, statusText: "Bad Gateway" }),
    );
    const client = new EtsyHttpClient({ apiKey: "test-key", fetch: fetchMock });

    const error = await client
      .request({
        method: "GET",
        path: "/v3/application/openapi-ping",
        auth: "apiKey",
        operationId: "ping",
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(EtsyApiError);
    expect((error as EtsyApiError).status).toBe(502);
    expect(typeof (error as EtsyApiError).etsyError).toBe("string");
    expect((error as EtsyApiError).etsyError.length).toBeGreaterThan(0);
  });

  it("falls back to statusText when the error body is valid JSON without an `error` string field", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ message: "nope" }), {
          status: 400,
          statusText: "Bad Request",
          headers: { "Content-Type": "application/json" },
        }),
    );
    const client = new EtsyHttpClient({ apiKey: "test-key", fetch: fetchMock });

    const error = await client
      .request({
        method: "GET",
        path: "/v3/application/openapi-ping",
        auth: "apiKey",
        operationId: "ping",
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(EtsyApiError);
    expect((error as EtsyApiError).etsyError).toBe("Bad Request");
  });

  it("falls back to 'HTTP <status>' when statusText is also empty", async () => {
    const fetchMock = vi.fn(async () => new Response("", { status: 418, statusText: "" }));
    const client = new EtsyHttpClient({ apiKey: "test-key", fetch: fetchMock });

    const error = await client
      .request({
        method: "GET",
        path: "/v3/application/openapi-ping",
        auth: "apiKey",
        operationId: "ping",
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(EtsyApiError);
    expect((error as EtsyApiError).etsyError).toBe("HTTP 418");
  });

  it("rejects a non-scalar array element in a form body", async () => {
    const fetchMock = vi.fn();
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock,
      auth: fakeOAuth("abc123"),
    });

    await expect(
      client.request({
        method: "POST",
        path: "/v3/application/shops/{shop_id}/listings",
        pathParams: { shop_id: 1 },
        body: { kind: "form", data: { tags: [{ nested: true }] } },
        auth: "oauth",
        operationId: "createDraftListing",
      }),
    ).rejects.toThrow(/non-scalar array element/);
  });

  it("rejects a non-scalar field value in a form body", async () => {
    const fetchMock = vi.fn();
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock,
      auth: fakeOAuth("abc123"),
    });

    await expect(
      client.request({
        method: "POST",
        path: "/v3/application/shops/{shop_id}/listings",
        pathParams: { shop_id: 1 },
        body: { kind: "form", data: { title: { nested: true } } },
        auth: "oauth",
        operationId: "createDraftListing",
      }),
    ).rejects.toThrow(/must be a string, number, boolean/);
  });
});

describe("EtsyHttpClient — 429 retry policy", () => {
  it("retries a 429, honoring Retry-After, and succeeds once the server recovers", async () => {
    let call = 0;
    const fetchMock = vi.fn(async () => {
      call += 1;
      if (call === 1) {
        return new Response(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "0" },
        });
      }
      return jsonResponse({ ping: "pong" });
    });
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock,
    });

    const result = await client.request<{ ping: string }>({
      method: "GET",
      path: "/v3/application/openapi-ping",
      auth: "apiKey",
      operationId: "ping",
    });

    expect(result.ping).toBe("pong");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to exponential backoff when Retry-After is present but not a valid number", async () => {
    let call = 0;
    const fetchMock = vi.fn(async () => {
      call += 1;
      if (call === 1) {
        return new Response(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "not-a-number" },
        });
      }
      return jsonResponse({ ping: "pong" });
    });
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock,
      retry: { maxBackoffMs: 5 },
    });

    const result = await client.request<{ ping: string }>({
      method: "GET",
      path: "/v3/application/openapi-ping",
      auth: "apiKey",
      operationId: "ping",
    });

    expect(result.ping).toBe("pong");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after maxRetries and throws EtsyApiError(429)", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }),
    );
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock,
      retry: { maxRetries: 2, maxBackoffMs: 5 },
    });

    const promise = client.request({
      method: "GET",
      path: "/v3/application/openapi-ping",
      auth: "apiKey",
      operationId: "ping",
    });

    await expect(promise).rejects.toMatchObject({ status: 429 });
    // 1 initial attempt + 2 retries = 3 calls.
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("EtsyHttpClient — baseUrl", () => {
  it("preserves a path prefix on a non-default baseUrl instead of discarding it", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe(
        "http://localhost:3000/etsy/v3/application/openapi-ping",
      );
      return jsonResponse({ ping: "pong" });
    });
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      baseUrl: "http://localhost:3000/etsy",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await client.request({
      method: "GET",
      path: "/v3/application/openapi-ping",
      auth: "apiKey",
      operationId: "ping",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("still resolves correctly against the default baseUrl (no path prefix to preserve)", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(new URL(url).toString()).toBe("https://openapi.etsy.com/v3/application/openapi-ping");
      return jsonResponse({ ping: "pong" });
    });
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await client.request({
      method: "GET",
      path: "/v3/application/openapi-ping",
      auth: "apiKey",
      operationId: "ping",
    });
  });
});

describe("EtsyHttpClient — cancellation", () => {
  it("aborts the underlying fetch when the caller-provided signal aborts", async () => {
    const fetchMock = vi.fn(
      (_url: string | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock as unknown as typeof fetch,
    });
    const controller = new AbortController();

    const promise = client.request({
      method: "GET",
      path: "/v3/application/openapi-ping",
      auth: "apiKey",
      operationId: "ping",
      signal: controller.signal,
    });

    controller.abort();

    await expect(promise).rejects.toThrow(/aborted/i);
  });

  it("immediately aborts the underlying fetch when the caller-provided signal is already aborted", async () => {
    const fetchMock = vi.fn(
      (_url: string | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          if (init?.signal?.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
            return;
          }
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock as unknown as typeof fetch,
    });
    const controller = new AbortController();
    controller.abort();

    const promise = client.request({
      method: "GET",
      path: "/v3/application/openapi-ping",
      auth: "apiKey",
      operationId: "ping",
      signal: controller.signal,
    });

    await expect(promise).rejects.toThrow(/aborted/i);
  });

  it("immediately aborts when the per-attempt timeout signal is already aborted at combine time", async () => {
    const alreadyAbortedTimeout = new AbortController();
    alreadyAbortedTimeout.abort(new DOMException("Aborted", "TimeoutError"));
    const timeoutSpy = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValueOnce(alreadyAbortedTimeout.signal);

    const fetchMock = vi.fn(
      (_url: string | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          if (init?.signal?.aborted) {
            reject(new DOMException("Aborted", "TimeoutError"));
            return;
          }
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "TimeoutError"));
          });
        }),
    );
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock as unknown as typeof fetch,
    });
    const controller = new AbortController();

    const promise = client.request({
      method: "GET",
      path: "/v3/application/openapi-ping",
      auth: "apiKey",
      operationId: "ping",
      signal: controller.signal,
    });

    await expect(promise).rejects.toThrow(/aborted/i);
    timeoutSpy.mockRestore();
  });

  it("aborts a request that exceeds the configured timeout", async () => {
    const fetchMock = vi.fn(
      (_url: string | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "TimeoutError"));
          });
        }),
    );
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock as unknown as typeof fetch,
      timeoutMs: 10,
    });

    const promise = client.request({
      method: "GET",
      path: "/v3/application/openapi-ping",
      auth: "apiKey",
      operationId: "ping",
    });

    await expect(promise).rejects.toThrow();
  });

  it("aborts via the timeout when a non-aborting caller signal is also present", async () => {
    const fetchMock = vi.fn(
      (_url: string | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "TimeoutError"));
          });
        }),
    );
    const client = new EtsyHttpClient({
      apiKey: "test-key",
      fetch: fetchMock as unknown as typeof fetch,
      timeoutMs: 10,
    });
    // Never aborted — exercises the "combine with a caller signal, then the
    // *timeout* signal fires" path, distinct from the caller-aborts test above.
    const controller = new AbortController();

    const promise = client.request({
      method: "GET",
      path: "/v3/application/openapi-ping",
      auth: "apiKey",
      operationId: "ping",
      signal: controller.signal,
    });

    await expect(promise).rejects.toThrow();
  });
});

describe("EtsyHttpClient — constructor", () => {
  it("throws when no fetch is injected and no global fetch is available", () => {
    const originalFetch = globalThis.fetch;
    // @ts-expect-error - simulating an environment without a global fetch.
    delete globalThis.fetch;
    try {
      expect(() => new EtsyHttpClient({ apiKey: "test-key" })).toThrow(
        /requires a fetch implementation/,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
