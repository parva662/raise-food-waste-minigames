import { buildAllFixtureDailyServiceResults } from '@/products/forecast-results/adapters/fixtureCalculationSource';
import type { DailyServiceResults, StaffDailyResult } from '@/products/forecast-results/types';

export function findParticipantDailyResult(
  userId: string,
  serviceDate: string,
  dailyResults?: DailyServiceResults | null,
): StaffDailyResult | null {
  if (dailyResults !== undefined) {
    return dailyResults?.staffResults.find((result) => result.userId === userId) ?? null;
  }

  const day = buildAllFixtureDailyServiceResults().find((entry) => entry.serviceDate === serviceDate);
  return day?.staffResults.find((result) => result.userId === userId) ?? null;
}
