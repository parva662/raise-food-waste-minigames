import type { AnonymousPeerBenchmark, ParticipantPeerComparisonInsight } from '../../teamComparison';
import { formatPeerRateGramsPerCustomer } from '../../teamComparison';
import type { StaffDailyResult } from '../../types';
import { buildPeerKeyInsights } from '../../participantInsights';
import { HowCalculatedDisclosure } from './HowCalculatedDisclosure';

interface TeamComparisonSectionProps {
  participant: StaffDailyResult;
  benchmark: AnonymousPeerBenchmark;
  insights: ParticipantPeerComparisonInsight;
}

function formatCustomerError(value: number): string {
  return `${value.toFixed(0)} customers`;
}

export function TeamComparisonSection({
  participant: _participant,
  benchmark,
  insights,
}: TeamComparisonSectionProps) {
  const keyInsights = buildPeerKeyInsights(benchmark, insights);

  return (
    <section
      className="kitchen-mgmt-surface participant-peer-compare"
      data-testid="team-comparison-section"
    >
      <h3 className="kitchen-mgmt-surface__title">Compared with other staff</h3>
      <p className="kitchen-mgmt-snapshot-hint">
        Anonymous comparison with other staff who forecast the same service. Individual results are
        never shown.
      </p>

      {!benchmark.canCompare ? (
        <p className="chef-results-peer-insufficient" data-testid="peer-comparison-unavailable">
          Not enough other staff results for an anonymous comparison yet.
        </p>
      ) : (
        <>
          <div className="chef-results-table-wrap kitchen-mgmt-table-wrap" data-testid="peer-comparison-table">
            <table className="chef-results-table kitchen-mgmt-table chef-results-peer-table">
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  <th scope="col" className="kitchen-mgmt-table__num">You</th>
                  <th scope="col" className="kitchen-mgmt-table__num">Other staff median</th>
                </tr>
              </thead>
              <tbody>
                <tr data-testid="peer-row-surplus">
                  <th scope="row">Estimated surplus</th>
                  <td className="kitchen-mgmt-table__num" data-testid="peer-surplus-you">
                    {formatPeerRateGramsPerCustomer(
                      benchmark.participantOverproductionRateGramsPerCustomer,
                    )}
                  </td>
                  <td className="kitchen-mgmt-table__num" data-testid="peer-surplus-median">
                    {formatPeerRateGramsPerCustomer(
                      benchmark.peerOverproductionMedianGramsPerCustomer,
                    )}
                  </td>
                </tr>
                <tr data-testid="peer-row-shortage">
                  <th scope="row">Estimated shortage</th>
                  <td className="kitchen-mgmt-table__num" data-testid="peer-shortage-you">
                    {formatPeerRateGramsPerCustomer(benchmark.participantShortageRateGramsPerCustomer)}
                  </td>
                  <td className="kitchen-mgmt-table__num" data-testid="peer-shortage-median">
                    {formatPeerRateGramsPerCustomer(benchmark.peerShortageMedianGramsPerCustomer)}
                  </td>
                </tr>
                <tr data-testid="peer-row-customer-error">
                  <th scope="row">Customer forecast error</th>
                  <td className="kitchen-mgmt-table__num" data-testid="peer-customer-error-you">
                    {formatCustomerError(benchmark.participantCustomerError)}
                  </td>
                  <td className="kitchen-mgmt-table__num" data-testid="peer-customer-error-median">
                    {formatCustomerError(benchmark.peerCustomerErrorMedian)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="chef-results-peer-aim" data-testid="peer-comparison-aim">
            The aim is to keep both surplus and shortage low.
          </p>

          {keyInsights.length > 0 ? (
            <div className="chef-results-key-insights" data-testid="peer-key-insights">
              <h4 className="kitchen-mgmt-surface__subtitle">Key insights</h4>
              <ul>
                {keyInsights.map((insight) => (
                  <li key={insight}>{insight}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}

      <HowCalculatedDisclosure />
    </section>
  );
}
