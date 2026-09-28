/**
 * Read canonical GameBus template/property identifiers (`slug`).
 * GameBus renamed object field `reference` → `slug` platform-wide.
 */

export function readGameBusSlug(record: unknown): string | undefined {
  if (typeof record !== 'object' || record === null) return undefined;
  const slug = (record as { slug?: unknown }).slug;
  return typeof slug === 'string' && slug.length > 0 ? slug : undefined;
}

/** Linked-property entries may expose the property slug as `slug` or legacy `ref`. */
export function readGameBusLinkedPropertySlug(item: unknown): string | undefined {
  if (typeof item !== 'object' || item === null) return undefined;
  const record = item as { slug?: unknown; ref?: unknown };
  const slug = record.slug;
  if (typeof slug === 'string' && slug.length > 0) return slug;
  const ref = record.ref;
  return typeof ref === 'string' && ref.length > 0 ? ref : undefined;
}
