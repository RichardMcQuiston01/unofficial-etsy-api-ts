import type { EtsyClientConfig } from "../config.js";
import { EtsyApiError, type RateLimitSnapshot } from "./EtsyApiError.js";

const DEFAULT_BASE_URL = "https://openapi.etsy.com";
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_MAX_BACKOFF_MS = 30_000;
const DEFAULT_TIMEOUT_MS = 30_000;

/** The three shapes #buildBody ever produces; avoids depending on the DOM-lib-only `BodyInit` alias. */
type FetchBody = string | URLSearchParams | FormData;

export type RequestBody =
  | { kind: "json"; data: unknown }
  | { kind: "form"; data: Record<string, unknown> } // x-www-form-urlencoded
  | { kind: "multipart"; data: Record<string, unknown> }; // file/image/video upload

export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Template path, e.g. "/v3/application/shops/{shop_id}/listings". */
  path: string;
  pathParams?: Record<string, string | number>;
  query?: Record<string, string | number | boolean | Array<string | number> | undefined>;
  body?: RequestBody;
  /** "apiKey" for the 32 public operations; "oauth" for the 73 that need a
   *  scope. Determines whether EtsyHttpClient calls auth.getValidAccessToken(). */
  auth: "apiKey" | "oauth";
  /** For error attribution and future request-level telemetry. */
  operationId: string;
  /** Caller-provided cancellation, combined with the client's per-request timeout. */
  signal?: AbortSignal;
}

/** Combines an optional caller signal with a fresh per-attempt timeout signal.
 *  Avoids relying on AbortSignal.any(), which isn't available on Node 18. */
function combineSignals(callerSignal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!callerSignal) return timeoutSignal;

  const controller = new AbortController();
  const abortFrom = (signal: AbortSignal) => controller.abort(signal.reason as unknown);
  if (callerSignal.aborted) abortFrom(callerSignal);
  else if (timeoutSignal.aborted) abortFrom(timeoutSignal);
  else {
    callerSignal.addEventListener("abort", () => abortFrom(callerSignal), { once: true });
    timeoutSignal.addEventListener("abort", () => abortFrom(timeoutSignal), { once: true });
  }
  return controller.signal;
}

function parseIntHeader(headers: Headers, name: string): number | undefined {
  const raw = headers.get(name);
  if (raw === null) return undefined;
  const value = Number.parseInt(raw, 10);
  return Number.isNaN(value) ? undefined : value;
}

function parseRateLimitHeaders(headers: Headers): RateLimitSnapshot | undefined {
  const limitPerDay = parseIntHeader(headers, "x-limit-per-day");
  const remainingToday = parseIntHeader(headers, "x-remaining-today");
  const limitPerSecond = parseIntHeader(headers, "x-limit-per-second");
  const remainingThisSecond = parseIntHeader(headers, "x-remaining-this-second");

  if (
    limitPerDay === undefined &&
    remainingToday === undefined &&
    limitPerSecond === undefined &&
    remainingThisSecond === undefined
  ) {
    return undefined;
  }

  const snapshot: RateLimitSnapshot = {};
  if (limitPerDay !== undefined) snapshot.limitPerDay = limitPerDay;
  if (remainingToday !== undefined) snapshot.remainingToday = remainingToday;
  if (limitPerSecond !== undefined) snapshot.limitPerSecond = limitPerSecond;
  if (remainingThisSecond !== undefined) snapshot.remainingThisSecond = remainingThisSecond;
  return snapshot;
}

/** Honors Retry-After (seconds) when present, else exponential backoff; both capped at maxBackoffMs. */
function computeRetryDelayMs(response: Response, attempt: number, maxBackoffMs: number): number {
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter !== null) {
    const seconds = Number.parseInt(retryAfter, 10);
    if (!Number.isNaN(seconds)) {
      return Math.min(seconds * 1000, maxBackoffMs);
    }
  }
  const exponentialMs = 2 ** attempt * 1000;
  return Math.min(exponentialMs, maxBackoffMs);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function extractEtsyError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
      return body.error;
    }
  } catch {
    // Body wasn't JSON (or was empty) — fall through to statusText.
  }
  return response.statusText || `HTTP ${response.status}`;
}

/** string/number/boolean, matching every scalar field type in Etsy's form/multipart request schemas. */
type Scalar = string | number | boolean;

function isScalar(value: unknown): value is Scalar {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function stringifyField(key: string, value: unknown): string {
  if (Array.isArray(value)) {
    if (!value.every(isScalar)) {
      throw new Error(`EtsyHttpClient: field "${key}" has a non-scalar array element.`);
    }
    return value.join(",");
  }
  if (!isScalar(value)) {
    throw new Error(
      `EtsyHttpClient: field "${key}" must be a string, number, boolean, or array of those.`,
    );
  }
  return String(value);
}

function buildFormBody(data: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    params.set(key, stringifyField(key, value));
  }
  return params;
}

function buildMultipartBody(data: Record<string, unknown>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (value instanceof Blob) {
      formData.set(key, value);
    } else {
      formData.set(key, stringifyField(key, value));
    }
  }
  return formData;
}

