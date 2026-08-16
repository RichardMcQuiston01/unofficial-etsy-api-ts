export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  count: number;
  results: T[];
}

/** Page size used when the caller doesn't specify one. paginate() always
 *  passes an explicit limit to fetchPage, so this is the only place a
 *  default page size needs to live. */
const DEFAULT_PAGE_SIZE = 25;

/**
 * Wraps any limit/offset list endpoint into an async iterator over
 * individual items, advancing offset by the page size until a short page
 * (fewer results than requested) signals the end.
 *
 * `fetchPage` only ever receives { limit, offset } — close over any other
 * filter/query arguments (e.g. shop_id, state) in the caller's closure.
 */
export async function* paginate<T>(
  fetchPage: (params: Required<PaginationParams>) => Promise<PaginatedResult<T>>,
  start: PaginationParams = {},
): AsyncGenerator<T, void, undefined> {
  const limit = start.limit ?? DEFAULT_PAGE_SIZE;
  let offset = start.offset ?? 0;

  // A limit <= 0 can never satisfy `results.length < limit`, so the loop
  // below would never terminate — reject it up front instead of hanging.
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new RangeError(`paginate(): limit must be a positive integer, got ${limit}`);
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new RangeError(`paginate(): offset must be a non-negative integer, got ${offset}`);
  }

  for (;;) {
    const page = await fetchPage({ limit, offset });
    for (const item of page.results) {
      yield item;
    }
    if (page.results.length < limit) {
      return;
    }
    offset += page.results.length;
  }
}
