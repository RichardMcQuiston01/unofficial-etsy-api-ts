import { describe, expect, it } from "vitest";
import { EtsyApiError } from "../../src/http/EtsyApiError.js";

describe("EtsyApiError", () => {
  it("sets status/etsyError/rateLimit/operationId and includes them in the message", () => {
    const error = new EtsyApiError({
      status: 404,
      etsyError: "Listing not found.",
      operationId: "getListing",
      rateLimit: { limitPerDay: 5000, remainingToday: 4999 },
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("EtsyApiError");
    expect(error.status).toBe(404);
    expect(error.etsyError).toBe("Listing not found.");
    expect(error.operationId).toBe("getListing");
    expect(error.rateLimit).toEqual({ limitPerDay: 5000, remainingToday: 4999 });
    expect(error.message).toBe("Etsy API error 404 (getListing): Listing not found.");
  });

  it("falls back to 'unknown operation' in the message when operationId is omitted", () => {
    const error = new EtsyApiError({ status: 500, etsyError: "Internal error." });

    expect(error.operationId).toBeUndefined();
    expect(error.rateLimit).toBeUndefined();
    expect(error.message).toBe("Etsy API error 500 (unknown operation): Internal error.");
  });
});
