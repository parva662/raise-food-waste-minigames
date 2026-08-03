import { addDays, format, parseISO } from 'date-fns';
import type { MenuConversionResult } from './types.ts';
import { MENU_DATE_SHIFT, menuDateOffsetDays } from './menuConfig.ts';

export type DateShiftMetadata = {
  workbookStartDate: string;
  runtimeStartDate: string;
  dateOffsetDays: number;
  workbookDateRange: { start: string; end: string };
  runtimeDateRange: { start: string; end: string };
  runtimeEndDate: string;
};

export function shiftIsoDate(isoDate: string, offsetDays: number): string {
  return format(addDays(parseISO(isoDate), offsetDays), 'yyyy-MM-dd');
}

export function applyRuntimeDateShift(result: MenuConversionResult): {
  result: MenuConversionResult;
  shift: DateShiftMetadata;
} {
  const offsetDays = menuDateOffsetDays();
  const sortedWorkbookDates = [...result.dailyMenus].map((day) => day.date).sort();
  const workbookDateRange = {
    start: sortedWorkbookDates[0] ?? MENU_DATE_SHIFT.workbookStartDate,
    end: sortedWorkbookDates[sortedWorkbookDates.length - 1] ?? MENU_DATE_SHIFT.workbookStartDate,
  };

  const dailyMenus = result.dailyMenus
    .map((day) => ({
      ...day,
      date: shiftIsoDate(day.date, offsetDays),
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.sheetWeek - b.sheetWeek);

  const runtimeDateRange = {
    start: shiftIsoDate(workbookDateRange.start, offsetDays),
    end: shiftIsoDate(workbookDateRange.end, offsetDays),
  };

  const shift: DateShiftMetadata = {
    workbookStartDate: MENU_DATE_SHIFT.workbookStartDate,
    runtimeStartDate: MENU_DATE_SHIFT.runtimeStartDate,
    dateOffsetDays: offsetDays,
    workbookDateRange,
    runtimeDateRange,
    runtimeEndDate: runtimeDateRange.end,
  };

  return {
    result: {
      ...result,
      dailyMenus,
    },
    shift,
  };
}
