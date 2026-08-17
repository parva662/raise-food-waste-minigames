import type { GameBusChefForecast } from './gameBusChefForecastTypes';

function submissionSortKey(forecast: GameBusChefForecast): string {
  return forecast.submittedAt ?? forecast.createdAt ?? '';
}

/**
 * When the same actor has duplicate forecasts for one targetDate, keep the latest
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
      submissionSortKey(forecast).localeCompare(submissionSortKey(existing)) > 0
    ) {
      byActor.set(forecast.actorId, forecast);
    }
  }
  return [...byActor.values()];
}

/** All exact-date staff forecasts, one per actor, sorted by actor name. */
export function selectForecastsForDate(
  forecasts: readonly GameBusChefForecast[],
  closeoutDate: string,
): GameBusChefForecast[] {
  const matching = forecasts.filter((forecast) => forecast.targetDate === closeoutDate);
  return dedupeForecastsByActor(matching).sort((left, right) =>
    left.actorName.localeCompare(right.actorName),
  );
}

/** @deprecated Prefer {@link selectForecastsForDate} for multi-staff closeout display. */
export function selectLatestForecastForDate(
  forecasts: readonly GameBusChefForecast[],
  closeoutDate: string,
): GameBusChefForecast | null {
  const selected = selectForecastsForDate(forecasts, closeoutDate);
  return selected[0] ?? null;
}
