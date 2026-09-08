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
  return `${value.toFixed(1)} customers`;
}

export function TeamComparisonSection({
  participant: _participant,
  benchmark,
  insights,
}: TeamComparisonSectionProps) {
  const keyInsights = buildPeerKeyInsights(benchmark, insights);

  return (
    <section
      className="chef-results-dashboard-section chef-results-team-compare"
      data-testid="team-comparison-section"
    >
      <h2 className="chef-results-section-title">Compared with other staff</h2>
      <p className="chef-results-section-intro">
        Your forecast is compared anonymously with other staff who forecast the same service.
        Individual staff results are never shown.
      </p>

      {!benchmark.canCompare ? (
        <p className="chef-results-peer-insufficient" data-testid="peer-comparison-unavailable">
          Not enough other staff results for an anonymous comparison yet.
        </p>
      ) : (
        <>
          <div className="chef-results-peer-table-wrap" data-testid="peer-comparison-table">
            <table className="chef-results-peer-table">
              <thead>
                <tr>
                  <th scope="col" />
                  <th scope="col">You</th>
                  <th scope="col">Other staff median</th>
                </tr>
              </thead>
              <tbody>
                <tr data-testid="peer-row-surplus">
                  <th scope="row">
                    Estimated surplus
                    <span className="chef-results-peer-table__unit">(g/customer)</span>
                  </th>
                  <td data-testid="peer-surplus-you">
                    {formatPeerRateGramsPerCustomer(
                      benchmark.participantOverproductionRateGramsPerCustomer,
                    )}
                  </td>
                  <td data-testid="peer-surplus-median">
                    {formatPeerRateGramsPerCustomer(
                      benchmark.peerOverproductionMedianGramsPerCustomer,
                    )}
                  </td>
                </tr>
                <tr data-testid="peer-row-shortage">
                  <th scope="row">
                    Estimated shortage
                    <span className="chef-results-peer-table__unit">(g/customer)</span>
                  </th>
                  <td data-testid="peer-shortage-you">
                    {formatPeerRateGramsPerCustomer(benchmark.participantShortageRateGramsPerCustomer)}
                  </td>
                  <td data-testid="peer-shortage-median">
                    {formatPeerRateGramsPerCustomer(benchmark.peerShortageMedianGramsPerCustomer)}
                  </td>
                </tr>
                <tr data-testid="peer-row-customer-error">
                  <th scope="row">
                    Customer forecast error
                    <span className="chef-results-peer-table__unit">(customers)</span>
                  </th>
                  <td data-testid="peer-customer-error-you">
                    {formatCustomerError(benchmark.participantCustomerError)}
                  </td>
                  <td data-testid="peer-customer-error-median">
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
              <h3 className="chef-results-key-insights__title">Key insights</h3>
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
