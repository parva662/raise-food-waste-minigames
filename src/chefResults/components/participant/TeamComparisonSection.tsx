import type { AnonymousTeamBenchmark, ParticipantComparisonInsight } from '../../teamComparison';
import type { StaffDailyResult } from '../../types';
import { formatGrams } from '../../useChefResultsData';

interface TeamComparisonSectionProps {
  participant: StaffDailyResult;
  benchmark: AnonymousTeamBenchmark;
  insights: ParticipantComparisonInsight;
}

function markerPercent(value: number, min: number, max: number): number {
  if (max <= min) return 50;
  return ((value - min) / (max - min)) * 100;
}

export function TeamComparisonSection({
  participant,
  benchmark,
  insights,
}: TeamComparisonSectionProps) {
  const overMarker = markerPercent(
    participant.totalSimulatedOverproductionGrams,
    benchmark.overproductionMinGrams,
    benchmark.overproductionMaxGrams,
  );
  const medianMarker = markerPercent(
    benchmark.overproductionMedianGrams,
    benchmark.overproductionMinGrams,
    benchmark.overproductionMaxGrams,
  );

  return (
    <section className="chef-results-team-compare" data-testid="team-comparison-section">
      <h2 className="chef-results-section-title">How you compare</h2>
      <p className="chef-results-section-intro">
        Anonymous team benchmarks from today&apos;s participating forecasts. No names or individual
        coworker values are shown.
      </p>

      <ul className="chef-results-insight-list">
        <li>{insights.overproductionMessage}</li>
        <li>{insights.shortageMessage}</li>
        <li>{insights.customerMessage}</li>
      </ul>

      {benchmark.canShowRange ? (
        <div className="chef-results-benchmark-chart" data-testid="team-benchmark-chart">
          <p className="chef-results-benchmark-chart__label">
            Simulated overproduction — anonymous team range
          </p>
          <div className="chef-results-benchmark-track">
            <div className="chef-results-benchmark-track__range" />
            <div
              className="chef-results-benchmark-track__median"
              style={{ left: `${medianMarker}%` }}
              title={`Team median ${formatGrams(benchmark.overproductionMedianGrams)}`}
            >
              <span>Median</span>
            </div>
            <div
              className="chef-results-benchmark-track__you"
              style={{ left: `${overMarker}%` }}
              title={`You ${formatGrams(participant.totalSimulatedOverproductionGrams)}`}
            >
              <span>You</span>
            </div>
          </div>
          <div className="chef-results-benchmark-chart__axis">
            <span>{formatGrams(benchmark.overproductionMinGrams)}</span>
            <span>{formatGrams(benchmark.overproductionMaxGrams)}</span>
          </div>
        </div>
      ) : (
        <p className="chef-results-benchmark-fallback" data-testid="team-benchmark-median-only">
          Team median simulated overproduction today:{' '}
          {formatGrams(benchmark.overproductionMedianGrams)}
        </p>
      )}
    </section>
  );
}
