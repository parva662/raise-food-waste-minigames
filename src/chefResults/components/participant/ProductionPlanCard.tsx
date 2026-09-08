import { TrendingDown, TrendingUp } from 'lucide-react';
import type { StaffDailyResult } from '../../types';
import { formatGrams } from '../../useChefResultsData';

interface ProductionPlanCardProps {
  result: StaffDailyResult;
  surplusInsight: string | null;
}

export function ProductionPlanCard({ result, surplusInsight }: ProductionPlanCardProps) {
  return (
    <article className="chef-results-forecast-card" data-testid="production-plan-card">
      <h3 className="chef-results-forecast-card__title">If your production plan had been used</h3>

      {surplusInsight ? (
        <p className="chef-results-surplus-insight" data-testid="actual-vs-estimated-surplus-insight">
          {surplusInsight}
        </p>
      ) : null}

      <div className="chef-results-production-metrics" data-testid="participant-summary-cards">
        <div className="chef-results-production-metric">
          <div className="chef-results-production-metric__icon" aria-hidden="true">
            <TrendingUp size={18} strokeWidth={2} />
          </div>
          <div>
            <p className="chef-results-production-metric__label">Estimated surplus</p>
            <p className="chef-results-production-metric__value">
              {formatGrams(result.totalSimulatedOverproductionGrams)}
            </p>
            <p className="chef-results-production-metric__hint">
              Food that might have remained if your production plan had been used.
            </p>
          </div>
        </div>

        <div className="chef-results-production-metric">
          <div className="chef-results-production-metric__icon" aria-hidden="true">
            <TrendingDown size={18} strokeWidth={2} />
          </div>
          <div>
            <p className="chef-results-production-metric__label">Estimated shortage</p>
            <p className="chef-results-production-metric__value">
              {formatGrams(result.totalSimulatedShortageGrams)}
            </p>
            <p className="chef-results-production-metric__hint">
              Food that might have been missing if your production plan had been used.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
