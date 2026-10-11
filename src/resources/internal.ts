/**
 * Shared helpers for every resource cluster (src/resources/**). Not part of
 * the public API — not re-exported from index.ts.
 */

/**
 * The single query adapter used by every resource method. Etsy models some
 * query filters as `boolean | null` / `number | null` in the generated
 * operation types (e.g. `was_paid` on `getShopReceipts`, `min_created` on the
 * review endpoints). A `null` filter value means "don't filter on this", the
 * same as omitting the key entirely, so both `null` and `undefined` are
 * dropped here rather than serialized as the string "null".
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
