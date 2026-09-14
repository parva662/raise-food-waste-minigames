import { useCallback, useMemo, useState, type KeyboardEvent } from 'react';
import { formatServiceDateLong } from '../../displayFormat';
import type { KitchenProgressSummary } from '../../adapters/groupCalculationSource';
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
import { KitchenProgressSection } from './KitchenProgressSection';

interface ParticipantProgressSectionProps {
  servicePoints: readonly ParticipantProgressServicePoint[];
  asOfServiceDate: string;
  kitchenProgress?: KitchenProgressSummary | null;
}

const TABS: { id: ProgressPeriodTab; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

function ProgressTrendChart({
  buckets,
  latestServiceDate,
}: {
  buckets: readonly ProgressChartBucket[];
  latestServiceDate: string | null;
}) {
  const chartBuckets = getChartableProgressBuckets(buckets);

  if (chartBuckets.length < 2) {
    return (
      <div className="kitchen-mgmt-chart-empty" data-testid="progress-chart-unavailable">
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
    <figure className="kitchen-mgmt-chart chef-results-progress-chart" data-testid="progress-bar-chart">
      <figcaption className="kitchen-mgmt-chart__caption">Trend</figcaption>
      <div className="kitchen-mgmt-chart-legend" data-testid="progress-chart-legend">
        <span className="kitchen-mgmt-chart-legend__item kitchen-mgmt-chart-legend__item--surplus">
          Estimated surplus
        </span>
        <span className="kitchen-mgmt-chart-legend__item kitchen-mgmt-chart-legend__item--shortage">
          Estimated shortage
        </span>
      </div>
      <svg
        className="kitchen-mgmt-chart__svg chef-results-progress-chart__svg"
        viewBox={`0 0 ${chartWidth} 132`}
        role="img"
        aria-label="Your estimated surplus and shortage per customer"
        data-testid="progress-trend-chart-svg"
      >
        <line className="kitchen-mgmt-chart__baseline" x1="8" y1="96" x2={chartWidth - 8} y2="96" />
        {chartBuckets.map((bucket, index) => {
          const surplusRate = bucket.overproductionRateGramsPerCustomer ?? 0;
          const shortageRate = bucket.shortageRateGramsPerCustomer ?? 0;
          const surplusHeight = (surplusRate / maxRate) * 72;
          const shortageHeight = (shortageRate / maxRate) * 72;
          const baseX = index * groupWidth + 12;
          const isLatest = latestServiceDate
            ? bucket.serviceDates.includes(latestServiceDate)
            : false;
          const title = bucket.serviceDates
            .map((serviceDate) => {
              return `${formatServiceDateLong(serviceDate)}: surplus ${formatGramsPerCustomer(
                bucket.overproductionRateGramsPerCustomer,
              )}, shortage ${formatGramsPerCustomer(bucket.shortageRateGramsPerCustomer)}`;
            })
            .join('; ');

          return (
            <g key={bucket.key}>
              <title>{title}</title>
              <rect
                className={
                  isLatest
                    ? 'kitchen-mgmt-chart__bar kitchen-mgmt-chart__bar--surplus kitchen-mgmt-chart__bar--latest'
                    : 'kitchen-mgmt-chart__bar kitchen-mgmt-chart__bar--surplus'
                }
                data-testid="progress-chart-bar-surplus"
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
                data-testid="progress-chart-bar-shortage"
                x={baseX + 20}
                y={96 - shortageHeight}
                width={18}
                height={shortageHeight}
                rx={3}
              />
              <text className="kitchen-mgmt-chart__label" x={baseX + 19} y={112} textAnchor="middle">
                {bucket.label}
              </text>
              {isLatest ? (
                <text
                  className="chef-results-progress-chart__latest"
                  x={baseX + 19}
                  y={124}
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
    <div
      className="kitchen-mgmt-comparison-row chef-results-progress-compare-row"
      data-testid={`progress-compare-${dimension.label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <span className="kitchen-mgmt-comparison-row__label">{dimension.label}</span>
      <span
        className={`kitchen-mgmt-comparison-row__value chef-results-progress-compare-row__value chef-results-progress-compare-row__value--${dimension.direction ?? 'unchanged'}`}
      >
        {dimension.displayValue}
      </span>
      {dimension.detail ? (
        <span className="kitchen-mgmt-comparison-row__detail">{dimension.detail}</span>
      ) : null}
    </div>
  );
}

function PeriodSummaryKpis({ period }: { period: ProgressPeriodView }) {
  const { summary } = period;

  return (
    <section className="kitchen-mgmt-surface" data-testid="progress-period-summary">
      <h4 className="kitchen-mgmt-surface__subtitle">Period summary</h4>
      <p className="kitchen-mgmt-snapshot-hint">{period.periodRangeLabel}</p>
      <div className="kitchen-mgmt-kpi-grid" data-testid="progress-summary-cards">
        <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--surplus">
          <p className="kitchen-mgmt-kpi__value" data-testid="progress-average-overproduction">
            {formatGramsPerCustomer(summary.overproductionRateGramsPerCustomer)}
          </p>
          <p className="kitchen-mgmt-kpi__label">Average estimated surplus</p>
        </article>
        <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--shortage">
          <p className="kitchen-mgmt-kpi__value" data-testid="progress-shortage-risk">
            {formatGramsPerCustomer(summary.shortageRateGramsPerCustomer)}
          </p>
          <p className="kitchen-mgmt-kpi__label">Average estimated shortage</p>
        </article>
        <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--forecast">
          <p className="kitchen-mgmt-kpi__value" data-testid="progress-average-customer-error">
            {formatCustomerError(summary.meanCustomerForecastAbsoluteError)}
          </p>
          <p className="kitchen-mgmt-kpi__label">Average customer error</p>
        </article>
        <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--neutral">
          <p className="kitchen-mgmt-kpi__value" data-testid="progress-completed-services">
            {summary.servicesCompleted}
          </p>
          <p className="kitchen-mgmt-kpi__label">Completed services</p>
        </article>
      </div>
    </section>
  );
}

function PreviousPeriodCard({ period }: { period: ProgressPeriodView }) {
  const { comparison } = period.summary;
  const hasPreviousComparison = comparison.noPreviousPeriodMessage === null;

  return (
    <article className="kitchen-mgmt-surface kitchen-mgmt-comparison-card" data-testid="progress-previous-comparison">
      <h4 className="kitchen-mgmt-surface__subtitle">{period.previousPeriodTitle}</h4>
      {hasPreviousComparison ? (
        <>
          <div className="kitchen-mgmt-comparison-card__rows">
            {comparison.surplusComparison ? (
              <ComparisonDimensionRow dimension={comparison.surplusComparison} />
            ) : null}
            {comparison.shortageComparison ? (
              <ComparisonDimensionRow dimension={comparison.shortageComparison} />
            ) : null}
            {comparison.customerErrorComparison ? (
              <ComparisonDimensionRow dimension={comparison.customerErrorComparison} />
            ) : null}
          </div>
          {comparison.interpretationMessage ? (
            <p className="kitchen-mgmt-interpretation" data-testid="progress-interpretation">
              {comparison.interpretationMessage}
            </p>
          ) : null}
        </>
      ) : (
        <p className="kitchen-mgmt-snapshot-hint">{comparison.noPreviousPeriodMessage}</p>
      )}
    </article>
  );
}

export function ParticipantProgressSection({
  servicePoints,
  asOfServiceDate,
  kitchenProgress = null,
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
        const nextTab = document.getElementById(`participant-progress-tab-${TABS[nextIndex]!.id}`);
        nextTab?.focus();
      }
    },
    [],
  );

  return (
    <section className="participant-progress-tab" data-testid="your-progress-section">
      <h3 className="kitchen-mgmt-surface__title">Your progress</h3>
      <p className="kitchen-mgmt-snapshot-hint">
        Performance over time, normalized per customer for fair comparison.
      </p>

      {!hasAnyHistory ? (
        <div className="kitchen-mgmt-surface" data-testid="progress-global-empty">
          <p>Your progress will build over time.</p>
          <p className="kitchen-mgmt-snapshot-hint">
            After you submit forecasts and those services are closed, Week, Month and Year trends
            will appear here.
          </p>
        </div>
      ) : null}

      <div
        className="kitchen-mgmt-tabs chef-results-progress-tabs"
        role="tablist"
        aria-label="Progress period"
        data-testid="progress-period-tabs"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`participant-progress-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`participant-progress-panel-${tab.id}`}
            className={
              activeTab === tab.id
                ? 'kitchen-mgmt-tabs__tab kitchen-mgmt-tabs__tab--active'
                : 'kitchen-mgmt-tabs__tab'
            }
            data-testid={`progress-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id={`participant-progress-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`participant-progress-tab-${activeTab}`}
        className="participant-progress-panel"
        data-testid={`progress-panel-${activeTab}`}
      >
        {activePeriod.emptyMessage ? (
          <div className="kitchen-mgmt-surface" data-testid="progress-period-empty">
            <p>{activePeriod.emptyMessage}</p>
            {activePeriod.emptyHelper ? (
              <p className="kitchen-mgmt-snapshot-hint">{activePeriod.emptyHelper}</p>
            ) : null}
          </div>
        ) : (
          <div className="participant-progress-panel__content">
            <PeriodSummaryKpis period={activePeriod} />
            <ProgressTrendChart
              buckets={activePeriod.summary.buckets}
              latestServiceDate={activeTab === 'week' ? asOfServiceDate : latestServiceDate}
            />
            <PreviousPeriodCard period={activePeriod} />
          </div>
        )}
      </div>

      {kitchenProgress ? <KitchenProgressSection progress={kitchenProgress} /> : null}
    </section>
  );
}
