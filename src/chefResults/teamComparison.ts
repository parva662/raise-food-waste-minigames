import type { StaffDailyResult } from './types';

/**
 * Minimum OTHER participating staff (excluding the authenticated user) before
 * showing anonymous peer median comparison.
 */
export const MIN_ANONYMOUS_PEER_COUNT = 3;

/** @deprecated Use MIN_ANONYMOUS_PEER_COUNT — kept for existing imports during transition. */
export const MIN_ANONYMOUS_COMPARISON_PARTICIPANTS = MIN_ANONYMOUS_PEER_COUNT;

export type AnonymousPeerBenchmark = {
  peerCount: number;
  canCompare: boolean;
  participantOverproductionRateGramsPerCustomer: number | null;
  peerOverproductionMedianGramsPerCustomer: number | null;
  participantShortageRateGramsPerCustomer: number | null;
  peerShortageMedianGramsPerCustomer: number | null;
  participantCustomerError: number;
  peerCustomerErrorMedian: number;
};

export type ParticipantPeerComparisonInsight = {
  overproductionMessage: string | null;
  shortageMessage: string | null;
  customerMessage: string | null;
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

export function surplusRateGramsPerCustomer(result: StaffDailyResult): number | null {
  if (result.actualCustomers <= 0) return null;
  return result.totalSimulatedOverproductionGrams / result.actualCustomers;
}

export function shortageRateGramsPerCustomer(result: StaffDailyResult): number | null {
  if (result.actualCustomers <= 0) return null;
  return result.totalSimulatedShortageGrams / result.actualCustomers;
}

export function buildAnonymousPeerBenchmark(
  staffResults: readonly StaffDailyResult[],
  participantUserId: string,
): AnonymousPeerBenchmark {
  const participant = staffResults.find((result) => result.userId === participantUserId);
  const peers = staffResults.filter((result) => result.userId !== participantUserId);

  const peerOverRates = peers
    .map(surplusRateGramsPerCustomer)
    .filter((value): value is number => value !== null);
  const peerShortRates = peers
    .map(shortageRateGramsPerCustomer)
    .filter((value): value is number => value !== null);
  const peerCustomerErrors = peers.map((result) => result.customerForecastAbsoluteError);

  return {
    peerCount: peers.length,
    canCompare: peers.length >= MIN_ANONYMOUS_PEER_COUNT,
    participantOverproductionRateGramsPerCustomer: participant
      ? surplusRateGramsPerCustomer(participant)
      : null,
    peerOverproductionMedianGramsPerCustomer:
      peerOverRates.length > 0 ? median(peerOverRates) : null,
    participantShortageRateGramsPerCustomer: participant
      ? shortageRateGramsPerCustomer(participant)
      : null,
    peerShortageMedianGramsPerCustomer:
      peerShortRates.length > 0 ? median(peerShortRates) : null,
    participantCustomerError: participant?.customerForecastAbsoluteError ?? 0,
    peerCustomerErrorMedian: peerCustomerErrors.length > 0 ? median(peerCustomerErrors) : 0,
  };
}

function formatRate(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(1)} g/customer`;
}

function compareRatesMessage(
  participantRate: number | null,
  peerMedian: number | null,
  metricLabel: string,
): string | null {
  if (participantRate === null || peerMedian === null) return null;
  const delta = participantRate - peerMedian;
  const tolerance = Math.max(peerMedian * 0.05, 0.1);
  if (Math.abs(delta) <= tolerance) {
    return `Your ${metricLabel} was close to the other-staff median.`;
  }
  if (delta < 0) {
    return `Your ${metricLabel} was ${Math.abs(delta).toFixed(1)} g/customer below the other-staff median.`;
  }
  return `Your ${metricLabel} was ${delta.toFixed(1)} g/customer above the other-staff median.`;
}

export function buildParticipantPeerComparisonInsights(
  _participant: StaffDailyResult,
  benchmark: AnonymousPeerBenchmark,
): ParticipantPeerComparisonInsight {
  if (!benchmark.canCompare) {
    return {
      overproductionMessage: null,
      shortageMessage: null,
      customerMessage: null,
    };
  }

  const overproductionMessage = compareRatesMessage(
    benchmark.participantOverproductionRateGramsPerCustomer,
    benchmark.peerOverproductionMedianGramsPerCustomer,
    'estimated surplus',
  );

  let shortageMessage: string | null = null;
  if (
    benchmark.participantShortageRateGramsPerCustomer !== null &&
    benchmark.peerShortageMedianGramsPerCustomer !== null
  ) {
    const delta =
      benchmark.participantShortageRateGramsPerCustomer -
      benchmark.peerShortageMedianGramsPerCustomer;
    if (Math.abs(delta) <= 0.1) {
      shortageMessage = 'Estimated shortage was close to the other-staff median.';
    } else if (delta < 0) {
      shortageMessage = `Estimated shortage was ${Math.abs(delta).toFixed(1)} g/customer below the other-staff median.`;
    } else {
      shortageMessage = `Estimated shortage was ${delta.toFixed(1)} g/customer above the other-staff median.`;
    }
  }

  const customerDelta =
    benchmark.participantCustomerError - benchmark.peerCustomerErrorMedian;
  let customerMessage: string | null = null;
  if (Math.abs(customerDelta) <= 1) {
    customerMessage = 'Your customer forecast error was close to the other-staff median.';
  } else if (customerDelta < 0) {
    customerMessage = `Your customer forecast error was ${Math.abs(customerDelta).toFixed(1)} customers below the other-staff median.`;
  } else {
    customerMessage = `Your customer forecast error was ${customerDelta.toFixed(1)} customers above the other-staff median.`;
  }

  return {
    overproductionMessage,
    shortageMessage,
    customerMessage,
  };
}

export { formatRate as formatPeerRateGramsPerCustomer };
