import { parseISO } from 'date-fns';
import {
  isWithinChefAdvanceWindowTime,
  isWithinChefGraceWindowTime,
} from './chefForecastWindow';
import { resolvePreviousOperationalDay } from './operationalServiceCalendar';
import { getOperationalDateIso } from '../utils/dates';
import type { GameBusChefForecast } from '../serviceCloseout/forecast/gameBusChefForecastTypes';

/**
 * A forecast for target service date D is eligible only when it was submitted inside one
 * of two Europe/Helsinki windows: on the previous operational service day from 08:30:00
 * through 23:59:59, or on D itself from 08:00:00 through 08:29:59.
 */
export function isChefForecastSubmissionInstantEligible(
  instant: Date,
  targetDate: string,
): boolean {
  const submissionDate = getOperationalDateIso(instant);

  if (submissionDate === targetDate) {
    return isWithinChefGraceWindowTime(instant);
  }
  if (submissionDate > targetDate || !isWithinChefAdvanceWindowTime(instant)) {
    return false;
  }

  return submissionDate === resolvePreviousOperationalDay(targetDate);
}

export function getChefForecastSubmissionInstant(forecast: GameBusChefForecast): Date | null {
  const iso = forecast.submittedAt ?? forecast.createdAt;
  if (!iso) return null;
  return parseISO(iso);
}

export function isChefForecastActivityEligible(forecast: GameBusChefForecast): boolean {
  const instant = getChefForecastSubmissionInstant(forecast);
  if (!instant) return false;
  return isChefForecastSubmissionInstantEligible(instant, forecast.targetDate);
}

export function chefForecastSubmissionSortKey(forecast: GameBusChefForecast): string {
  return forecast.submittedAt ?? forecast.createdAt ?? '';
}
