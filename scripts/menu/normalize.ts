/**
 * Deterministic slug for menu item IDs when the workbook has no explicit ID column.
 * Lowercase ASCII, hyphen-separated, max 80 chars; preserves basic Unicode letters via NFKD strip.
 */
export function slugFromMenuItemName(name: string): string {
  const normalized = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const slug = normalized.slice(0, 80);
  return slug.length > 0 ? slug : 'item';
}

export function normalizeCellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value).replace(/\s+/g, ' ').trim();
}
