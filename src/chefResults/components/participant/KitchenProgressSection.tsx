import type { KitchenProgressSummary } from '../../adapters/groupCalculationSource';
import { formatGrams } from '../../useChefResultsData';

interface KitchenProgressSectionProps {
  progress: KitchenProgressSummary;
}

export function KitchenProgressSection({ progress }: KitchenProgressSectionProps) {
  return (
    <section className="kitchen-mgmt-surface participant-kitchen-progress" data-testid="kitchen-progress-section">
      <h3 className="kitchen-mgmt-surface__title">Kitchen progress</h3>
      <p className="kitchen-mgmt-snapshot-hint">Anonymous team context for the current week.</p>
      <div className="kitchen-mgmt-kpi-grid">
        <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--neutral">
          <p className="kitchen-mgmt-kpi__value" data-testid="kitchen-progress-services-count">
            {progress.servicesCompletedCount}
          </p>
          <p className="kitchen-mgmt-kpi__label">Services completed this week</p>
        </article>
        <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--surplus">
          <p className="kitchen-mgmt-kpi__value" data-testid="kitchen-progress-team-overproduction">
            {formatGrams(progress.anonymousTeamAverageOverproductionGrams)}
          </p>
          <p className="kitchen-mgmt-kpi__label">Anonymous team average estimated surplus</p>
        </article>
      </div>
    </section>
  );
}