/**
 * fetch-based transport: injects auth (x-api-key always, OAuth bearer token
 * when the operation needs it), tracks rate-limit headers, retries 429s,
 * and maps non-2xx responses to EtsyApiError. See
 * docs/ARCHITECTURE.md#transport-srchttpetsyhttpclientts.
 */
export class EtsyHttpClient {
  readonly #apiKey: string;
  readonly #baseUrl: string;
  readonly #fetch: typeof fetch;
  readonly #auth: EtsyClientConfig["auth"];
  readonly #maxRetries: number;
  readonly #maxBackoffMs: number;
  readonly #timeoutMs: number;
  #lastRateLimit: RateLimitSnapshot | undefined;

  constructor(config: EtsyClientConfig) {
    // An unbound global fetch throws "Illegal invocation" in spec-compliant
    // browsers once stored on `this` and called as `this.#fetch(...)` — the
    // receiver becomes the EtsyHttpClient instance instead of the global.
    const fetchImpl = config.fetch ?? globalThis.fetch?.bind(globalThis);
    if (!fetchImpl) {
      throw new Error(
        "EtsyHttpClient requires a fetch implementation. Pass one via `fetch` in " +
          "EtsyClientConfig, or run in an environment with a global fetch.",
      );
    }

    this.#apiKey = config.apiKey;
    this.#baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.#fetch = fetchImpl;
    this.#auth = config.auth;
    this.#maxRetries = config.retry?.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.#maxBackoffMs = config.retry?.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS;
    this.#timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /** Most recent rate-limit snapshot seen from any response. */
  getLastRateLimit(): RateLimitSnapshot | undefined {
    return this.#lastRateLimit;
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const url = this.#buildUrl(options);
    const headers = new Headers();
    headers.set("x-api-key", this.#apiKey);

    if (options.auth === "oauth") {
      if (!this.#auth) {
        throw new Error(
          `EtsyHttpClient: operation "${options.operationId}" requires OAuth, but this ` +
            "client was constructed without `auth` in EtsyClientConfig.",
        );
      }
      const accessToken = await this.#auth.getValidAccessToken();
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const body = this.#buildBody(options.body, headers);

    return this.#send<T>(
      url,
      options.method,
      headers,
      body,
      options.operationId,
      options.signal,
      0,
    );
  }

  async #send<T>(
    url: string,
    method: string,
    headers: Headers,
    body: FetchBody | undefined,
    operationId: string,
    callerSignal: AbortSignal | undefined,
    attempt: number,
  ): Promise<T> {
    // A fresh timeout window per attempt — a slow-but-eventually-429 server
    // doesn't get to consume the whole budget on one hung attempt.
    const signal = combineSignals(callerSignal, this.#timeoutMs);
    const response = await this.#fetch(url, { method, headers, signal, ...(body ? { body } : {}) });

    const rateLimit = parseRateLimitHeaders(response.headers);
    if (rateLimit) this.#lastRateLimit = rateLimit;

    if (response.status === 429 && attempt < this.#maxRetries) {
      const delayMs = computeRetryDelayMs(response, attempt, this.#maxBackoffMs);
      await sleep(delayMs);
      return this.#send<T>(url, method, headers, body, operationId, callerSignal, attempt + 1);
    }

    if (!response.ok) {
      const etsyError = await extractEtsyError(response);
      throw new EtsyApiError({
        status: response.status,
        etsyError,
        operationId,
        ...(this.#lastRateLimit ? { rateLimit: this.#lastRateLimit } : {}),
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  #buildUrl(options: RequestOptions): string {
    let path = options.path;
    for (const [key, value] of Object.entries(options.pathParams ?? {})) {
      path = path.replace(`{${key}}`, encodeURIComponent(String(value)));
    }
    if (/\{[^}]+\}/.test(path)) {
      throw new Error(
        `EtsyHttpClient: unresolved path parameter(s) in "${path}" for operation ` +
          `"${options.operationId}". Check pathParams.`,
      );
    }

    // `path` always starts with "/" (e.g. "/v3/application/..."), and
    // `new URL(absolutePath, base)` replaces the *entire* path of `base` per
    // the URL spec — silently dropping any path prefix in a non-default
    // baseUrl (e.g. a mock server mounted at "http://localhost:3000/etsy").
    // Join base.pathname + path explicitly instead.
    const base = new URL(this.#baseUrl);
    const basePath = base.pathname === "/" ? "" : base.pathname.replace(/\/$/, "");
    const url = new URL(basePath + path, base.origin);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value === undefined) continue;
      url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
    return url.toString();
  }

  #buildBody(body: RequestBody | undefined, headers: Headers): FetchBody | undefined {
    if (!body) return undefined;

    switch (body.kind) {
      case "json":
        headers.set("Content-Type", "application/json");
        return JSON.stringify(body.data);
      case "form":
        // fetch sets Content-Type: application/x-www-form-urlencoded from URLSearchParams automatically.
        return buildFormBody(body.data);
      case "multipart":
        // fetch sets Content-Type: multipart/form-data; boundary=... from FormData automatically.
        return buildMultipartBody(body.data);
    }
  }
}
