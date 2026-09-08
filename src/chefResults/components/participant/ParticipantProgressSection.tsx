import { useCallback, useMemo, useState, type KeyboardEvent } from 'react';
import { formatServiceDateLong } from '../../displayFormat';
import {
  buildParticipantProgressPeriodView,
  formatCustomerError,
  formatGramsPerCustomer,
  getChartableProgressBuckets,
  type ProgressChartBucket,
  type ProgressComparisonDimension,
  type ProgressPeriodTab,
  type ProgressPeriodView,
  type ParticipantProgressServicePoint,
} from '../../participantProgressData';

interface ParticipantProgressSectionProps {
  servicePoints: readonly ParticipantProgressServicePoint[];
  asOfServiceDate: string;
}

const TABS: { id: ProgressPeriodTab; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

function ProgressBarChart({
  buckets,
  latestServiceDate,
}: {
  buckets: readonly ProgressChartBucket[];
  latestServiceDate: string | null;
}) {
  const chartBuckets = getChartableProgressBuckets(buckets);

  if (chartBuckets.length === 0) {
    return (
      <figure className="chef-results-progress-chart" data-testid="progress-bar-chart">
        <figcaption className="chef-results-progress-chart__caption">
          Estimated surplus per customer
        </figcaption>
        <p className="chef-results-progress-chart__unavailable" data-testid="progress-chart-unavailable">
          No chartable normalized performance for this period.
        </p>
      </figure>
    );
  }

  const rates = chartBuckets.map((bucket) => bucket.overproductionRateGramsPerCustomer!);
  const maxRate = Math.max(...rates, 1);

  const chartWidth = Math.max(280, chartBuckets.length * 56);

  return (
    <figure className="chef-results-progress-chart" data-testid="progress-bar-chart">
      <figcaption className="chef-results-progress-chart__caption">
        Estimated surplus per customer
      </figcaption>
      <svg
        className="chef-results-progress-chart__svg"
        viewBox={`0 0 ${chartWidth} 120`}
        role="img"
        aria-label="Estimated surplus per customer"
      >
        <line className="chef-results-progress-chart__baseline" x1="8" y1="96" x2={chartWidth - 8} y2="96" />
        {chartBuckets.map((bucket, index) => {
          const rate = bucket.overproductionRateGramsPerCustomer!;
          const barHeight = (rate / maxRate) * 72;
          const x = index * 56 + 12;
          const y = 96 - barHeight;
          const isLatest = latestServiceDate
            ? bucket.serviceDates.includes(latestServiceDate)
            : false;
          const title = bucket.serviceDates
            .map((serviceDate) => {
              const shortage = bucket.shortageRateGramsPerCustomer;
              return `${formatServiceDateLong(serviceDate)}: ${formatGramsPerCustomer(
                bucket.overproductionRateGramsPerCustomer,
              )}, shortage ${formatGramsPerCustomer(shortage)}, customer error ${bucket.meanCustomerForecastAbsoluteError.toFixed(1)}`;
            })
            .join('; ');

          return (
            <g key={bucket.key} className="chef-results-progress-chart__bar-group">
              <rect
                className="chef-results-progress-chart__bar"
                x={x}
                y={y}
                width={32}
                height={barHeight}
                rx={4}
              >
                <title>{title}</title>
              </rect>
              <text
                className="chef-results-progress-chart__value"
                x={x + 16}
                y={y - 4}
                textAnchor="middle"
              >
                {rate.toFixed(1)}
              </text>
              <text
                className="chef-results-progress-chart__label"
                x={x + 16}
                y={108}
                textAnchor="middle"
              >
                {bucket.label}
              </text>
              {isLatest ? (
                <text
                  className="chef-results-progress-chart__latest"
                  x={x + 16}
                  y={118}
                  textAnchor="middle"
                  data-testid="progress-latest-marker"
                >
                  Latest
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function ComparisonDimensionRow({ dimension }: { dimension: ProgressComparisonDimension }) {
  return (
    <div className="chef-results-progress-compare-row" data-testid={`progress-compare-${dimension.label.toLowerCase().replace(/\s+/g, '-')}`}>
      <span className="chef-results-progress-compare-row__label">{dimension.label}</span>
      <span
        className={`chef-results-progress-compare-row__value chef-results-progress-compare-row__value--${dimension.direction ?? 'unchanged'}`}
      >
        {dimension.displayValue}
      </span>
    </div>
  );
}

function PeriodSummaryCards({ period }: { period: ProgressPeriodView }) {
  const { summary } = period;
  const { comparison } = summary;
  const hasPreviousComparison = comparison.noPreviousPeriodMessage === null;

  return (
    <div className="chef-results-progress-cards" data-testid="progress-summary-cards">
      <article className="chef-results-progress-card" data-testid="progress-period-summary">
        <h3 className="chef-results-progress-card__title">{period.periodTitle}</h3>
        <p className="chef-results-progress-card__range">{period.periodRangeLabel}</p>
        <dl className="chef-results-progress-metrics">
          <div>
            <dt>Average estimated surplus</dt>
            <dd data-testid="progress-average-overproduction">
              {formatGramsPerCustomer(summary.overproductionRateGramsPerCustomer)}
            </dd>
          </div>
          <div>
            <dt>Average estimated shortage</dt>
            <dd data-testid="progress-shortage-risk">
              {formatGramsPerCustomer(summary.shortageRateGramsPerCustomer)}
            </dd>
          </div>
          <div>
            <dt>Average customer error</dt>
            <dd data-testid="progress-average-customer-error">
              {formatCustomerError(summary.meanCustomerForecastAbsoluteError)}
            </dd>
          </div>
          <div>
            <dt>Completed services</dt>
            <dd data-testid="progress-completed-services">{summary.servicesCompleted}</dd>
          </div>
        </dl>
      </article>

      <article className="chef-results-progress-card" data-testid="progress-previous-comparison">
        <h3 className="chef-results-progress-card__title">{period.previousPeriodTitle}</h3>
        {hasPreviousComparison ? (
          <>
            {comparison.surplusComparison ? (
              <ComparisonDimensionRow dimension={comparison.surplusComparison} />
            ) : null}
            {comparison.shortageComparison ? (
              <ComparisonDimensionRow dimension={comparison.shortageComparison} />
            ) : null}
            {comparison.customerErrorComparison ? (
              <ComparisonDimensionRow dimension={comparison.customerErrorComparison} />
            ) : null}
            {comparison.interpretationMessage ? (
              <p className="chef-results-progress-interpretation" data-testid="progress-interpretation">
                {comparison.interpretationMessage}
              </p>
            ) : null}
          </>
        ) : (
          <p className="chef-results-progress-comparison chef-results-progress-comparison--muted">
            {comparison.noPreviousPeriodMessage}
          </p>
        )}
      </article>
    </div>
  );
}

export function ParticipantProgressSection({
  servicePoints,
  asOfServiceDate,
}: ParticipantProgressSectionProps) {
  const [activeTab, setActiveTab] = useState<ProgressPeriodTab>('week');

  const periodViews = useMemo(
    () => ({
      week: buildParticipantProgressPeriodView(servicePoints, 'week', asOfServiceDate),
      month: buildParticipantProgressPeriodView(servicePoints, 'month', asOfServiceDate),
      year: buildParticipantProgressPeriodView(servicePoints, 'year', asOfServiceDate),
    }),
    [asOfServiceDate, servicePoints],
  );

  const activePeriod = periodViews[activeTab];
  const hasAnyHistory = servicePoints.length > 0;
  const latestServiceDate =
    servicePoints.length > 0 ? servicePoints[servicePoints.length - 1]!.serviceDate : null;

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, tabId: ProgressPeriodTab) => {
      const currentIndex = TABS.findIndex((tab) => tab.id === tabId);
      if (currentIndex < 0) return;

      let nextIndex: number | null = null;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % TABS.length;
      if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = TABS.length - 1;

      if (nextIndex !== null) {
        event.preventDefault();
        setActiveTab(TABS[nextIndex]!.id);
        const nextTab = document.getElementById(`progress-tab-${TABS[nextIndex]!.id}`);
        nextTab?.focus();
      }
    },
    [],
  );

  return (
    <section className="chef-results-progress" data-testid="your-progress-section">
      <h2 className="chef-results-section-title">Your progress</h2>
      <p className="chef-results-section-intro">
        See how your forecasts perform over time. Values are shown per customer so services of
        different sizes can be compared.
      </p>

      {!hasAnyHistory ? (
        <div className="chef-results-progress-global-empty" data-testid="progress-global-empty">
          <p>Your progress will build over time.</p>
          <p>
            After you submit forecasts and those services are closed, your Week, Month and Year
            trends will appear here.
          </p>
        </div>
      ) : null}

      <div
        className="chef-results-progress-tabs chef-results-progress-tabs--segmented"
        role="tablist"
        aria-label="Progress period"
        data-testid="progress-period-tabs"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`progress-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`progress-panel-${tab.id}`}
            className={`chef-results-progress-tabs__button${
              activeTab === tab.id ? ' chef-results-progress-tabs__button--active' : ''
            }`}
            data-testid={`progress-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id={`progress-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`progress-tab-${activeTab}`}
        className="chef-results-progress-panel"
        data-testid={`progress-panel-${activeTab}`}
      >
        {activePeriod.emptyMessage ? (
          <div className="chef-results-progress-empty-block" data-testid="progress-period-empty">
            <p>{activePeriod.emptyMessage}</p>
            {activePeriod.emptyHelper ? <p>{activePeriod.emptyHelper}</p> : null}
          </div>
        ) : (
          <>
            <ProgressBarChart
              buckets={activePeriod.summary.buckets}
              latestServiceDate={activeTab === 'week' ? asOfServiceDate : latestServiceDate}
            />
            <PeriodSummaryCards period={activePeriod} />
          </>
        )}
      </div>
    </section>
  );
}
