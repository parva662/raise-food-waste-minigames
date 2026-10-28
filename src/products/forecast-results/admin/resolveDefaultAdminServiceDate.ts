export interface AdminDefaultServiceDate {
  date: string;
  /** True when the chosen date is after Helsinki today (only future data available). */
  isUpcoming: boolean;
}

/**
 * Initial Kitchen Management service date:
 * 1. Today (Europe/Helsinki ISO) when present in available dates
 * 2. Else most recent past date with data
 * 3. Else nearest future date (flagged upcoming)
 *
 * Callers must pass `todayIso` from `getOperationalDateIso` (Helsinki), never device-local.
 */
export function resolveDefaultAdminServiceDate(
  serviceDates: readonly string[],
  todayIso: string,
): AdminDefaultServiceDate | null {
  if (serviceDates.length === 0) return null;

  const sorted = [...serviceDates].sort();
  if (sorted.includes(todayIso)) {
    return { date: todayIso, isUpcoming: false };
  }

  let mostRecentPast: string | null = null;
  for (const date of sorted) {
    if (date < todayIso) mostRecentPast = date;
    else break;
  }
  if (mostRecentPast) {
    return { date: mostRecentPast, isUpcoming: false };
  }

  const nearestFuture = sorted.find((date) => date > todayIso) ?? sorted[0]!;
  return { date: nearestFuture, isUpcoming: nearestFuture > todayIso };
}
