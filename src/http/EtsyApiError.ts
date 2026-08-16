/** Snapshot of Etsy's per-request rate-limit headers, as of the most recent response seen. */
export interface RateLimitSnapshot {
  limitPerDay?: number;
  remainingToday?: number;
  limitPerSecond?: number;
  remainingThisSecond?: number;
}

export interface EtsyApiErrorOptions {
  status: number;
  etsyError: string;
  rateLimit?: RateLimitSnapshot;
  operationId?: string;
}

/**
 * The only error type EtsyHttpClient.request() throws for a non-2xx Etsy
 * API response. Network/transport failures (the fetch call itself
 * rejecting) are rethrown as-is, not wrapped in this type.
 */
export class EtsyApiError extends Error {
  readonly status: number;
  readonly etsyError: string;
  readonly rateLimit: RateLimitSnapshot | undefined;
  readonly operationId: string | undefined;

  constructor(options: EtsyApiErrorOptions) {
    super(
      `Etsy API error ${options.status} (${options.operationId ?? "unknown operation"}): ${options.etsyError}`,
    );
    this.name = "EtsyApiError";
    this.status = options.status;
    this.etsyError = options.etsyError;
    this.rateLimit = options.rateLimit;
    this.operationId = options.operationId;
    Object.setPrototypeOf(this, EtsyApiError.prototype);
  }
}
