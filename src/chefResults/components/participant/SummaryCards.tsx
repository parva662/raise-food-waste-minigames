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
          👥
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
            <dt>Signed difference</dt>
            <dd>{formatSignedCount(result.customerForecastDifference)}</dd>
          </div>
          <div>
            <dt>Absolute difference</dt>
            <dd>{result.customerForecastAbsoluteError}</dd>
          </div>
        </dl>
      </article>

      <article className="chef-results-summary-card chef-results-summary-card--over">
        <div className="chef-results-summary-card__icon" aria-hidden="true">
          ↗
        </div>
        <h2 className="chef-results-summary-card__title">Simulated overproduction</h2>
        <p className="chef-results-summary-card__value">
          {formatGrams(result.totalSimulatedOverproductionGrams)}
        </p>
        <p className="chef-results-summary-card__hint">
          If your forecast had been the production plan, this surplus weight might have remained.
        </p>
      </article>

      <article className="chef-results-summary-card chef-results-summary-card--short">
        <div className="chef-results-summary-card__icon" aria-hidden="true">
          ↙
        </div>
        <h2 className="chef-results-summary-card__title">Simulated shortage</h2>
        <p className="chef-results-summary-card__value">
          {formatGrams(result.totalSimulatedShortageGrams)}
        </p>
        <p className="chef-results-summary-card__hint">
          If your forecast had been the production plan, this weight might have been missing.
        </p>
      </article>
    </section>
  );
}
