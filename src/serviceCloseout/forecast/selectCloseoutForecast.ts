import {
  chefForecastSubmissionSortKey,
  isChefForecastActivityEligible,
} from '../../services/chefForecastEligibilityPolicy';
import type { GameBusChefForecast } from './gameBusChefForecastTypes';

/**
 * When the same actor has duplicate eligible forecasts for one targetDate, keep the latest
 * submission (submittedAt preferred, else createdAt).
 */
function dedupeForecastsByActor(
  forecasts: readonly GameBusChefForecast[],
): GameBusChefForecast[] {
  const byActor = new Map<string, GameBusChefForecast>();
  for (const forecast of forecasts) {
    const existing = byActor.get(forecast.actorId);
    if (
      !existing ||
      chefForecastSubmissionSortKey(forecast).localeCompare(
        chefForecastSubmissionSortKey(existing),
      ) > 0
    ) {
      byActor.set(forecast.actorId, forecast);
    }
  }
  return [...byActor.values()];
}

/** All exact-date staff forecasts submitted before cutoff, one per actor, sorted by actor name. */
export function selectForecastsForDate(
  forecasts: readonly GameBusChefForecast[],
  closeoutDate: string,
): GameBusChefForecast[] {
  const matching = forecasts.filter(
    (forecast) =>
      forecast.targetDate === closeoutDate && isChefForecastActivityEligible(forecast),
  );
  return dedupeForecastsByActor(matching).sort((left, right) =>
    left.actorName.localeCompare(right.actorName),
  );
}

/** Latest eligible exact-date forecast for one authenticated kitchen staff member. */
export function selectCurrentUserForecastForDate(
  forecasts: readonly GameBusChefForecast[],
  closeoutDate: string,
  authenticatedUserId: string,
): GameBusChefForecast | null {
  const matching = forecasts.filter(
    (forecast) =>
      forecast.targetDate === closeoutDate &&
      forecast.actorId === authenticatedUserId &&
      isChefForecastActivityEligible(forecast),
  );
  if (matching.length === 0) return null;
  if (matching.length === 1) return matching[0]!;

  return [...matching].sort((left, right) =>
    chefForecastSubmissionSortKey(left).localeCompare(chefForecastSubmissionSortKey(right)),
  )[matching.length - 1]!;
}

/** @deprecated Prefer {@link selectForecastsForDate} for multi-staff closeout display. */
export function selectLatestForecastForDate(
  forecasts: readonly GameBusChefForecast[],
  closeoutDate: string,
): GameBusChefForecast | null {
  const selected = selectForecastsForDate(forecasts, closeoutDate);
  return selected[0] ?? null;
}
