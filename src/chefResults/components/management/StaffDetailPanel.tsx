import {
  formatCategoryOutcomeLabel,
  getCategoryOutcomeKind,
} from '../../forecastInterpretation';
import {
  formatCustomerErrorCount,
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
  onClose: () => void;
}

export function StaffDetailPanel({ result, onClose }: StaffDetailPanelProps) {
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
        <h2 className="kitchen-mgmt-staff-detail__title" id="kitchen-mgmt-staff-detail-title">
          {result.userName} — service detail
        </h2>
        <button
          type="button"
          className="kitchen-mgmt-detail-button"
          data-testid="kitchen-mgmt-staff-detail-close"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <section className="kitchen-mgmt-detail-block" data-testid="staff-detail-customer-estimate">
        <h3>Customer estimate</h3>
        <dl className="kitchen-mgmt-detail-metrics">
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
      </section>

      <section className="kitchen-mgmt-detail-block" data-testid="staff-detail-production-plan">
        <h3>Production plan</h3>
        <p className="kitchen-mgmt-detail-block__helper">If this production plan had been used</p>
        <dl className="kitchen-mgmt-detail-metrics">
          <div>
            <dt>Estimated surplus</dt>
            <dd data-testid="staff-detail-surplus-absolute">
              {formatGrams(result.totalSimulatedOverproductionGrams)}
            </dd>
            <dd className="kitchen-mgmt-detail-metrics__rate" data-testid="staff-detail-surplus-rate">
              {formatNormalizedRate(surplusRate)}
            </dd>
          </div>
          <div>
            <dt>Estimated shortage</dt>
            <dd data-testid="staff-detail-shortage-absolute">
              {formatGrams(result.totalSimulatedShortageGrams)}
            </dd>
            <dd className="kitchen-mgmt-detail-metrics__rate" data-testid="staff-detail-shortage-rate">
              {formatNormalizedRate(shortageRate)}
            </dd>
          </div>
        </dl>
        <p className="kitchen-mgmt-detail-block__note">
          Estimated surplus and shortage are calculated from the staff member&apos;s planned menu
          quantities compared with observed service demand.
        </p>
      </section>

      <section className="kitchen-mgmt-detail-block" data-testid="staff-detail-menu-breakdown">
        <h3>Menu item breakdown</h3>
        <div className="chef-results-table-wrap">
          <table className="chef-results-table kitchen-mgmt-table">
            <thead>
              <tr>
                <th scope="col">Menu item</th>
                <th scope="col">Forecast quantity</th>
                <th scope="col">Forecast weight</th>
                <th scope="col">Observed demand</th>
                <th scope="col">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {RESULT_CATEGORY_KEYS.map((key) => {
                const category = result[key];
                const kind = getCategoryOutcomeKind(
                  category.simulatedOverproductionGrams,
                  category.simulatedShortageGrams,
                );
                const grams =
                  kind === 'shortage'
                    ? category.simulatedShortageGrams
                    : category.simulatedOverproductionGrams;
                const outcome = formatCategoryOutcomeLabel(kind, grams);

                return (
                  <tr key={key} data-testid={`staff-detail-category-${key}`}>
                    <th scope="row">{RESULT_CATEGORY_LABELS[key]}</th>
                    <td>{category.forecastQuantity}</td>
                    <td>{formatGrams(category.forecastProductionWeightGrams)}</td>
                    <td>{formatGrams(category.observedDemandWeightGrams)}</td>
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
