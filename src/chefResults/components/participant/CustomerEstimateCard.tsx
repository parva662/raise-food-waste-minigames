import type { StaffDailyResult } from '../../types';
import { buildCustomerEstimateDifferenceLabel } from '../../forecastInterpretation';

interface CustomerEstimateCardProps {
  result: StaffDailyResult;
}

export function CustomerEstimateCard({ result }: CustomerEstimateCardProps) {
  const difference = buildCustomerEstimateDifferenceLabel(
    result.forecastCustomers,
    result.actualCustomers,
  );

  return (
    <article className="chef-results-forecast-card" data-testid="customer-estimate-card">
      <h3 className="chef-results-forecast-card__title">Customer estimate</h3>
      <dl className="chef-results-forecast-card__metrics">
        <div>
          <dt>Predicted</dt>
          <dd data-testid="customer-estimate-predicted">{result.forecastCustomers}</dd>
        </div>
        <div>
          <dt>Actual</dt>
          <dd data-testid="customer-estimate-actual">{result.actualCustomers}</dd>
        </div>
      </dl>
      <div className="chef-results-customer-difference" data-testid="customer-estimate-difference">
        <span className="chef-results-customer-difference__value">{difference.primary}</span>
        {difference.secondary ? (
          <span className="chef-results-customer-difference__label">{difference.secondary}</span>
        ) : null}
      </div>
    </article>
  );
}
