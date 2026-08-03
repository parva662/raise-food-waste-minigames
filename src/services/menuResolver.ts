import { foodCatalogue, getGeneratedDailyMenu, getGeneratedMenuMeta } from '../data/generatedMenuData';
import { menuOverrides } from '../data/menuOverrides';
import type {
  DailyMenuSections,
  MenuAvailability,
  MenuItem,
  Weekday,
} from '../types/menu';
import { parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CANTEEN_CONFIG } from '../config/canteen';

const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const SLOT_TO_CATEGORY = {
  main: 'classic',
  vegetarian: 'vegetarian',
  soup: 'soup',
  dessert: 'dessert',
} as const;

function getWeekday(lunchDate: string): Weekday | null {
  const date = parseISO(lunchDate);
  const zoned = toZonedTime(date, CANTEEN_CONFIG.timezone);
  const dayIndex = zoned.getDay();
  if (dayIndex === 0 || dayIndex === 6) return null;
  return WEEKDAYS[dayIndex - 1];
}

function isWeekday(lunchDate: string): boolean {
  return getWeekday(lunchDate) !== null;
}

function isWithinGeneratedRange(lunchDate: string): boolean {
  const { start, end } = getGeneratedMenuMeta().dateRange;
  return lunchDate >= start && lunchDate <= end;
}

function catalogueItem(id: string): MenuItem | undefined {
  return foodCatalogue[id];
}

function firstCatalogueItem(ids: string[]): MenuItem | undefined {
  for (const id of ids) {
    const item = catalogueItem(id);
    if (item) return item;
  }
  return undefined;
}

function mealItemsFromSections(sections: DailyMenuSections): MenuItem[] | null {
  const main = firstCatalogueItem([sections.classic[0]]);
  const vegetarian = firstCatalogueItem([sections.vegetarian[0]]);
  const soup = firstCatalogueItem([sections.soups[0]]);
  const dessert = firstCatalogueItem([sections.desserts[0]]);
  if (!main || !vegetarian || !soup || !dessert) return null;
  return [main, vegetarian, soup, dessert];
}

function mealItemsFromGeneratedDate(lunchDate: string): MenuItem[] | null {
  const day = getGeneratedDailyMenu(lunchDate);
  if (!day || day.closed) return null;

  const items: MenuItem[] = [];
  for (const slot of day.slots) {
    if (slot.closed) return null;
    const item = catalogueItem(slot.itemId);
    if (!item) return null;
    const expectedCategory = SLOT_TO_CATEGORY[slot.slot];
    if (item.category !== expectedCategory) return null;
    items.push(item);
  }
  if (items.length !== 4) return null;
  return items;
}

/** Workbook sheet week for a lunch date (0 when unknown). */
export function getMenuCycleWeek(lunchDate: string): number {
  return getGeneratedDailyMenu(lunchDate)?.sheetWeek ?? 0;
}

/** Returns catalogue IDs that are missing from the generated food catalogue. */
export function findMissingCatalogueIds(itemIds: string[]): string[] {
  return itemIds.filter((id) => foodCatalogue[id] === undefined);
}

export function resolveMenuForDate(lunchDate: string): MenuAvailability {
  if (!isWeekday(lunchDate)) {
    return { status: 'unavailable' };
  }

  const override = menuOverrides.find((entry) => entry.lunchDate === lunchDate);
  if (override?.type === 'closed') {
    return { status: 'closed', reason: override.reason };
  }

  if (override?.type === 'replace') {
    const items = mealItemsFromSections(override.menu);
    if (!items) {
      return { status: 'unavailable' };
    }
    const sheetWeek = getMenuCycleWeek(lunchDate);
    return {
      status: 'available',
      items,
      dailyMenuId: `override-${lunchDate}`,
      menuCycleWeek: sheetWeek,
      sheetWeek: sheetWeek || undefined,
      menuVersion: getGeneratedMenuMeta().menuVersion,
    };
  }

  if (!isWithinGeneratedRange(lunchDate)) {
    return { status: 'unavailable' };
  }

  const day = getGeneratedDailyMenu(lunchDate);
  if (!day) {
    return { status: 'unavailable' };
  }

  if (day.closed) {
    return { status: 'closed', reason: 'Canteen closed' };
  }

  const items = mealItemsFromGeneratedDate(lunchDate);
  if (!items) {
    return { status: 'unavailable' };
  }

  return {
    status: 'available',
    items,
    dailyMenuId: `dated-${lunchDate}`,
    menuCycleWeek: day.sheetWeek,
    sheetWeek: day.sheetWeek,
    menuVersion: getGeneratedMenuMeta().menuVersion,
  };
}

export function getOverrideReason(lunchDate: string): string | undefined {
  const override = menuOverrides.find((entry) => entry.lunchDate === lunchDate);
  return override?.reason;
}

export function getGeneratedMenuDateRange(): { start: string; end: string } {
  return getGeneratedMenuMeta().dateRange;
}
