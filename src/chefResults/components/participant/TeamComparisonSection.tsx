import type { AnonymousPeerBenchmark, ParticipantPeerComparisonInsight } from '../../teamComparison';
import { formatPeerRateGramsPerCustomer } from '../../teamComparison';
import type { StaffDailyResult } from '../../types';

interface TeamComparisonSectionProps {
  participant: StaffDailyResult;
  benchmark: AnonymousPeerBenchmark;
  insights: ParticipantPeerComparisonInsight;
}

function barWidthPercent(value: number, maxValue: number): number {
  if (maxValue <= 0) return 0;
  return Math.min(100, (value / maxValue) * 100);
}

function PeerBarRow({
  label,
  value,
  maxValue,
  testId,
}: {
  label: string;
  value: number | null;
  maxValue: number;
  testId: string;
}) {
  const display = formatPeerRateGramsPerCustomer(value);
  const width = value === null ? 0 : barWidthPercent(value, maxValue);

  return (
    <div className="chef-results-peer-bar-row" data-testid={testId}>
      <div className="chef-results-peer-bar-row__label">{label}</div>
      <div className="chef-results-peer-bar-row__track" aria-hidden="true">
        <div className="chef-results-peer-bar-row__fill" style={{ width: `${width}%` }} />
      </div>
      <div className="chef-results-peer-bar-row__value">{display}</div>
    </div>
  );
}

export function TeamComparisonSection({
  participant: _participant,
  benchmark,
  insights,
}: TeamComparisonSectionProps) {
  const canShowRates =
    benchmark.canCompare &&
    benchmark.participantOverproductionRateGramsPerCustomer !== null &&
    benchmark.peerOverproductionMedianGramsPerCustomer !== null;

  const maxOverRate = canShowRates
    ? Math.max(
        benchmark.participantOverproductionRateGramsPerCustomer!,
        benchmark.peerOverproductionMedianGramsPerCustomer!,
        0.1,
      )
    : 0;

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
          <div className="chef-results-peer-comparison" data-testid="peer-surplus-comparison">
            <h3 className="chef-results-peer-comparison__heading">Estimated surplus per customer</h3>

            {canShowRates ? (
              <div className="chef-results-peer-bars">
                <PeerBarRow
                  label="You"
                  value={benchmark.participantOverproductionRateGramsPerCustomer}
                  maxValue={maxOverRate}
                  testId="peer-surplus-bar-you"
                />
                <PeerBarRow
                  label="Other staff median"
                  value={benchmark.peerOverproductionMedianGramsPerCustomer}
                  maxValue={maxOverRate}
                  testId="peer-surplus-bar-median"
                />
              </div>
            ) : (
              <p className="chef-results-peer-unavailable" data-testid="peer-surplus-unavailable">
                Estimated surplus per customer is unavailable for this service.
              </p>
            )}

            {insights.overproductionMessage ? (
              <p className="chef-results-peer-interpretation" data-testid="peer-surplus-interpretation">
                {insights.overproductionMessage}
              </p>
            ) : null}
          </div>

          <div className="chef-results-peer-comparison chef-results-peer-comparison--secondary">
            <h3 className="chef-results-peer-comparison__heading">Estimated shortage</h3>
            <dl className="chef-results-peer-metrics">
              <div>
                <dt>You</dt>
                <dd data-testid="peer-shortage-you">
                  {formatPeerRateGramsPerCustomer(benchmark.participantShortageRateGramsPerCustomer)}
                </dd>
              </div>
              <div>
                <dt>Other staff median</dt>
                <dd data-testid="peer-shortage-median">
                  {formatPeerRateGramsPerCustomer(benchmark.peerShortageMedianGramsPerCustomer)}
                </dd>
              </div>
            </dl>
            {insights.shortageMessage ? (
              <p className="chef-results-peer-interpretation" data-testid="peer-shortage-interpretation">
                {insights.shortageMessage}
              </p>
            ) : null}
          </div>

          <div className="chef-results-peer-comparison chef-results-peer-comparison--secondary">
            <h3 className="chef-results-peer-comparison__heading">Customer forecast error</h3>
            <dl className="chef-results-peer-metrics">
              <div>
                <dt>You</dt>
                <dd data-testid="peer-customer-error-you">
                  {benchmark.participantCustomerError.toFixed(1)} customers
                </dd>
              </div>
              <div>
                <dt>Other staff median</dt>
                <dd data-testid="peer-customer-error-median">
                  {benchmark.peerCustomerErrorMedian.toFixed(1)} customers
                </dd>
              </div>
            </dl>
            {insights.customerMessage ? (
              <p className="chef-results-peer-interpretation" data-testid="peer-customer-interpretation">
                {insights.customerMessage}
              </p>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
