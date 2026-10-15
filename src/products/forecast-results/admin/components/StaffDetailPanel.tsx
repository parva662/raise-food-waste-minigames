import {
  formatAdminCustomerErrorCount,
  formatAdminCustomerDifference,
} from '@/products/forecast-results/admin/adminPresentation';
import {
  formatManagementCategoryOutcome,
  formatNormalizedRate,
} from '@/products/forecast-results/managementFormat';
import { buildCustomerEstimateDifferenceLabel } from '@/products/forecast-results/calculations/forecastInterpretation';
import {
  shortageRateGramsPerCustomer,
  surplusRateGramsPerCustomer,
} from '@/products/forecast-results/calculations/teamComparison';
import { RESULT_CATEGORY_KEYS, RESULT_CATEGORY_LABELS } from '@/products/forecast-results/types';
import type { StaffDailyResult } from '@/products/forecast-results/types';
import { formatGrams } from '@/products/forecast-results/useForecastResultsData';

interface StaffDetailPanelProps {
  result: StaffDailyResult;
}

function formatDetailCustomerDifference(result: StaffDailyResult): string {
  const label = buildCustomerEstimateDifferenceLabel(
    result.forecastCustomers,
    result.actualCustomers,
  );
  if (!label.secondary) return label.primary;
  const magnitude = Math.abs(result.customerForecastDifference);
  const direction = label.secondary === 'customers high' ? 'high' : 'low';
  return formatAdminCustomerDifference(magnitude, direction);
}

/** Detail body for a completed staff result (rendered inside ManagementDetailDrawer). */
export function StaffDetailPanel({ result }: StaffDetailPanelProps) {
  const surplusRate = surplusRateGramsPerCustomer(result);
  const shortageRate = shortageRateGramsPerCustomer(result);

  return (
    <div className="kitchen-mgmt-drawer-content" data-testid="kitchen-mgmt-staff-detail-body">
      <div className="kitchen-mgmt-detail-cards">
        <article className="kitchen-mgmt-detail-card" data-testid="staff-detail-customer-estimate">
          <h4>Customer estimate</h4>
          <dl>
            <div>
              <dt>Predicted</dt>
              <dd data-testid="staff-detail-predicted">{result.forecastCustomers}</dd>
            </div>
            <div>
              <dt>Actual</dt>
              <dd data-testid="staff-detail-actual">{result.actualCustomers}</dd>
            </div>
            <div>
              <dt>Difference</dt>
              <dd data-testid="staff-detail-difference">{formatDetailCustomerDifference(result)}</dd>
            </div>
            <div>
              <dt>Customer error</dt>
              <dd data-testid="staff-detail-customer-error">
                {formatAdminCustomerErrorCount(result.customerForecastAbsoluteError)}
              </dd>
            </div>
          </dl>
        </article>

        <article className="kitchen-mgmt-detail-card" data-testid="staff-detail-production-plan">
          <h4>Production plan</h4>
          <dl>
            <div>
              <dt>Estimated surplus</dt>
              <dd data-testid="staff-detail-surplus-absolute">
                {formatGrams(result.totalSimulatedOverproductionGrams)}
              </dd>
              <dd className="kitchen-mgmt-detail-card__rate" data-testid="staff-detail-surplus-rate">
                {formatNormalizedRate(surplusRate)}
              </dd>
            </div>
            <div>
              <dt>Estimated shortage</dt>
              <dd data-testid="staff-detail-shortage-absolute">
                {formatGrams(result.totalSimulatedShortageGrams)}
              </dd>
              <dd className="kitchen-mgmt-detail-card__rate" data-testid="staff-detail-shortage-rate">
                {formatNormalizedRate(shortageRate)}
              </dd>
            </div>
          </dl>
        </article>
      </div>

      <section
        className="kitchen-mgmt-surface kitchen-mgmt-surface--nested"
        data-testid="staff-detail-menu-breakdown"
      >
        <h4 className="kitchen-mgmt-surface__title">By menu item</h4>
        <div className="chef-results-table-wrap kitchen-mgmt-table-wrap">
          <table className="chef-results-table kitchen-mgmt-table">
            <thead>
              <tr>
                <th scope="col">Menu item</th>
                <th scope="col" className="kitchen-mgmt-table__num">
                  Forecast
                </th>
                <th scope="col" className="kitchen-mgmt-table__num">
                  Observed demand
                </th>
                <th scope="col">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {RESULT_CATEGORY_KEYS.map((key) => {
                const category = result[key];
                const outcome = formatManagementCategoryOutcome(
                  category.simulatedOverproductionGrams,
                  category.simulatedShortageGrams,
                );

                return (
                  <tr key={key} data-testid={`staff-detail-category-${key}`}>
                    <th scope="row">{RESULT_CATEGORY_LABELS[key]}</th>
                    <td className="kitchen-mgmt-table__num">{category.forecastQuantity}</td>
                    <td className="kitchen-mgmt-table__num">
                      {formatGrams(category.observedDemandWeightGrams)}
                    </td>
                    <td data-testid={`staff-detail-outcome-${key}`}>{outcome}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
