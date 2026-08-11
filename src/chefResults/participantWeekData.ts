import { buildAllFixtureDailyServiceResults } from './adapters/fixtureCalculationSource';
import type { StaffDailyResult } from './types';

export type ParticipantWeekPoint = {
  serviceDate: string;
  totalSimulatedOverproductionGrams: number;
  totalSimulatedShortageGrams: number;
  customerForecastAbsoluteError: number;
};

export type ParticipantWeekSummary = {
  participatedServiceCount: number;
  totalSimulatedOverproductionGrams: number;
  totalSimulatedShortageGrams: number;
  meanAbsoluteCustomerForecastError: number;
  points: readonly ParticipantWeekPoint[];
};

export function buildParticipantWeekSummary(userId: string): ParticipantWeekSummary {
  const points: ParticipantWeekPoint[] = [];

  for (const day of buildAllFixtureDailyServiceResults()) {
    const own = day.staffResults.find((result) => result.userId === userId);
    if (!own) continue;
    points.push({
      serviceDate: day.serviceDate,
      totalSimulatedOverproductionGrams: own.totalSimulatedOverproductionGrams,
      totalSimulatedShortageGrams: own.totalSimulatedShortageGrams,
      customerForecastAbsoluteError: own.customerForecastAbsoluteError,
    });
  }

  points.sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));

  const participatedServiceCount = points.length;
  const totalSimulatedOverproductionGrams = points.reduce(
    (sum, point) => sum + point.totalSimulatedOverproductionGrams,
    0,
  );
  const totalSimulatedShortageGrams = points.reduce(
    (sum, point) => sum + point.totalSimulatedShortageGrams,
    0,
  );
  const meanAbsoluteCustomerForecastError =
    participatedServiceCount === 0
      ? 0
      : points.reduce((sum, point) => sum + point.customerForecastAbsoluteError, 0) /
        participatedServiceCount;

  return {
    participatedServiceCount,
    totalSimulatedOverproductionGrams,
    totalSimulatedShortageGrams,
    meanAbsoluteCustomerForecastError,
    points,
  };
}

export function findParticipantDailyResult(
  userId: string,
  serviceDate: string,
): StaffDailyResult | null {
  const day = buildAllFixtureDailyServiceResults().find((entry) => entry.serviceDate === serviceDate);
  return day?.staffResults.find((result) => result.userId === userId) ?? null;
}
