/** Normalized header labels expected on each menu sheet (row 1). */
export const MENU_HEADER_LABELS = ['MENU ITEMS', 'QUANTITY', 'DATE'] as const;

export const MENU_SLOT_ORDER = ['main', 'vegetarian', 'soup', 'dessert'] as const;
export type MenuSlot = (typeof MENU_SLOT_ORDER)[number];

export const SLOT_TO_CATEGORY: Record<
  MenuSlot,
  'classic' | 'vegetarian' | 'soup' | 'dessert'
> = {
  main: 'classic',
  vegetarian: 'vegetarian',
  soup: 'soup',
  dessert: 'dessert',
};

export const DEFAULT_MAX_QUANTITY: Record<MenuSlot, number> = {
  main: 6,
  vegetarian: 3,
  soup: 2,
  dessert: 2,
};

export const DEFAULT_UNIT: Record<MenuSlot, string> = {
  main: 'pieces',
  vegetarian: 'portion',
  soup: 'cups',
  dessert: 'pieces',
};

export const SHEET_WEEK_PATTERN = /^Week\s+(\d+)$/i;

export const CLOSED_ITEM_NAME = 'CLOSED';
