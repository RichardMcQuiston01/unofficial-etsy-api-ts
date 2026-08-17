/**
 * Shared helpers for the Commerce & Identity resource cluster
 * (src/resources/commerce). Not part of the public API — not re-exported
 * from index.ts.
 */

/**
 * Etsy models some boolean query filters as `boolean | null` in the
 * generated operation types (e.g. `was_paid`/`was_shipped` on
 * `getShopReceipts`) even though `RequestOptions.query`
 * (src/http/EtsyHttpClient.ts) has no representation for `null` — a `null`
 * filter value means "don't filter on this", the same as omitting the key
 * entirely, so both `null` and `undefined` are dropped here.
 *
 * Always returns a plain (possibly empty) object rather than `undefined` so
 * call sites can write `query: toQuery(params)` unconditionally without
 * tripping `exactOptionalPropertyTypes` on `RequestOptions.query` (assigning
 * an explicit `undefined` to an optional property that doesn't itself
 * declare `| undefined` is a type error under that flag).
 */
export function toQuery(
  params: Record<string, unknown> | undefined,
): Record<string, string | number | boolean | Array<string | number>> {
  const query: Record<string, string | number | boolean | Array<string | number>> = {};
  if (!params) return query;
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    query[key] = value as string | number | boolean | Array<string | number>;
  }
  return query;
}
