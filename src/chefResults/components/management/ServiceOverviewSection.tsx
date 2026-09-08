import { sumMeasuredOverproductionGrams } from '../../actualKitchenOutcome';
import { formatMeasuredGrams } from '../../displayFormat';
import { RESULT_CATEGORY_KEYS, RESULT_CATEGORY_LABELS } from '../../types';
import type { DailyServiceResults } from '../../types';
import { formatGrams } from '../../useChefResultsData';

interface ServiceOverviewSectionProps {
  dailyResults: DailyServiceResults;
}

export function ServiceOverviewSection({ dailyResults }: ServiceOverviewSectionProps) {
  const { observed, staffResults } = dailyResults;
  const totalSurplus = sumMeasuredOverproductionGrams(observed);

  return (
    <section className="kitchen-mgmt-section" data-testid="kitchen-mgmt-service-overview">
      <h2 className="kitchen-mgmt-section__title">Service overview</h2>

      <dl className="kitchen-mgmt-metrics" data-testid="kitchen-mgmt-service-metrics">
        <div>
          <dt>Customers served</dt>
          <dd data-testid="service-overview-customers">{observed.actualCustomers}</dd>
        </div>
        <div>
          <dt>Actual surplus after service</dt>
          <dd data-testid="service-overview-total-surplus">{formatMeasuredGrams(totalSurplus)}</dd>
        </div>
        <div>
          <dt>Staff forecasts</dt>
          <dd data-testid="service-overview-staff-count">{staffResults.length}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd data-testid="service-overview-status">Completed</dd>
        </div>
      </dl>

      <div className="chef-results-table-wrap">
        <table className="chef-results-table kitchen-mgmt-table" data-testid="service-overview-category-table">
          <thead>
            <tr>
              <th scope="col">Menu item</th>
              <th scope="col">Prepared</th>
              <th scope="col">Actual surplus</th>
              <th scope="col">Observed demand</th>
            </tr>
          </thead>
          <tbody>
            {RESULT_CATEGORY_KEYS.map((key) => {
              const category = observed[key];
              return (
                <tr key={key} data-testid={`service-overview-row-${key}`}>
                  <th scope="row">{RESULT_CATEGORY_LABELS[key]}</th>
                  <td>{category.actualPreparedQuantity}</td>
                  <td data-testid={`service-overview-surplus-${key}`}>
                    {formatMeasuredGrams(category.measuredOverproductionGrams)}
                  </td>
                  <td>{formatGrams(category.observedDemandWeightGrams)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
