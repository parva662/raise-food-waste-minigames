import { addDays, format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { MenuConversionResult } from './types.ts';
import { MENU_RUNTIME_SCHEDULE } from './menuConfig.ts';

const TIMEZONE = 'Europe/Helsinki';

export type ContinuousRuntimeScheduleMetadata = {
  strategy: 'continuous-weekday-remap';
  runtimeStartDate: string;
  sourceMenuDayCount: number;
  runtimeMenuDayCount: number;
  runtimeEndDate: string;
  sourceWorkbookDateRange: { start: string; end: string };
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

/**
 * Remaps workbook menu days to a continuous Monday-Friday runtime schedule.
 * Source workbook dates determine ordering only; calendar gaps are not preserved.
 */
export function applyContinuousRuntimeSchedule(result: MenuConversionResult): {
  result: MenuConversionResult;
  schedule: ContinuousRuntimeScheduleMetadata;
} {
  const sorted = [...result.dailyMenus].sort(
    (left, right) => left.date.localeCompare(right.date) || left.sheetWeek - right.sheetWeek,
  );
  const runtimeStartDate = MENU_RUNTIME_SCHEDULE.runtimeStartDate;
  let currentRuntimeDate = runtimeStartDate;

  const dailyMenus = sorted.map((day, index) => {
    const mapped = {
      ...day,
      date: currentRuntimeDate,
    };
    if (index < sorted.length - 1) {
      currentRuntimeDate = nextRuntimeWeekday(currentRuntimeDate);
    }
    return mapped;
  });

  const schedule: ContinuousRuntimeScheduleMetadata = {
    strategy: 'continuous-weekday-remap',
    runtimeStartDate,
    sourceMenuDayCount: sorted.length,
    runtimeMenuDayCount: dailyMenus.length,
    runtimeEndDate: dailyMenus[dailyMenus.length - 1]?.date ?? runtimeStartDate,
    sourceWorkbookDateRange: {
      start: sorted[0]?.date ?? runtimeStartDate,
      end: sorted[sorted.length - 1]?.date ?? runtimeStartDate,
    },
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
