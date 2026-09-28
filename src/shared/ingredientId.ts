/**
 * v1 technical identifier derived from participant ingredient name.
 * Not intended for analytics assumptions yet.
 */
export function normalizeIngredientId(ingredientName: string): string | null {
  const trimmed = ingredientName.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '-');

  return normalized.length > 0 ? normalized : null;
}
