import { sumMeasuredOverproductionGrams } from '@/products/forecast-results/calculations/actualKitchenOutcome';
import { formatMeasuredGrams } from '@/products/forecast-results/displayFormat';
import { buildServiceTeamOverview } from '@/products/forecast-results/calculations/managementTrendsData';
import { formatCustomerErrorCount, formatNormalizedRate } from '@/products/forecast-results/managementFormat';
import { RESULT_CATEGORY_KEYS, RESULT_CATEGORY_LABELS } from '@/products/forecast-results/types';
import type { AdminServiceView } from '@/products/forecast-results/admin/adminServiceView';
import { serviceStatusLabel } from '@/products/forecast-results/admin/adminServiceView';
import { formatGrams } from '@/products/forecast-results/useForecastResultsData';

interface OverviewSectionProps {
  view: AdminServiceView;
}

function UnavailableValue({ testId }: { testId: string }) {
  return (
    <p className="kitchen-mgmt-kpi__value kitchen-mgmt-kpi__value--unavailable" data-testid={testId}>
      Unavailable
    </p>
  );
}

export function OverviewSection({ view }: OverviewSectionProps) {
  if (view.kind === 'none') {
    return (
      <p className="kitchen-mgmt-empty" data-testid="chef-results-admin-empty">
        No forecast or service-closeout data is available.
      </p>
    );
  }

  if (view.kind === 'empty') {
    return (
      <p className="kitchen-mgmt-empty" data-testid="chef-results-admin-empty">
        No forecast or service-closeout data is available for this service.
      </p>
    );
  }

  if (view.kind === 'forecast_only') {
    const forecastCount = view.staffForecasts.length;
    return (
      <div className="kitchen-mgmt-overview" data-testid="kitchen-mgmt-service-overview">
        <section className="kitchen-mgmt-surface" aria-labelledby="kitchen-mgmt-service-outcome-title">
          <h3 className="kitchen-mgmt-surface__title" id="kitchen-mgmt-service-outcome-title">
            Service outcome
          </h3>
          <div className="kitchen-mgmt-kpi-grid" data-testid="kitchen-mgmt-service-metrics">
            <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--forecast">
              <p className="kitchen-mgmt-kpi__value" data-testid="service-overview-staff-count">
                {forecastCount}
              </p>
              <p className="kitchen-mgmt-kpi__label">Forecasts submitted</p>
            </article>
            <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--neutral">
              <UnavailableValue testId="service-overview-customers" />
              <p className="kitchen-mgmt-kpi__label">Customers served</p>
            </article>
            <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--surplus">
              <UnavailableValue testId="service-overview-total-surplus" />
              <p className="kitchen-mgmt-kpi__label">Actual surplus</p>
            </article>
            <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--pending">
              <p className="kitchen-mgmt-kpi__value" data-testid="service-overview-status">
                {serviceStatusLabel('forecast_only')}
              </p>
              <p className="kitchen-mgmt-kpi__label">Service status</p>
            </article>
          </div>
          <p className="kitchen-mgmt-snapshot-hint" data-testid="chef-results-admin-forecast-only">
            {forecastCount} eligible staff forecast{forecastCount === 1 ? '' : 's'} available.
            Simulated results and measured surplus appear after closeout is recorded.
          </p>
        </section>

        <section className="kitchen-mgmt-surface" aria-labelledby="kitchen-mgmt-forecast-staff-title">
          <h3 className="kitchen-mgmt-surface__title" id="kitchen-mgmt-forecast-staff-title">
            Submitted forecasts
          </h3>
          <ul className="kitchen-mgmt-compact-list" data-testid="chef-results-admin-forecast-staff-list">
            {view.staffForecasts.map((forecast) => (
              <li key={forecast.userId}>
                <span className="kitchen-mgmt-compact-list__name">{forecast.userName}</span>
                <span className="kitchen-mgmt-compact-list__meta">
                  {forecast.forecastTotalCustomers} expected customers
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  const { observed, staffResults } = view.dailyResults;
  const totalSurplus = sumMeasuredOverproductionGrams(observed);
  const forecastCount = staffResults.length;
  const teamOverview = buildServiceTeamOverview(staffResults);
  const isCloseoutOnly = view.kind === 'closeout_only';

  return (
    <div className="kitchen-mgmt-overview" data-testid="kitchen-mgmt-service-overview">
      <section className="kitchen-mgmt-surface" aria-labelledby="kitchen-mgmt-service-outcome-title">
        <h3 className="kitchen-mgmt-surface__title" id="kitchen-mgmt-service-outcome-title">
          Service outcome
        </h3>
        <div className="kitchen-mgmt-kpi-grid" data-testid="kitchen-mgmt-service-metrics">
          <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--forecast">
            <p className="kitchen-mgmt-kpi__value" data-testid="service-overview-staff-count">
              {forecastCount}
            </p>
            <p className="kitchen-mgmt-kpi__label">Forecasts submitted</p>
          </article>
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
          <article
            className={
              isCloseoutOnly
                ? 'kitchen-mgmt-kpi kitchen-mgmt-kpi--pending'
                : 'kitchen-mgmt-kpi kitchen-mgmt-kpi--completed'
            }
          >
            <p className="kitchen-mgmt-kpi__value" data-testid="service-overview-status">
              {isCloseoutOnly ? serviceStatusLabel('closeout_only') : 'Completed'}
            </p>
            <p className="kitchen-mgmt-kpi__label">Service status</p>
          </article>
        </div>
        {isCloseoutOnly ? (
          <p className="kitchen-mgmt-snapshot-hint" data-testid="chef-results-admin-closeout-only">
            Service closeout recorded. No eligible staff forecasts are available for this service
            date, so simulated staff comparisons cannot be shown.
          </p>
        ) : null}
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
                <th scope="col" className="kitchen-mgmt-table__num">
                  Prepared
                </th>
                <th scope="col" className="kitchen-mgmt-table__num">
                  Observed demand
                </th>
                <th scope="col" className="kitchen-mgmt-table__num">
                  Actual surplus
                </th>
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
                    <td
                      className="kitchen-mgmt-table__num"
                      data-testid={`service-overview-surplus-${key}`}
                    >
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
            <p className="kitchen-mgmt-snapshot-message">
              1 staff forecast was submitted for this service.
            </p>
            <p className="kitchen-mgmt-snapshot-hint">
              Team comparison becomes meaningful once forecasts from multiple staff members are
              available.
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
