import { parseISO, differenceInCalendarDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CANTEEN_CONFIG } from '../config/canteen';
import { foodCatalogue } from '../data/foodCatalogue';
import { dailyMenus, findDailyMenu, dailyMenuItemIds } from '../data/menuSchedule';
import { menuOverrides } from '../data/menuOverrides';
import type {
  DailyMenuDefinition,
  DailyMenuSections,
  MenuAvailability,
  MenuItem,
  Weekday,
} from '../types/menu';

const WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
];

function isWithinValidity(lunchDate: string): boolean {
  return (
    lunchDate >= CANTEEN_CONFIG.menuValidityStartDate &&
    lunchDate <= CANTEEN_CONFIG.menuValidityEndDate
  );
}

function getWeekday(lunchDate: string): Weekday | null {
  const date = parseISO(lunchDate);
  const zoned = toZonedTime(date, CANTEEN_CONFIG.timezone);
  const dayIndex = zoned.getDay();
  if (dayIndex === 0 || dayIndex === 6) return null;
  return WEEKDAYS[dayIndex - 1];
}

/** Returns 1-based cycle week (1, 2, or 3) for the given lunch date. */
export function getMenuCycleWeek(lunchDate: string): number {
  const cycleStart = parseISO(CANTEEN_CONFIG.menuCycleStartDate);
  const lunch = parseISO(lunchDate);
  const daysSinceStart = differenceInCalendarDays(lunch, cycleStart);
  const completeWeeks = Math.floor(daysSinceStart / 7);
  const weekIndex = ((completeWeeks % CANTEEN_CONFIG.menuCycleWeeks) + CANTEEN_CONFIG.menuCycleWeeks)
    % CANTEEN_CONFIG.menuCycleWeeks;
  return weekIndex + 1;
}

function sectionsToDailyMenu(
  sections: DailyMenuSections,
  id: string,
  week: number,
  weekday: Weekday,
): DailyMenuDefinition {
  return {
    id,
    week: week as 1 | 2 | 3,
    weekday,
    vegetarian: sections.vegetarian,
    classic: sections.classic,
    soups: sections.soups,
    desserts: sections.desserts,
  };
}

function resolveDailyMenu(lunchDate: string): DailyMenuDefinition | 'closed' | null {
  const override = menuOverrides.find((entry) => entry.lunchDate === lunchDate);
  if (override?.type === 'closed') return 'closed';
  if (override?.type === 'replace') {
    const weekday = getWeekday(lunchDate) ?? 'monday';
    return sectionsToDailyMenu(
      override.menu,
      `override-${lunchDate}`,
      getMenuCycleWeek(lunchDate) as 1 | 2 | 3,
      weekday,
    );
  }

  const weekday = getWeekday(lunchDate);
  if (!weekday) return null;

  const cycleWeek = getMenuCycleWeek(lunchDate);
  return findDailyMenu(cycleWeek, weekday) ?? null;
}

function buildMenuItems(itemIds: string[]): MenuItem[] {
  return itemIds
    .map((id) => foodCatalogue[id])
    .filter((item): item is MenuItem => item !== undefined);
}

export function resolveMenuForDate(lunchDate: string): MenuAvailability {
  if (!isWithinValidity(lunchDate)) {
    return { status: 'unavailable' };
  }

  const dailyMenu = resolveDailyMenu(lunchDate);
  if (dailyMenu === 'closed') {
    const override = menuOverrides.find(
      (entry) => entry.lunchDate === lunchDate && entry.type === 'closed',
    );
    return { status: 'closed', reason: override?.reason };
  }
  if (dailyMenu === null) {
    return { status: 'unavailable' };
  }

  return {
    status: 'available',
    items: buildMenuItems(dailyMenuItemIds(dailyMenu)),
    dailyMenuId: dailyMenu.id,
    menuCycleWeek: dailyMenu.week,
    menuVersion: CANTEEN_CONFIG.menuVersion,
  };
}

export function getOverrideReason(lunchDate: string): string | undefined {
  const override = menuOverrides.find((entry) => entry.lunchDate === lunchDate);
  return override?.reason;
}

/** Exported for tests — confirms exactly 15 complete daily menus are defined. */
export function getDailyMenuCatalogue(): DailyMenuDefinition[] {
  return dailyMenus;
}
