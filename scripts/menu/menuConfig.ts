import { differenceInCalendarDays, parseISO } from 'date-fns';

/**
 * Maps workbook calendar dates to runtime lunch dates.
 * Offset = runtimeStartDate − workbookStartDate (calendar days).
 */
export const MENU_DATE_SHIFT = {
  /** First lunch day in the source Excel conversion (Monday). */
  workbookStartDate: '2026-02-02',
  /** First lunch day served by the React app (Monday). */
  runtimeStartDate: '2026-07-27',
} as const;

export function menuDateOffsetDays(): number {
  return differenceInCalendarDays(
    parseISO(MENU_DATE_SHIFT.runtimeStartDate),
    parseISO(MENU_DATE_SHIFT.workbookStartDate),
  );
}
