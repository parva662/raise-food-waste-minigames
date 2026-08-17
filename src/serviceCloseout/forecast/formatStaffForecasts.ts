import type { CloseoutCategoryKey } from '../types';
import type { GameBusChefForecast } from './gameBusChefForecastTypes';
import { forecastCategoryQuantity } from './parseGameBusChefForecast';

export type StaffForecastEntry = {
  actorName: string;
  quantity: number | null;
};

export function buildStaffForecastEntries(
  forecasts: readonly GameBusChefForecast[],
  categoryKey: CloseoutCategoryKey,
): StaffForecastEntry[] {
  return forecasts.map((forecast) => ({
    actorName: forecast.actorName,
    quantity: forecastCategoryQuantity(forecast, categoryKey),
  }));
}

export function formatStaffForecastCell(entries: readonly StaffForecastEntry[]): string {
  if (entries.length === 0) return '—';
  return entries
    .map((entry) => {
      const quantity =
        entry.quantity === null || entry.quantity === undefined ? '—' : String(entry.quantity);
      return `${entry.actorName} — ${quantity}`;
    })
    .join('\n');
}
