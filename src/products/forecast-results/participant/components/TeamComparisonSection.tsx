import {
  formatComparedWithTeam,
  formatPeerRateGramsPerCustomer,
  type AnonymousPeerBenchmark,
} from '@/products/forecast-results/calculations/teamComparison';
import { formatCustomerError } from '@/products/forecast-results/calculations/participantProgressData';
import type { StaffDailyResult } from '@/products/forecast-results/types';
import { HowCalculatedDisclosure } from '@/products/forecast-results/participant/components/HowCalculatedDisclosure';

interface TeamComparisonSectionProps {
  participant: StaffDailyResult;
  benchmark: AnonymousPeerBenchmark;
}

function customerErrorLabel(value: number): string {
  return formatCustomerError(value);
}

export function TeamComparisonSection({
  participant: _participant,
  benchmark,
}: TeamComparisonSectionProps) {
  const teamHint =
    benchmark.peerCount >= 2
      ? 'Team: anonymous median of other staff for this service · your result is not included.'
      : 'Team: one other staff result for this service · your result is not included.';

  return (
    <section
      className="kitchen-mgmt-surface participant-peer-compare"
      data-testid="team-comparison-section"
    >
      <h3 className="kitchen-mgmt-surface__title">You vs Team</h3>
      <p className="kitchen-mgmt-snapshot-hint" data-testid="peer-comparison-label">{teamHint}</p>

      {!benchmark.canCompare ? (
        <p className="chef-results-peer-insufficient" data-testid="peer-comparison-unavailable">
          Not enough other staff results for a comparison yet.
        </p>
      ) : (
        <div className="chef-results-you-vs-team" data-testid="peer-comparison-table">
          <article className="chef-results-you-vs-team__metric" data-testid="peer-row-surplus">
            <h4>Simulated surplus</h4>
            <p data-testid="peer-surplus-you">
              You: {formatPeerRateGramsPerCustomer(benchmark.participantOverproductionRateGramsPerCustomer)}
            </p>
            <p data-testid="peer-surplus-median">
              Team: {formatPeerRateGramsPerCustomer(benchmark.peerOverproductionMedianGramsPerCustomer)}
            </p>
            <p data-testid="peer-surplus-difference">
              Difference:{' '}
              {formatComparedWithTeam(
                benchmark.participantOverproductionRateGramsPerCustomer,
                benchmark.peerOverproductionMedianGramsPerCustomer,
                'g/customer',
              )}
            </p>
          </article>
          <article className="chef-results-you-vs-team__metric" data-testid="peer-row-shortage">
            <h4>Simulated shortage</h4>
            <p data-testid="peer-shortage-you">
              You: {formatPeerRateGramsPerCustomer(benchmark.participantShortageRateGramsPerCustomer)}
            </p>
            <p data-testid="peer-shortage-median">
              Team: {formatPeerRateGramsPerCustomer(benchmark.peerShortageMedianGramsPerCustomer)}
            </p>
            <p data-testid="peer-shortage-difference">
              Difference:{' '}
              {formatComparedWithTeam(
                benchmark.participantShortageRateGramsPerCustomer,
                benchmark.peerShortageMedianGramsPerCustomer,
                'g/customer',
              )}
            </p>
          </article>
          <article className="chef-results-you-vs-team__metric" data-testid="peer-row-customer-error">
            <h4>Customer forecast error</h4>
            <p data-testid="peer-customer-error-you">
              You: {customerErrorLabel(benchmark.participantCustomerError)}
            </p>
            <p data-testid="peer-customer-error-median">
              Team: {customerErrorLabel(benchmark.peerCustomerErrorMedian)}
            </p>
            <p data-testid="peer-customer-error-difference">
              Difference:{' '}
              {formatComparedWithTeam(
                benchmark.participantCustomerError,
                benchmark.peerCustomerErrorMedian,
                'customers',
              )}
            </p>
          </article>
        </div>
      )}

      <HowCalculatedDisclosure />
    </section>
  );
}
