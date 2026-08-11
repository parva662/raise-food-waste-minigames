import { buildAllFixtureDailyServiceResults } from '../../adapters/fixtureCalculationSource';
import { formatGrams } from '../../useChefResultsData';

export function KitchenProgressSection() {
  const days = buildAllFixtureDailyServiceResults();
  const teamOverAvg =
    days.length === 0
      ? 0
      : days.reduce((sum, day) => {
          const teamTotal = day.staffResults.reduce(
            (inner, result) => inner + result.totalSimulatedOverproductionGrams,
            0,
          );
          return sum + teamTotal / Math.max(1, day.staffResults.length);
        }, 0) / days.length;

  return (
    <section className="chef-results-kitchen-progress" data-testid="kitchen-progress-section">
      <h2 className="chef-results-section-title">Kitchen progress</h2>
      <dl className="chef-results-kitchen-progress__metrics">
        <div>
          <dt>Services completed this week</dt>
          <dd>{days.length}</dd>
        </div>
        <div>
          <dt>Anonymous team average simulated overproduction</dt>
          <dd>{formatGrams(teamOverAvg)}</dd>
        </div>
      </dl>
    </section>
  );
}
