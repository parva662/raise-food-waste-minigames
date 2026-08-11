import type { StaffDailyResult, StaffWeeklySummary } from './types';

export function aggregateWeeklyResults(
  dailyResults: readonly StaffDailyResult[],
): StaffWeeklySummary[] {
  const byUser = new Map<
    string,
    {
      userName: string;
      participatedServiceCount: number;
      totalSimulatedOverproductionGrams: number;
      totalSimulatedShortageGrams: number;
      customerAbsoluteErrorSum: number;
    }
  >();

  for (const day of dailyResults) {
    const existing = byUser.get(day.userId);
    if (existing) {
      existing.participatedServiceCount += 1;
      existing.totalSimulatedOverproductionGrams += day.totalSimulatedOverproductionGrams;
      existing.totalSimulatedShortageGrams += day.totalSimulatedShortageGrams;
      existing.customerAbsoluteErrorSum += day.customerForecastAbsoluteError;
    } else {
      byUser.set(day.userId, {
        userName: day.userName,
        participatedServiceCount: 1,
        totalSimulatedOverproductionGrams: day.totalSimulatedOverproductionGrams,
        totalSimulatedShortageGrams: day.totalSimulatedShortageGrams,
        customerAbsoluteErrorSum: day.customerForecastAbsoluteError,
      });
    }
  }

  return [...byUser.entries()]
    .map(([userId, totals]) => ({
      userId,
      userName: totals.userName,
      participatedServiceCount: totals.participatedServiceCount,
      totalSimulatedOverproductionGrams: totals.totalSimulatedOverproductionGrams,
      totalSimulatedShortageGrams: totals.totalSimulatedShortageGrams,
      meanAbsoluteCustomerForecastError:
        totals.customerAbsoluteErrorSum / totals.participatedServiceCount,
    }))
    .sort((a, b) => a.userName.localeCompare(b.userName));
}
