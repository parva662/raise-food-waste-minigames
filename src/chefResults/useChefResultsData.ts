import {
  buildFixtureDailyServiceResults,
  buildFixtureWeeklySummaries,
  getFixtureServiceDates,
} from './adapters/fixtureCalculationSource';
import type { DailyServiceResults, StaffWeeklySummary } from './types';

export function useChefResultsFixtureData(selectedDate: string): {
  serviceDates: readonly string[];
  dailyResults: DailyServiceResults | null;
  weeklySummaries: StaffWeeklySummary[];
} {
  return {
    serviceDates: getFixtureServiceDates(),
    dailyResults: buildFixtureDailyServiceResults(selectedDate),
    weeklySummaries: buildFixtureWeeklySummaries(),
  };
}

export function formatGrams(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`;
  }
  return `${Math.round(grams)} g`;
}

export function formatSignedGrams(grams: number): string {
  const prefix = grams > 0 ? '+' : '';
  return `${prefix}${formatGrams(grams)}`;
}

export function formatSignedCount(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}
