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

  if (chartBuckets.length === 0) {
    return (
      <figure className="kitchen-mgmt-chart" data-testid="kitchen-mgmt-trend-chart">
        <figcaption>Team estimated surplus per customer</figcaption>
        <p data-testid="kitchen-mgmt-chart-unavailable">
          No chartable normalized performance for this period.
        </p>
      </figure>
    );
  }

  const rates = chartBuckets.map((bucket) => bucket.overproductionRateGramsPerCustomer!);
  const maxRate = Math.max(...rates, 1);
  const chartWidth = Math.max(280, chartBuckets.length * 56);

  return (
    <figure className="kitchen-mgmt-chart" data-testid="kitchen-mgmt-trend-chart">
      <figcaption>Team estimated surplus per customer</figcaption>
      <svg
        className="kitchen-mgmt-chart__svg"
        viewBox={`0 0 ${chartWidth} 120`}
        role="img"
        aria-label="Team estimated surplus per customer"
      >
        <line className="kitchen-mgmt-chart__baseline" x1="8" y1="96" x2={chartWidth - 8} y2="96" />
        {chartBuckets.map((bucket, index) => {
          const rate = bucket.overproductionRateGramsPerCustomer!;
          const barHeight = (rate / maxRate) * 72;
          const x = index * 56 + 12;
          const y = 96 - barHeight;
          const isLatest = bucket.serviceDates.includes(latestServiceDate);
          const title = bucket.serviceDates
            .map((serviceDate) => {
              return `${formatServiceDateLong(serviceDate)}: ${formatGramsPerCustomer(
                bucket.overproductionRateGramsPerCustomer,
              )}`;
            })
            .join('; ');

          return (
            <g key={bucket.key}>
              <title>{title}</title>
              <rect
                className={
                  isLatest
                    ? 'kitchen-mgmt-chart__bar kitchen-mgmt-chart__bar--latest'
                    : 'kitchen-mgmt-chart__bar'
                }
                x={x}
                y={y}
                width={40}
                height={barHeight}
                rx={4}
              />
              <text className="kitchen-mgmt-chart__label" x={x + 20} y={112} textAnchor="middle">
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
    <section className="kitchen-mgmt-section" data-testid="kitchen-mgmt-trends">
      <h2 className="kitchen-mgmt-section__title">Management trends</h2>
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
      >
        {periodView.emptyMessage ? (
          <p className="kitchen-mgmt-empty" data-testid="kitchen-mgmt-trend-empty">
            {periodView.emptyMessage}
          </p>
        ) : (
          <>
            <TeamTrendChart buckets={summary.buckets} latestServiceDate={asOfServiceDate} />

            <article className="kitchen-mgmt-period-summary" data-testid="kitchen-mgmt-period-summary">
              <h3>{periodView.periodTitle}</h3>
              <dl className="kitchen-mgmt-metrics">
                <div>
                  <dt>Team estimated surplus</dt>
                  <dd data-testid="mgmt-team-surplus">
                    {formatNormalizedRate(summary.teamSurplusRateGramsPerCustomer)}
                  </dd>
                </div>
                <div>
                  <dt>Team estimated shortage</dt>
                  <dd data-testid="mgmt-team-shortage">
                    {formatNormalizedRate(summary.teamShortageRateGramsPerCustomer)}
                  </dd>
                </div>
                <div>
                  <dt>Average customer error</dt>
                  <dd data-testid="mgmt-team-customer-error">
                    {formatCustomerErrorCount(summary.meanCustomerForecastAbsoluteError)}
                  </dd>
                </div>
                <div>
                  <dt>Completed services</dt>
                  <dd data-testid="mgmt-completed-services">{summary.completedServices}</dd>
                </div>
                <div>
                  <dt>Staff forecasts evaluated</dt>
                  <dd data-testid="mgmt-staff-forecasts-evaluated">
                    {summary.staffForecastsEvaluated}
                  </dd>
                </div>
              </dl>
            </article>

            {comparison.surplusComparison ||
            comparison.shortageComparison ||
            comparison.customerErrorComparison ? (
              <div className="kitchen-mgmt-comparison" data-testid="kitchen-mgmt-period-comparison">
                <h3>{periodView.previousPeriodTitle}</h3>
                {comparison.surplusComparison ? (
                  <ComparisonRow dimension={comparison.surplusComparison} />
                ) : null}
                {comparison.shortageComparison ? (
                  <ComparisonRow dimension={comparison.shortageComparison} />
                ) : null}
                {comparison.customerErrorComparison ? (
                  <ComparisonRow dimension={comparison.customerErrorComparison} />
                ) : null}
                {periodView.interpretationMessage ? (
                  <p className="kitchen-mgmt-interpretation" data-testid="kitchen-mgmt-interpretation">
                    {periodView.interpretationMessage}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="chef-results-table-wrap">
              <table
                className="chef-results-table kitchen-mgmt-table"
                data-testid="kitchen-mgmt-staff-period-table"
              >
                <thead>
                  <tr>
                    <th scope="col">Staff</th>
                    <th scope="col">Services</th>
                    <th scope="col">Avg estimated surplus</th>
                    <th scope="col">Avg estimated shortage</th>
                    <th scope="col">Avg customer error</th>
                  </tr>
                </thead>
                <tbody>
                  {staffSummaries.map((staff) => (
                    <tr key={staff.userId} data-testid={`mgmt-staff-period-${staff.userId}`}>
                      <th scope="row">{staff.userName}</th>
                      <td>{staff.servicesParticipated}</td>
                      <td>{formatNormalizedRate(staff.surplusRateGramsPerCustomer)}</td>
                      <td>{formatNormalizedRate(staff.shortageRateGramsPerCustomer)}</td>
                      <td>{formatCustomerErrorCount(staff.meanCustomerForecastAbsoluteError)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
