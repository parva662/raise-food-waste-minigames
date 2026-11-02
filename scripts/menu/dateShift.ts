import { addDays, format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { MenuConversionResult, DailyMenuRecord } from './types.ts';
import { MENU_RUNTIME_SCHEDULE } from './menuConfig.ts';
import { menuOverrides } from '../../src/shared/menu/menuOverrides.ts';

const TIMEZONE = 'Europe/Helsinki';

export type ContinuousRuntimeScheduleMetadata = {
  strategy: 'continuous-weekday-remap-with-cycle-extension';
  runtimeStartDate: string;
  sourceMenuDayCount: number;
  runtimeMenuDayCount: number;
  runtimeEndDate: string;
  sourceWorkbookDateRange: { start: string; end: string };
  /** Last date produced by the 1:1 continuous remap (preserved historical block). */
  preservedThroughDate: string;
  /** First weekday of the cycle-extension period. */
  extensionStartDate: string;
  /** Configured inclusive end of sample coverage. */
  extensionEndDate: string;
  /** Number of weekday menus added by cycling after the preserved block. */
  extensionDayCount: number;
  /** Number of open source days used as the cycle template. */
  cycleTemplateDayCount: number;
};

function isWeekend(isoDate: string): boolean {
  const zoned = toZonedTime(parseISO(isoDate), TIMEZONE);
  const dayIndex = zoned.getDay();
  return dayIndex === 0 || dayIndex === 6;
}

export function nextRuntimeWeekday(isoDate: string): string {
  let candidate = addDays(parseISO(isoDate), 1);
  while (isWeekend(format(candidate, 'yyyy-MM-dd'))) {
    candidate = addDays(candidate, 1);
  }
  return format(candidate, 'yyyy-MM-dd');
}

export function listRuntimeWeekdaysBetween(startIso: string, endIso: string): string[] {
  const dates: string[] = [];
  let current = startIso;

  while (current <= endIso) {
    if (!isWeekend(current)) {
      dates.push(current);
    }
    current = format(addDays(parseISO(current), 1), 'yyyy-MM-dd');
  }

  return dates;
}

function explicitClosureDates(): Set<string> {
  return new Set(
    menuOverrides.filter((entry) => entry.type === 'closed').map((entry) => entry.lunchDate),
  );
}

function cloneDailyMenu(day: DailyMenuRecord, date: string): DailyMenuRecord {
  return {
    ...day,
    date,
    closed: day.closed,
    slots: day.slots.map((slot) => ({ ...slot })),
  };
}

/**
 * Remaps workbook menu days to a continuous Monday-Friday runtime schedule, then
 * extends through {@link MENU_RUNTIME_SCHEDULE.runtimeEndDate} by cycling open source days.
 * Source workbook dates determine ordering only; calendar gaps are not preserved in the
 * historical 1:1 block. Explicit canteen closure overrides are skipped in the extension.
 */
export function applyContinuousRuntimeSchedule(result: MenuConversionResult): {
  result: MenuConversionResult;
  schedule: ContinuousRuntimeScheduleMetadata;
} {
  const sorted = [...result.dailyMenus].sort(
    (left, right) => left.date.localeCompare(right.date) || left.sheetWeek - right.sheetWeek,
  );
  const runtimeStartDate = MENU_RUNTIME_SCHEDULE.runtimeStartDate;
  const extensionEndDate = MENU_RUNTIME_SCHEDULE.runtimeEndDate;
  const extensionStartDate = MENU_RUNTIME_SCHEDULE.extensionStartDate;
  let currentRuntimeDate = runtimeStartDate;

  const preservedMenus = sorted.map((day, index) => {
    const mapped = cloneDailyMenu(day, currentRuntimeDate);
    if (index < sorted.length - 1) {
      currentRuntimeDate = nextRuntimeWeekday(currentRuntimeDate);
    }
    return mapped;
  });

  const preservedThroughDate =
    preservedMenus[preservedMenus.length - 1]?.date ?? runtimeStartDate;

  const openTemplates = sorted.filter((day) => !day.closed);
  const cycleTemplates = openTemplates.length > 0 ? openTemplates : sorted;
  const closedDates = explicitClosureDates();
  const preservedDates = new Set(preservedMenus.map((day) => day.date));

  const extensionDates = listRuntimeWeekdaysBetween(extensionStartDate, extensionEndDate).filter(
    (date) => !preservedDates.has(date) && !closedDates.has(date),
  );

  const extensionMenus = extensionDates.map((date, index) => {
    const template = cycleTemplates[index % cycleTemplates.length]!;
    return cloneDailyMenu({ ...template, closed: false }, date);
  });

  const dailyMenus = [...preservedMenus, ...extensionMenus];

  const schedule: ContinuousRuntimeScheduleMetadata = {
    strategy: 'continuous-weekday-remap-with-cycle-extension',
    runtimeStartDate,
    sourceMenuDayCount: sorted.length,
    runtimeMenuDayCount: dailyMenus.length,
    runtimeEndDate: dailyMenus[dailyMenus.length - 1]?.date ?? extensionEndDate,
    sourceWorkbookDateRange: {
      start: sorted[0]?.date ?? runtimeStartDate,
      end: sorted[sorted.length - 1]?.date ?? runtimeStartDate,
    },
    preservedThroughDate,
    extensionStartDate,
    extensionEndDate,
    extensionDayCount: extensionMenus.length,
    cycleTemplateDayCount: cycleTemplates.length,
  };

  return {
    result: {
      ...result,
      dailyMenus,
    },
    schedule,
  };
}

/** @deprecated Use {@link applyContinuousRuntimeSchedule}. */
export const applyRuntimeDateShift = applyContinuousRuntimeSchedule;
