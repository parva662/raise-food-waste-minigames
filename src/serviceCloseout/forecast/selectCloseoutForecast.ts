import type { GameBusChefForecast } from './gameBusChefForecastTypes';

function submissionSortKey(forecast: GameBusChefForecast): string {
  return forecast.submittedAt ?? forecast.createdAt ?? '';
}

/**
 * TEMPORARY TESTING RULE: when multiple valid chefForecast activities share the same
 * targetDate, select the latest submission (submittedAt preferred, else createdAt).
 * Duplicate prevention will be enforced before production.
 */
export function selectLatestForecastForDate(
  forecasts: readonly GameBusChefForecast[],
  closeoutDate: string,
): GameBusChefForecast | null {
  const matching = forecasts.filter((forecast) => forecast.targetDate === closeoutDate);
  if (matching.length === 0) return null;
  if (matching.length === 1) return matching[0]!;

  return [...matching].sort((left, right) =>
    submissionSortKey(left).localeCompare(submissionSortKey(right)),
  )[matching.length - 1]!;
}
