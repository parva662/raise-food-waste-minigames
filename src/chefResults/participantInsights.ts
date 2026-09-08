import {
  buildPeerCustomerComparisonDetail,
  buildPeerCustomerComparisonMessage,
} from './forecastInterpretation';
import type { AnonymousPeerBenchmark, ParticipantPeerComparisonInsight } from './teamComparison';

const RATE_TOLERANCE_GRAMS_PER_CUSTOMER = 0.1;

export function buildPeerKeyInsights(
  benchmark: AnonymousPeerBenchmark,
  insights: ParticipantPeerComparisonInsight,
): string[] {
  if (!benchmark.canCompare) return [];

  const messages: string[] = [];

  if (insights.overproductionMessage) {
    messages.push(insights.overproductionMessage);
  }

  if (
    benchmark.peerShortageMedianGramsPerCustomer !== null &&
    benchmark.participantShortageRateGramsPerCustomer !== null &&
    benchmark.peerShortageMedianGramsPerCustomer >
      benchmark.participantShortageRateGramsPerCustomer + RATE_TOLERANCE_GRAMS_PER_CUSTOMER
  ) {
    messages.push('Other staff had substantially more estimated shortage.');
  } else if (insights.shortageMessage) {
    messages.push(insights.shortageMessage);
  }

  const customerMessage = buildPeerCustomerComparisonMessage(
    benchmark.participantCustomerError,
    benchmark.peerCustomerErrorMedian,
  );
  messages.push(customerMessage);

  const detail = buildPeerCustomerComparisonDetail(
    benchmark.participantCustomerError,
    benchmark.peerCustomerErrorMedian,
  );
  if (detail) {
    messages.push(detail);
  }

  return messages.slice(0, 3);
}
