import { RESULT_CATEGORY_KEYS, RESULT_CATEGORY_LABELS } from '../types';
import type { StaffCategorySimulation, StaffDailyResult } from '../types';
import { formatGrams, formatSignedCount } from '../useChefResultsData';

interface StaffResultCardProps {
  result: StaffDailyResult;
}

function CategoryRow({ label, category }: { label: string; category: StaffCategorySimulation }) {
  return (
    <tr>
      <td>{label}</td>
      <td>{category.forecastQuantity}</td>
      <td>{formatGrams(category.forecastProductionWeightGrams)}</td>
      <td>{formatGrams(category.observedDemandWeightGrams)}</td>
      <td>{formatGrams(category.simulatedOverproductionGrams)}</td>
      <td>{formatGrams(category.simulatedShortageGrams)}</td>
    </tr>
  );
}

export function StaffResultCard({ result }: StaffResultCardProps) {
  return (
    <article className="chef-results-staff-card" data-testid={`staff-result-${result.userId}`}>
      <header className="chef-results-staff-card__header">
        <h3 className="chef-results-staff-card__name">{result.userName}</h3>
        <p className="chef-results-staff-card__note">
          Simulated outcome if this forecast had been used as the production plan, based on the
          observed service demand.
        </p>
      </header>

      <dl className="chef-results-metrics chef-results-metrics--compact">
        <div>
          <dt>Customer forecast</dt>
          <dd>{result.forecastCustomers}</dd>
        </div>
        <div>
          <dt>Actual customers</dt>
          <dd>{result.actualCustomers}</dd>
        </div>
        <div>
          <dt>Signed difference</dt>
          <dd>{formatSignedCount(result.customerForecastDifference)}</dd>
        </div>
        <div>
          <dt>Absolute error</dt>
          <dd>{result.customerForecastAbsoluteError}</dd>
        </div>
        <div>
          <dt>Total simulated overproduction</dt>
          <dd>{formatGrams(result.totalSimulatedOverproductionGrams)}</dd>
        </div>
        <div>
          <dt>Total simulated shortage</dt>
          <dd>{formatGrams(result.totalSimulatedShortageGrams)}</dd>
        </div>
      </dl>

      <details className="chef-results-category-details">
        <summary>Category breakdown (Main / Vegetarian / Soup / Dessert)</summary>
        <div className="chef-results-table-wrap">
          <table className="chef-results-table chef-results-table--compact">
            <thead>
              <tr>
                <th>Category</th>
                <th>Forecast qty</th>
                <th>Forecast weight</th>
                <th>Observed demand</th>
                <th>Simulated overproduction</th>
                <th>Simulated shortage</th>
              </tr>
            </thead>
            <tbody>
              {RESULT_CATEGORY_KEYS.map((key) => (
                <CategoryRow key={key} label={RESULT_CATEGORY_LABELS[key]} category={result[key]} />
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </article>
  );
}
