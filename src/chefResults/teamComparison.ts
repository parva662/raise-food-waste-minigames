import type { StaffDailyResult } from './types';

/** Documented production decision — minimum peers before showing range/position. */
export const MIN_ANONYMOUS_COMPARISON_PARTICIPANTS = 3;

export type AnonymousTeamBenchmark = {
  participantCount: number;
  overproductionMedianGrams: number;
  overproductionMinGrams: number;
  overproductionMaxGrams: number;
  shortageMedianGrams: number;
  shortageMinGrams: number;
  shortageMaxGrams: number;
  customerErrorMedian: number;
  canShowRange: boolean;
};

export type ParticipantComparisonInsight = {
  overproductionMessage: string;
  shortageMessage: string;
  customerMessage: string;
};

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

export function buildAnonymousTeamBenchmark(
  staffResults: readonly StaffDailyResult[],
): AnonymousTeamBenchmark {
  const overproduction = staffResults.map((result) => result.totalSimulatedOverproductionGrams);
  const shortage = staffResults.map((result) => result.totalSimulatedShortageGrams);
  const customerError = staffResults.map((result) => result.customerForecastAbsoluteError);

  return {
    participantCount: staffResults.length,
    overproductionMedianGrams: median(overproduction),
    overproductionMinGrams: overproduction.length > 0 ? Math.min(...overproduction) : 0,
    overproductionMaxGrams: overproduction.length > 0 ? Math.max(...overproduction) : 0,
    shortageMedianGrams: median(shortage),
    shortageMinGrams: shortage.length > 0 ? Math.min(...shortage) : 0,
    shortageMaxGrams: shortage.length > 0 ? Math.max(...shortage) : 0,
    customerErrorMedian: median(customerError),
    canShowRange: staffResults.length >= MIN_ANONYMOUS_COMPARISON_PARTICIPANTS,
  };
}

function compareToMedian(value: number, teamMedian: number, metricLabel: string): string {
  const delta = value - teamMedian;
  const tolerance = Math.max(teamMedian * 0.05, 1);
  if (Math.abs(delta) <= tolerance) {
    return `Your ${metricLabel} was close to the team median today.`;
  }
  if (delta < 0) {
    return `Your ${metricLabel} was below the team median today.`;
  }
  return `Your ${metricLabel} was above the team median today.`;
}

export function buildParticipantComparisonInsights(
  participant: StaffDailyResult,
  benchmark: AnonymousTeamBenchmark,
): ParticipantComparisonInsight {
  return {
    overproductionMessage: compareToMedian(
      participant.totalSimulatedOverproductionGrams,
      benchmark.overproductionMedianGrams,
      'simulated overproduction',
    ),
    shortageMessage: compareToMedian(
      participant.totalSimulatedShortageGrams,
      benchmark.shortageMedianGrams,
      'simulated shortage',
    ),
    customerMessage: compareToMedian(
      participant.customerForecastAbsoluteError,
      benchmark.customerErrorMedian,
      'customer forecast error',
    ),
  };
}
