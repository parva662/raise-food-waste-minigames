import type { AnonymousTeamContext } from '@/products/forecast-results/adapters/groupCalculationSource';
import { formatGramsPerCustomer } from '@/products/forecast-results/calculations/participantProgressData';

interface KitchenProgressSectionProps {
  progress: AnonymousTeamContext;
}

export function KitchenProgressSection({ progress }: KitchenProgressSectionProps) {
  const scopePhrase = progress.scopeLabel === 'This week' ? 'this week' : 'all time';

  return (
    <section className="kitchen-mgmt-surface participant-kitchen-progress" data-testid="kitchen-progress-section">
      <h3 className="kitchen-mgmt-surface__title">Team context</h3>
      <p className="kitchen-mgmt-snapshot-hint" data-testid="kitchen-progress-scope-label">
        Anonymous team context · {progress.scopeLabel}
      </p>
      <p className="kitchen-mgmt-snapshot-hint">
        Other staff only. Your result is not included, and these services are not your history.
      </p>
      <div className="kitchen-mgmt-kpi-grid">
        <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--neutral">
          <p className="kitchen-mgmt-kpi__value" data-testid="kitchen-progress-services-count">
            {progress.servicesCompletedCount}
          </p>
          <p className="kitchen-mgmt-kpi__label">Team services {scopePhrase}</p>
        </article>
        <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--surplus">
          <p className="kitchen-mgmt-kpi__value" data-testid="kitchen-progress-team-overproduction">
            {formatGramsPerCustomer(progress.anonymousTeamAverageSurplusGramsPerCustomer)}
          </p>
          <p className="kitchen-mgmt-kpi__label">Anonymous team average surplus</p>
        </article>
      </div>
    </section>
  );
}
