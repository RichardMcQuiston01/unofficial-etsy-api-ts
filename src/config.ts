import type { EtsyOAuth } from "./auth/EtsyOAuth.js";

export interface RetryConfig {
  /** Retries on 429 only, honoring Retry-After. Default 3. */
  maxRetries?: number;
  /** Cap on backoff delay in ms. Default 30_000. */
  maxBackoffMs?: number;
}

export interface EtsyClientConfig {
  /** Etsy "keystring" — sent as x-api-key and doubles as the OAuth client_id. */
  apiKey: string;
  /** Injectable fetch implementation; defaults to global fetch. Required in
   *  environments without one. */
  fetch?: typeof fetch;
  /** Defaults to "https://openapi.etsy.com". Override for testing. */
  baseUrl?: string;
  /** Omit for API-key-only usage (32 public operations). Required for the
   *  73 operations that need OAuth scopes. */
  auth?: EtsyOAuth;
  retry?: RetryConfig;
  /** Per-request timeout in ms, applied via AbortSignal.timeout(). Default
   *  30_000. Each 429 retry gets a fresh timeout window. */
  timeoutMs?: number;
}
