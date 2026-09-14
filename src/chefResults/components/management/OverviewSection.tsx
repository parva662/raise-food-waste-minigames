import { sumMeasuredOverproductionGrams } from '../../actualKitchenOutcome';
import { formatMeasuredGrams } from '../../displayFormat';
import { buildServiceTeamOverview } from '../../managementTrendsData';
import { formatCustomerErrorCount, formatNormalizedRate } from '../../managementFormat';
import { RESULT_CATEGORY_KEYS, RESULT_CATEGORY_LABELS } from '../../types';
import type { DailyServiceResults } from '../../types';
import { formatGrams } from '../../useChefResultsData';

interface OverviewSectionProps {
  dailyResults: DailyServiceResults;
}

export function OverviewSection({ dailyResults }: OverviewSectionProps) {
  const { observed, staffResults } = dailyResults;
  const totalSurplus = sumMeasuredOverproductionGrams(observed);
  const forecastCount = staffResults.length;
  const teamOverview = buildServiceTeamOverview(staffResults);

  return (
    <div className="kitchen-mgmt-overview" data-testid="kitchen-mgmt-service-overview">
      <section className="kitchen-mgmt-surface" aria-labelledby="kitchen-mgmt-service-outcome-title">
        <h3 className="kitchen-mgmt-surface__title" id="kitchen-mgmt-service-outcome-title">
          Service outcome
        </h3>
        <div className="kitchen-mgmt-kpi-grid" data-testid="kitchen-mgmt-service-metrics">
          <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--neutral">
            <p className="kitchen-mgmt-kpi__value" data-testid="service-overview-customers">
              {observed.actualCustomers}
            </p>
            <p className="kitchen-mgmt-kpi__label">Customers served</p>
          </article>
          <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--surplus">
            <p className="kitchen-mgmt-kpi__value" data-testid="service-overview-total-surplus">
              {formatMeasuredGrams(totalSurplus)}
            </p>
            <p className="kitchen-mgmt-kpi__label">Actual surplus</p>
          </article>
          <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--forecast">
            <p className="kitchen-mgmt-kpi__value" data-testid="service-overview-staff-count">
              {forecastCount}
            </p>
            <p className="kitchen-mgmt-kpi__label">Forecasts submitted</p>
          </article>
          <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--completed">
            <p className="kitchen-mgmt-kpi__value" data-testid="service-overview-status">Completed</p>
            <p className="kitchen-mgmt-kpi__label">Service status</p>
          </article>
        </div>
      </section>

      <section className="kitchen-mgmt-surface" aria-labelledby="kitchen-mgmt-menu-outcome-title">
        <h3 className="kitchen-mgmt-surface__title" id="kitchen-mgmt-menu-outcome-title">
          Menu outcome
        </h3>
        <div className="chef-results-table-wrap kitchen-mgmt-table-wrap">
          <table className="chef-results-table kitchen-mgmt-table" data-testid="service-overview-category-table">
            <thead>
              <tr>
                <th scope="col">Menu item</th>
                <th scope="col" className="kitchen-mgmt-table__num">Prepared</th>
                <th scope="col" className="kitchen-mgmt-table__num">Observed demand</th>
                <th scope="col" className="kitchen-mgmt-table__num">Actual surplus</th>
              </tr>
            </thead>
            <tbody>
              {RESULT_CATEGORY_KEYS.map((key) => {
                const category = observed[key];
                return (
                  <tr key={key} data-testid={`service-overview-row-${key}`}>
                    <th scope="row">{RESULT_CATEGORY_LABELS[key]}</th>
                    <td className="kitchen-mgmt-table__num">{category.actualPreparedQuantity}</td>
                    <td className="kitchen-mgmt-table__num">
                      {formatGrams(category.observedDemandWeightGrams)}
                    </td>
                    <td className="kitchen-mgmt-table__num" data-testid={`service-overview-surplus-${key}`}>
                      {formatMeasuredGrams(category.measuredOverproductionGrams)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="kitchen-mgmt-surface"
        aria-labelledby="kitchen-mgmt-team-snapshot-title"
        data-testid="kitchen-mgmt-team-overview"
      >
        <h3 className="kitchen-mgmt-surface__title" id="kitchen-mgmt-team-snapshot-title">
          Team snapshot
        </h3>
        {forecastCount === 0 ? (
          <p className="kitchen-mgmt-snapshot-message" data-testid="team-snapshot-empty">
            No staff forecasts were submitted for this service.
          </p>
        ) : forecastCount === 1 ? (
          <div data-testid="team-snapshot-single">
            <p className="kitchen-mgmt-snapshot-message">1 staff forecast was submitted for this service.</p>
            <p className="kitchen-mgmt-snapshot-hint">
              Team comparison becomes meaningful once forecasts from multiple staff members are available.
            </p>
          </div>
        ) : (
          <dl className="kitchen-mgmt-kpi-grid kitchen-mgmt-kpi-grid--snapshot">
            <div>
              <dt>Forecasts submitted</dt>
              <dd data-testid="team-overview-staff-count">{teamOverview.staffParticipating}</dd>
            </div>
            <div>
              <dt>Median estimated surplus</dt>
              <dd data-testid="team-overview-median-surplus">
                {formatNormalizedRate(teamOverview.medianSurplusRateGramsPerCustomer)}
              </dd>
            </div>
            <div>
              <dt>Median estimated shortage</dt>
              <dd data-testid="team-overview-median-shortage">
                {formatNormalizedRate(teamOverview.medianShortageRateGramsPerCustomer)}
              </dd>
            </div>
            <div>
              <dt>Median customer error</dt>
              <dd data-testid="team-overview-median-customer-error">
                {teamOverview.medianCustomerForecastError === null
                  ? 'Unavailable'
                  : formatCustomerErrorCount(teamOverview.medianCustomerForecastError)}
              </dd>
            </div>
          </dl>
        )}
      </section>
    </div>
  );
}
