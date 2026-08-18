import type { KitchenProgressSummary } from '../../adapters/groupCalculationSource';
import { formatGrams } from '../../useChefResultsData';

interface KitchenProgressSectionProps {
  progress: KitchenProgressSummary;
}

export function KitchenProgressSection({ progress }: KitchenProgressSectionProps) {
  return (
    <section className="chef-results-kitchen-progress" data-testid="kitchen-progress-section">
      <h2 className="chef-results-section-title">Kitchen progress</h2>
      <dl className="chef-results-kitchen-progress__metrics">
        <div>
          <dt>Services completed this week</dt>
          <dd data-testid="kitchen-progress-services-count">{progress.servicesCompletedCount}</dd>
        </div>
        <div>
          <dt>Anonymous team average simulated overproduction</dt>
          <dd data-testid="kitchen-progress-team-overproduction">
            {formatGrams(progress.anonymousTeamAverageOverproductionGrams)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
