import { describe, expect, it } from "vitest";
import {
  paginate,
  type PaginatedResult,
  type PaginationParams,
} from "../../src/http/pagination.js";

function makeFetchPage(items: number[]) {
  const calls: PaginationParams[] = [];
  const fetchPage = async (
    params: Required<PaginationParams>,
  ): Promise<PaginatedResult<number>> => {
    calls.push(params);
    const page = items.slice(params.offset, params.offset + params.limit);
    return { count: items.length, results: page };
  };
  return { fetchPage, calls };
}

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of iterable) out.push(item);
  return out;
}

describe("paginate", () => {
  it("yields every item across multiple pages", async () => {
    const items = Array.from({ length: 55 }, (_, i) => i);
    const { fetchPage, calls } = makeFetchPage(items);

    const result = await collect(paginate(fetchPage, { limit: 25 }));

    expect(result).toEqual(items);
    expect(calls).toEqual([
      { limit: 25, offset: 0 },
      { limit: 25, offset: 25 },
      { limit: 25, offset: 50 },
    ]);
  });

  it("stops as soon as a short page is returned, without an extra empty-page fetch", async () => {
    const items = [1, 2, 3];
    const { fetchPage, calls } = makeFetchPage(items);

    const result = await collect(paginate(fetchPage, { limit: 25 }));

    expect(result).toEqual(items);
    expect(calls).toEqual([{ limit: 25, offset: 0 }]);
  });

  it("returns nothing and makes exactly one call for an empty result set", async () => {
    const { fetchPage, calls } = makeFetchPage([]);

    const result = await collect(paginate(fetchPage));

    expect(result).toEqual([]);
    expect(calls).toHaveLength(1);
  });

  it("respects a caller-provided starting offset", async () => {
    const items = Array.from({ length: 10 }, (_, i) => i);
    const { fetchPage, calls } = makeFetchPage(items);

    const result = await collect(paginate(fetchPage, { limit: 5, offset: 5 }));

    expect(result).toEqual([5, 6, 7, 8, 9]);
    // The first page (offset 5) is exactly `limit` items long, so paginate()
    // can't yet tell it was the last page — it fetches once more and stops
    // on the empty page that follows. Expected: a full-length page never
    // shortcuts the "is this the end?" check.
    expect(calls).toEqual([
      { limit: 5, offset: 5 },
      { limit: 5, offset: 10 },
    ]);
  });

  it("defaults limit to 25 when unspecified", async () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    const { fetchPage, calls } = makeFetchPage(items);

    await collect(paginate(fetchPage));

    expect(calls[0]).toEqual({ limit: 25, offset: 0 });
  });

  it("rejects a zero limit instead of looping forever (0 < 0 never advances offset)", async () => {
    const { fetchPage, calls } = makeFetchPage([1, 2, 3]);

    await expect(collect(paginate(fetchPage, { limit: 0 }))).rejects.toThrow(RangeError);
    expect(calls).toHaveLength(0);
  });

  it("rejects a negative limit", async () => {
    const { fetchPage, calls } = makeFetchPage([1, 2, 3]);

    await expect(collect(paginate(fetchPage, { limit: -5 }))).rejects.toThrow(RangeError);
    expect(calls).toHaveLength(0);
  });

  it("rejects a non-integer limit", async () => {
    const { fetchPage, calls } = makeFetchPage([1, 2, 3]);

    await expect(collect(paginate(fetchPage, { limit: 2.5 }))).rejects.toThrow(RangeError);
    expect(calls).toHaveLength(0);
  });

  it("rejects a negative offset", async () => {
    const { fetchPage, calls } = makeFetchPage([1, 2, 3]);

    await expect(collect(paginate(fetchPage, { offset: -1 }))).rejects.toThrow(RangeError);
    expect(calls).toHaveLength(0);
  });
});
