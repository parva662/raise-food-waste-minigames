import { useCallback, useMemo, useState, type KeyboardEvent } from 'react';
import { formatServiceDateLong } from '../../displayFormat';
import {
  formatCustomerErrorCount,
  formatNormalizedRate,
} from '../../managementFormat';
import {
  buildManagementPeriodView,
  type ManagementTrendPoint,
} from '../../managementTrendsData';
import {
  formatGramsPerCustomer,
  getChartableProgressBuckets,
  type ProgressComparisonDimension,
  type ProgressPeriodTab,
} from '../../participantProgressData';

interface ManagementTrendsSectionProps {
  trendPoints: readonly ManagementTrendPoint[];
  asOfServiceDate: string;
}

const TABS: { id: ProgressPeriodTab; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

function ComparisonRow({ dimension }: { dimension: ProgressComparisonDimension }) {
  return (
    <div
      className="kitchen-mgmt-comparison-row"
      data-testid={`mgmt-compare-${dimension.label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <span className="kitchen-mgmt-comparison-row__label">{dimension.label}</span>
      <span className="kitchen-mgmt-comparison-row__value">{dimension.displayValue}</span>
      {dimension.detail ? (
        <span className="kitchen-mgmt-comparison-row__detail">{dimension.detail}</span>
      ) : null}
    </div>
  );
}

function TeamTrendChart({
  buckets,
  latestServiceDate,
}: {
  buckets: ReturnType<typeof buildManagementPeriodView>['summary']['buckets'];
  latestServiceDate: string;
}) {
  const chartBuckets = getChartableProgressBuckets(buckets);

  if (chartBuckets.length < 2) {
    return (
      <div className="kitchen-mgmt-chart-empty" data-testid="kitchen-mgmt-chart-unavailable">
        <p>Not enough completed services to show a trend yet.</p>
        <p>
          Trend visualization will appear after at least two completed service periods are
          available.
        </p>
      </div>
    );
  }

  const maxRate = Math.max(
    ...chartBuckets.flatMap((bucket) => [
      bucket.overproductionRateGramsPerCustomer ?? 0,
      bucket.shortageRateGramsPerCustomer ?? 0,
    ]),
    1,
  );
  const groupWidth = 56;
  const chartWidth = Math.max(280, chartBuckets.length * groupWidth);

  return (
    <figure className="kitchen-mgmt-chart" data-testid="kitchen-mgmt-trend-chart">
      <figcaption className="kitchen-mgmt-chart__caption">Trend</figcaption>
      <div className="kitchen-mgmt-chart-legend" data-testid="kitchen-mgmt-chart-legend">
        <span className="kitchen-mgmt-chart-legend__item kitchen-mgmt-chart-legend__item--surplus">
          Estimated surplus
        </span>
        <span className="kitchen-mgmt-chart-legend__item kitchen-mgmt-chart-legend__item--shortage">
          Estimated shortage
        </span>
      </div>
      <svg
        className="kitchen-mgmt-chart__svg"
        viewBox={`0 0 ${chartWidth} 132`}
        role="img"
        aria-label="Team estimated surplus and shortage per customer"
        data-testid="kitchen-mgmt-trend-chart-svg"
      >
        <line className="kitchen-mgmt-chart__baseline" x1="8" y1="96" x2={chartWidth - 8} y2="96" />
        {chartBuckets.map((bucket, index) => {
          const surplusRate = bucket.overproductionRateGramsPerCustomer ?? 0;
          const shortageRate = bucket.shortageRateGramsPerCustomer ?? 0;
          const surplusHeight = (surplusRate / maxRate) * 72;
          const shortageHeight = (shortageRate / maxRate) * 72;
          const baseX = index * groupWidth + 12;
          const isLatest = bucket.serviceDates.includes(latestServiceDate);
          const title = bucket.serviceDates
            .map((serviceDate) => {
              return `${formatServiceDateLong(serviceDate)}: surplus ${formatGramsPerCustomer(
                bucket.overproductionRateGramsPerCustomer,
              )}, shortage ${formatGramsPerCustomer(bucket.shortageRateGramsPerCustomer)}`;
            })
            .join('; ');

          return (
            <g key={bucket.key} data-testid={`kitchen-mgmt-chart-bucket-${bucket.key}`}>
              <title>{title}</title>
              <rect
                className={
                  isLatest
                    ? 'kitchen-mgmt-chart__bar kitchen-mgmt-chart__bar--surplus kitchen-mgmt-chart__bar--latest'
                    : 'kitchen-mgmt-chart__bar kitchen-mgmt-chart__bar--surplus'
                }
                data-testid="kitchen-mgmt-chart-bar-surplus"
                x={baseX}
                y={96 - surplusHeight}
                width={18}
                height={surplusHeight}
                rx={3}
              />
              <rect
                className={
                  isLatest
                    ? 'kitchen-mgmt-chart__bar kitchen-mgmt-chart__bar--shortage kitchen-mgmt-chart__bar--latest'
                    : 'kitchen-mgmt-chart__bar kitchen-mgmt-chart__bar--shortage'
                }
                data-testid="kitchen-mgmt-chart-bar-shortage"
                x={baseX + 20}
                y={96 - shortageHeight}
                width={18}
                height={shortageHeight}
                rx={3}
              />
              <text className="kitchen-mgmt-chart__label" x={baseX + 19} y={112} textAnchor="middle">
                {bucket.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export function ManagementTrendsSection({
  trendPoints,
  asOfServiceDate,
}: ManagementTrendsSectionProps) {
  const [activeTab, setActiveTab] = useState<ProgressPeriodTab>('week');

  const periodView = useMemo(
    () => buildManagementPeriodView(trendPoints, activeTab, asOfServiceDate),
    [trendPoints, activeTab, asOfServiceDate],
  );

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setActiveTab(TABS[(index + 1) % TABS.length]!.id);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setActiveTab(TABS[(index - 1 + TABS.length) % TABS.length]!.id);
      } else if (event.key === 'Home') {
        event.preventDefault();
        setActiveTab(TABS[0]!.id);
      } else if (event.key === 'End') {
        event.preventDefault();
        setActiveTab(TABS[TABS.length - 1]!.id);
      }
    },
    [],
  );

  const { summary, staffSummaries } = periodView;
  const comparison = summary.comparison;

  return (
    <section className="kitchen-mgmt-trends-tab" data-testid="kitchen-mgmt-trends">
      <h3 className="kitchen-mgmt-surface__title">Management trends</h3>
      <p className="kitchen-mgmt-section__range" data-testid="kitchen-mgmt-trend-range">
        {periodView.periodRangeLabel}
      </p>

      <div
        className="kitchen-mgmt-tabs"
        role="tablist"
        aria-label="Management trend period"
        data-testid="kitchen-mgmt-trend-tabs"
      >
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`kitchen-mgmt-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`kitchen-mgmt-panel-${tab.id}`}
            className={
              activeTab === tab.id
                ? 'kitchen-mgmt-tabs__tab kitchen-mgmt-tabs__tab--active'
                : 'kitchen-mgmt-tabs__tab'
            }
            data-testid={`kitchen-mgmt-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`kitchen-mgmt-panel-${activeTab}`}
        aria-labelledby={`kitchen-mgmt-tab-${activeTab}`}
        data-testid={`kitchen-mgmt-trend-panel-${activeTab}`}
        className="kitchen-mgmt-trends-panel"
      >
        {periodView.emptyMessage ? (
          <p className="kitchen-mgmt-empty" data-testid="kitchen-mgmt-trend-empty">
            {periodView.emptyMessage}
          </p>
        ) : (
          <>
            <section className="kitchen-mgmt-surface" data-testid="kitchen-mgmt-period-summary">
              <h4 className="kitchen-mgmt-surface__subtitle">Period summary</h4>
              <div className="kitchen-mgmt-kpi-grid kitchen-mgmt-kpi-grid--period">
                <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--surplus">
                  <p className="kitchen-mgmt-kpi__value" data-testid="mgmt-team-surplus">
                    {formatNormalizedRate(summary.teamSurplusRateGramsPerCustomer)}
                  </p>
                  <p className="kitchen-mgmt-kpi__label">Team estimated surplus</p>
                </article>
                <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--shortage">
                  <p className="kitchen-mgmt-kpi__value" data-testid="mgmt-team-shortage">
                    {formatNormalizedRate(summary.teamShortageRateGramsPerCustomer)}
                  </p>
                  <p className="kitchen-mgmt-kpi__label">Team estimated shortage</p>
                </article>
                <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--forecast">
                  <p className="kitchen-mgmt-kpi__value" data-testid="mgmt-team-customer-error">
                    {formatCustomerErrorCount(summary.meanCustomerForecastAbsoluteError)}
                  </p>
                  <p className="kitchen-mgmt-kpi__label">Average customer error</p>
                </article>
                <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--neutral">
                  <p className="kitchen-mgmt-kpi__value" data-testid="mgmt-completed-services">
                    {summary.completedServices}
                  </p>
                  <p className="kitchen-mgmt-kpi__label">Completed service</p>
                </article>
                <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--forecast">
                  <p className="kitchen-mgmt-kpi__value" data-testid="mgmt-staff-forecasts-evaluated">
                    {summary.staffForecastsEvaluated}
                  </p>
                  <p className="kitchen-mgmt-kpi__label">Forecasts evaluated</p>
                </article>
              </div>
            </section>

            <TeamTrendChart buckets={summary.buckets} latestServiceDate={asOfServiceDate} />

            {comparison.surplusComparison ||
            comparison.shortageComparison ||
            comparison.customerErrorComparison ? (
              <article className="kitchen-mgmt-surface kitchen-mgmt-comparison-card" data-testid="kitchen-mgmt-period-comparison">
                <h4 className="kitchen-mgmt-surface__subtitle">{periodView.previousPeriodTitle}</h4>
                <div className="kitchen-mgmt-comparison-card__rows">
                  {comparison.surplusComparison ? (
                    <ComparisonRow dimension={comparison.surplusComparison} />
                  ) : null}
                  {comparison.shortageComparison ? (
                    <ComparisonRow dimension={comparison.shortageComparison} />
                  ) : null}
                  {comparison.customerErrorComparison ? (
                    <ComparisonRow dimension={comparison.customerErrorComparison} />
                  ) : null}
                </div>
                {periodView.interpretationMessage ? (
                  <p className="kitchen-mgmt-interpretation" data-testid="kitchen-mgmt-interpretation">
                    {periodView.interpretationMessage}
                  </p>
                ) : null}
              </article>
            ) : null}

            <section className="kitchen-mgmt-surface">
              <h4 className="kitchen-mgmt-surface__subtitle">Staff performance in this period</h4>
              <div className="chef-results-table-wrap kitchen-mgmt-table-wrap">
                <table
                  className="chef-results-table kitchen-mgmt-table"
                  data-testid="kitchen-mgmt-staff-period-table"
                >
                  <thead>
                    <tr>
                      <th scope="col">Staff</th>
                      <th scope="col" className="kitchen-mgmt-table__num">Services</th>
                      <th scope="col" className="kitchen-mgmt-table__num">Avg surplus</th>
                      <th scope="col" className="kitchen-mgmt-table__num">Avg shortage</th>
                      <th scope="col" className="kitchen-mgmt-table__num">Avg customer error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffSummaries.map((staff) => (
                      <tr key={staff.userId} data-testid={`mgmt-staff-period-${staff.userId}`}>
                        <th scope="row">{staff.userName}</th>
                        <td className="kitchen-mgmt-table__num">{staff.servicesParticipated}</td>
                        <td className="kitchen-mgmt-table__num">
                          {formatNormalizedRate(staff.surplusRateGramsPerCustomer)}
                        </td>
                        <td className="kitchen-mgmt-table__num">
                          {formatNormalizedRate(staff.shortageRateGramsPerCustomer)}
                        </td>
                        <td className="kitchen-mgmt-table__num">
                          {formatCustomerErrorCount(staff.meanCustomerForecastAbsoluteError)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </section>
  );
}
