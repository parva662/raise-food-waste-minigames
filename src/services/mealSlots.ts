import { foodCatalogue } from '../data/foodCatalogue';
import { resolveMenuForDate } from './menuResolver';
import { dailyMenus, findDailyMenu } from '../data/menuSchedule';
import { menuOverrides } from '../data/menuOverrides';
import { getMenuCycleWeek } from './menuResolver';
import type { DailyMenuDefinition, MenuItem, Weekday } from '../types/menu';
import type { DailyMealSlots } from '../types/mealChoice';
import { parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CANTEEN_CONFIG } from '../config/canteen';

const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function getWeekday(lunchDate: string): Weekday | null {
  const date = parseISO(lunchDate);
  const zoned = toZonedTime(date, CANTEEN_CONFIG.timezone);
  const dayIndex = zoned.getDay();
  if (dayIndex === 0 || dayIndex === 6) return null;
  return WEEKDAYS[dayIndex - 1];
}

function resolveDailyMenuDefinition(lunchDate: string): DailyMenuDefinition | null {
  const override = menuOverrides.find((entry) => entry.lunchDate === lunchDate);
  if (override?.type === 'replace') {
    const weekday = getWeekday(lunchDate) ?? 'monday';
    return {
      id: `override-${lunchDate}`,
      week: getMenuCycleWeek(lunchDate) as 1 | 2 | 3,
      weekday,
      vegetarian: override.menu.vegetarian,
      classic: override.menu.classic,
      soups: override.menu.soups,
      desserts: override.menu.desserts,
    };
  }

  const weekday = getWeekday(lunchDate);
  if (!weekday) return null;
  const cycleWeek = getMenuCycleWeek(lunchDate);
  return findDailyMenu(cycleWeek, weekday) ?? null;
}

function catalogueItem(id: string): MenuItem | null {
  return foodCatalogue[id] ?? null;
}

function firstSlotItem(ids: string[]): MenuItem | null {
  for (const id of ids) {
    const item = catalogueItem(id);
    if (item) return item;
  }
  return null;
}

export function mealSlotsFromDailyMenu(dailyMenu: DailyMenuDefinition): DailyMealSlots | null {
  const main = firstSlotItem([dailyMenu.classic[0]]);
  const vegetarian = firstSlotItem([dailyMenu.vegetarian[0]]);
  const soup = firstSlotItem([dailyMenu.soups[0]]);
  const dessert = firstSlotItem([dailyMenu.desserts[0]]);
  if (!main || !vegetarian || !soup || !dessert) return null;
  return { main, vegetarian, soup, dessert };
}

export function resolveMealSlotsForDate(lunchDate: string): DailyMealSlots | null {
  const menu = resolveMenuForDate(lunchDate);
  if (menu.status !== 'available') return null;

  const dailyMenu = resolveDailyMenuDefinition(lunchDate);
  if (!dailyMenu) return null;
  return mealSlotsFromDailyMenu(dailyMenu);
}

/** Exported for tests — slot IDs must exist in catalogue for all 15 menus. */
export function getDailyMenuCatalogueForSlots(): DailyMenuDefinition[] {
  return dailyMenus;
}
