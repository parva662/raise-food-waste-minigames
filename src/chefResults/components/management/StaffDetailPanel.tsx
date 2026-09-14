import { formatServiceDateLong } from '../../displayFormat';
import {
  formatCustomerErrorCount,
  formatManagementCategoryOutcome,
  formatNormalizedRate,
  formatStaffDetailCustomerDifference,
} from '../../managementFormat';
import {
  shortageRateGramsPerCustomer,
  surplusRateGramsPerCustomer,
} from '../../teamComparison';
import { RESULT_CATEGORY_KEYS, RESULT_CATEGORY_LABELS } from '../../types';
import type { StaffDailyResult } from '../../types';
import { formatGrams } from '../../useChefResultsData';

interface StaffDetailPanelProps {
  result: StaffDailyResult;
  serviceDate: string;
  onClose: () => void;
}

export function StaffDetailPanel({ result, serviceDate, onClose }: StaffDetailPanelProps) {
  const surplusRate = surplusRateGramsPerCustomer(result);
  const shortageRate = shortageRateGramsPerCustomer(result);

  return (
    <section
      id="kitchen-mgmt-staff-detail"
      className="kitchen-mgmt-staff-detail"
      data-testid="kitchen-mgmt-staff-detail"
      aria-labelledby="kitchen-mgmt-staff-detail-title"
    >
      <div className="kitchen-mgmt-staff-detail__header">
        <div>
          <h3
            className="kitchen-mgmt-staff-detail__name"
            id="kitchen-mgmt-staff-detail-title"
            data-testid="kitchen-mgmt-staff-detail-title"
          >
            {result.userName}
          </h3>
          <p className="kitchen-mgmt-staff-detail__subtitle" data-testid="staff-detail-service-context">
            Service detail — {formatServiceDateLong(serviceDate)}
          </p>
        </div>
        <button
          type="button"
          className="kitchen-mgmt-detail-button"
          data-testid="kitchen-mgmt-staff-detail-close"
          onClick={onClose}
        >
          Close
        </button>
      </div>

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
              <dd data-testid="staff-detail-difference">
                {formatStaffDetailCustomerDifference(result)}
              </dd>
            </div>
            <div>
              <dt>Customer error</dt>
              <dd data-testid="staff-detail-customer-error">
                {formatCustomerErrorCount(result.customerForecastAbsoluteError)}
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

      <section className="kitchen-mgmt-surface kitchen-mgmt-surface--nested" data-testid="staff-detail-menu-breakdown">
        <h4 className="kitchen-mgmt-surface__title">By menu item</h4>
        <div className="chef-results-table-wrap kitchen-mgmt-table-wrap">
          <table className="chef-results-table kitchen-mgmt-table">
            <thead>
              <tr>
                <th scope="col">Menu item</th>
                <th scope="col" className="kitchen-mgmt-table__num">Forecast</th>
                <th scope="col" className="kitchen-mgmt-table__num">Observed demand</th>
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
    </section>
  );
}
