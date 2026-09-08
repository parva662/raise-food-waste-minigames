import { TrendingDown, TrendingUp, Users } from 'lucide-react';
import type { StaffDailyResult } from '../../types';
import { formatGrams, formatSignedCount } from '../../useChefResultsData';

interface SummaryCardsProps {
  result: StaffDailyResult;
}

export function SummaryCards({ result }: SummaryCardsProps) {
  return (
    <section className="chef-results-summary-cards" data-testid="participant-summary-cards">
      <article className="chef-results-summary-card chef-results-summary-card--customers">
        <div className="chef-results-summary-card__icon" aria-hidden="true">
          <Users size={20} strokeWidth={2} />
        </div>
        <h2 className="chef-results-summary-card__title">Customer forecast</h2>
        <dl className="chef-results-summary-card__metrics">
          <div>
            <dt>Predicted</dt>
            <dd>{result.forecastCustomers}</dd>
          </div>
          <div>
            <dt>Actual</dt>
            <dd>{result.actualCustomers}</dd>
          </div>
          <div>
            <dt>Difference</dt>
            <dd>{formatSignedCount(result.customerForecastDifference)}</dd>
          </div>
        </dl>
      </article>

      <article className="chef-results-summary-card chef-results-summary-card--over">
        <div className="chef-results-summary-card__icon" aria-hidden="true">
          <TrendingUp size={20} strokeWidth={2} />
        </div>
        <h2 className="chef-results-summary-card__title">Estimated surplus</h2>
        <p className="chef-results-summary-card__value">
          {formatGrams(result.totalSimulatedOverproductionGrams)}
        </p>
        <p className="chef-results-summary-card__hint">
          If your forecast had been used, this amount might have remained.
        </p>
      </article>

      <article className="chef-results-summary-card chef-results-summary-card--short">
        <div className="chef-results-summary-card__icon" aria-hidden="true">
          <TrendingDown size={20} strokeWidth={2} />
        </div>
        <h2 className="chef-results-summary-card__title">Estimated shortage</h2>
        <p className="chef-results-summary-card__value">
          {formatGrams(result.totalSimulatedShortageGrams)}
        </p>
        <p className="chef-results-summary-card__hint">
          If your forecast had been used, this amount might have been missing.
        </p>
      </article>
    </section>
  );
}
