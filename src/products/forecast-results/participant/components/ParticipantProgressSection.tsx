import { useCallback, useMemo, useState, type KeyboardEvent } from 'react';
import { formatServiceDateLong } from '@/products/forecast-results/displayFormat';
import type { KitchenProgressSummary } from '@/products/forecast-results/adapters/groupCalculationSource';
import { formatGrams } from '@/products/forecast-results/useForecastResultsData';
import {
  aggregateCustomerWeightedRates,
  buildDailyServiceChartBuckets,
  buildParticipantProgressPeriodView,
  filterParticipantProgressHistory,
  formatCustomerError,
  formatGramsPerCustomer,
  FORECAST_PROGRESS_HISTORY_PAGE_SIZE,
  getChartableProgressBuckets,
  paginateParticipantProgressHistory,
  recentCompletedServicesLabel,
  takeRecentParticipantProgressPoints,
  type ProgressChartBucket,
  type ProgressComparisonDimension,
  type ProgressPeriodTab,
  type ProgressPeriodView,
  type ParticipantProgressServicePoint,
} from '@/products/forecast-results/calculations/participantProgressData';
import { KitchenProgressSection } from '@/products/forecast-results/participant/components/KitchenProgressSection';

interface ParticipantProgressSectionProps {
  servicePoints: readonly ParticipantProgressServicePoint[];
  asOfServiceDate: string;
  kitchenProgress?: KitchenProgressSummary | null;
  teamSurplusGramsByDate?: ReadonlyMap<string, number>;
}

type ProgressViewTab = 'recent' | 'trends' | 'history';

const VIEW_TABS: { id: ProgressViewTab; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'trends', label: 'Trends' },
  { id: 'history', label: 'History' },
];

const TREND_TABS: { id: ProgressPeriodTab; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

function ProgressTrendChart({
  buckets,
  latestServiceDate,
  testId = 'progress-bar-chart',
  caption = 'Trend',
}: {
  buckets: readonly ProgressChartBucket[];
  latestServiceDate: string | null;
  testId?: string;
  caption?: string;
}) {
  const chartBuckets = getChartableProgressBuckets(buckets);

  if (chartBuckets.length === 0) {
    return (
      <div className="kitchen-mgmt-chart-empty" data-testid="progress-chart-unavailable">
        <p>No completed services to chart yet.</p>
        <p>A chart will appear after at least one completed service is available.</p>
      </div>
    );
  }

  const showTrend = chartBuckets.length >= 2;
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
    <figure className="kitchen-mgmt-chart chef-results-progress-chart" data-testid={testId}>
      <figcaption className="kitchen-mgmt-chart__caption">
        {showTrend ? caption : 'Completed service'}
      </figcaption>
      {!showTrend ? (
        <p className="kitchen-mgmt-snapshot-hint" data-testid="progress-chart-single-point-note">
          One completed service is shown. Trend comparison appears after a second completed service.
        </p>
      ) : null}
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

          return (
            <g key={bucket.key}>
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

function PeriodSummaryKpis({
  summary,
  rangeLabel,
  title = 'Period summary',
  testId = 'progress-period-summary',
}: {
  summary: ProgressPeriodView['summary'];
  rangeLabel: string;
  title?: string;
  testId?: string;
}) {
  return (
    <section className="kitchen-mgmt-surface" data-testid={testId}>
      <h4 className="kitchen-mgmt-surface__subtitle">{title}</h4>
      <p className="kitchen-mgmt-snapshot-hint">{rangeLabel}</p>
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

function RecentServiceRow({
  point,
  teamSurplusGrams,
}: {
  point: ParticipantProgressServicePoint;
  teamSurplusGrams?: number;
}) {
  return (
    <details className="chef-results-progress-history-row" data-testid={`progress-recent-row-${point.serviceDate}`}>
      <summary>
        <span className="chef-results-progress-history-row__date">
          {formatServiceDateLong(point.serviceDate)}
        </span>
        <span className="chef-results-progress-history-row__metrics">
          Surplus {formatGramsPerCustomer(point.simulatedOverproductionGramsPerCustomer)} · Shortage{' '}
          {formatGramsPerCustomer(point.simulatedShortageGramsPerCustomer)}
        </span>
        <span className="chef-results-progress-history-row__meta">
          Error {formatCustomerError(point.customerForecastAbsoluteError)}
        </span>
      </summary>
      <div className="chef-results-progress-history-row__body">
        <p className="kitchen-mgmt-snapshot-hint">
          Actual customers: {point.actualCustomers}
          {teamSurplusGrams != null
            ? ` · Anonymous team avg surplus ${formatGrams(teamSurplusGrams)}`
            : ''}
        </p>
      </div>
    </details>
  );
}

function HistoryPanel({
  servicePoints,
  teamSurplusGramsByDate,
}: {
  servicePoints: readonly ParticipantProgressServicePoint[];
  teamSurplusGramsByDate: ReadonlyMap<string, number>;
}) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const filtered = filterParticipantProgressHistory(servicePoints, fromDate || null, toDate || null);
  const { pageItems, page: safePage, totalPages, totalItems } = paginateParticipantProgressHistory(
    filtered,
    page,
    FORECAST_PROGRESS_HISTORY_PAGE_SIZE,
  );

  return (
    <section className="kitchen-mgmt-surface" data-testid="progress-history-panel">
      <h4 className="kitchen-mgmt-surface__subtitle">History</h4>
      <p className="kitchen-mgmt-snapshot-hint">
        Browse earlier completed services. Charts in Recent and Trends stay bounded.
      </p>

      <div className="chef-results-progress-history-filters">
        <label className="chef-results-progress-history-filters__field">
          <span>From</span>
          <input
            type="date"
            value={fromDate}
            data-testid="progress-history-from"
            onChange={(event) => {
              setFromDate(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="chef-results-progress-history-filters__field">
          <span>To</span>
          <input
            type="date"
            value={toDate}
            data-testid="progress-history-to"
            onChange={(event) => {
              setToDate(event.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>

      {totalItems === 0 ? (
        <p className="kitchen-mgmt-snapshot-hint" data-testid="progress-history-empty">
          No completed services match these filters.
        </p>
      ) : (
        <>
          <ul className="chef-results-progress-history-list" data-testid="progress-history-list">
            {pageItems.map((point) => (
              <li key={point.serviceDate}>
                <RecentServiceRow
                  point={point}
                  teamSurplusGrams={teamSurplusGramsByDate.get(point.serviceDate)}
                />
              </li>
            ))}
          </ul>
          <div className="chef-results-progress-history-pager">
            <p className="kitchen-mgmt-snapshot-hint">
              {totalItems} service{totalItems === 1 ? '' : 's'} · page {safePage} of {totalPages}
            </p>
            <div className="chef-results-progress-history-pager__actions">
              <button
                type="button"
                className="kitchen-day-button kitchen-day-button--ghost"
                disabled={safePage <= 1}
                data-testid="progress-history-prev"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="kitchen-day-button kitchen-day-button--ghost"
                disabled={safePage >= totalPages}
                data-testid="progress-history-next"
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export function ParticipantProgressSection({
  servicePoints,
  asOfServiceDate,
  kitchenProgress = null,
  teamSurplusGramsByDate = new Map(),
}: ParticipantProgressSectionProps) {
  const [viewTab, setViewTab] = useState<ProgressViewTab>('recent');
  const [trendTab, setTrendTab] = useState<ProgressPeriodTab>('week');

  const hasAnyHistory = servicePoints.length > 0;
  const latestServiceDate =
    servicePoints.length > 0 ? servicePoints[servicePoints.length - 1]!.serviceDate : null;

  const recentPoints = useMemo(
    () => takeRecentParticipantProgressPoints(servicePoints),
    [servicePoints],
  );
  const recentSummary = useMemo(
    () => aggregateCustomerWeightedRates(recentPoints),
    [recentPoints],
  );
  const recentChartBuckets = useMemo(() => {
    const chronological = [...recentPoints].sort((left, right) =>
      left.serviceDate.localeCompare(right.serviceDate),
    );
    return buildDailyServiceChartBuckets(chronological);
  }, [recentPoints]);

  const activeTrendPeriod = useMemo(
    () => buildParticipantProgressPeriodView(servicePoints, trendTab, asOfServiceDate),
    [asOfServiceDate, servicePoints, trendTab],
  );

  const handleViewTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, tabId: ProgressViewTab) => {
      const currentIndex = VIEW_TABS.findIndex((tab) => tab.id === tabId);
      if (currentIndex < 0) return;

      let nextIndex: number | null = null;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % VIEW_TABS.length;
      if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + VIEW_TABS.length) % VIEW_TABS.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = VIEW_TABS.length - 1;

      if (nextIndex !== null) {
        event.preventDefault();
        setViewTab(VIEW_TABS[nextIndex]!.id);
        const nextTab = document.getElementById(`participant-progress-view-tab-${VIEW_TABS[nextIndex]!.id}`);
        nextTab?.focus();
      }
    },
    [],
  );

  const handleTrendTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, tabId: ProgressPeriodTab) => {
      const currentIndex = TREND_TABS.findIndex((tab) => tab.id === tabId);
      if (currentIndex < 0) return;

      let nextIndex: number | null = null;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % TREND_TABS.length;
      if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + TREND_TABS.length) % TREND_TABS.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = TREND_TABS.length - 1;

      if (nextIndex !== null) {
        event.preventDefault();
        setTrendTab(TREND_TABS[nextIndex]!.id);
        const nextTab = document.getElementById(`participant-progress-trend-tab-${TREND_TABS[nextIndex]!.id}`);
        nextTab?.focus();
      }
    },
    [],
  );

  return (
    <section className="participant-progress-tab" data-testid="your-progress-section">
      <h3 className="kitchen-mgmt-surface__title">Your progress</h3>
      <p className="kitchen-mgmt-snapshot-hint">
        Recent completed services first, calendar trends when you need context, and history on demand.
      </p>

      {!hasAnyHistory ? (
        <div className="kitchen-mgmt-surface" data-testid="progress-global-empty">
          <p>Your progress will build over time.</p>
          <p className="kitchen-mgmt-snapshot-hint">
            After you submit forecasts and those services are closed, Recent, Trends, and History will
            appear here.
          </p>
        </div>
      ) : null}

      <div
        className="kitchen-mgmt-tabs chef-results-progress-tabs chef-results-progress-tabs--segmented"
        role="tablist"
        aria-label="Progress views"
        data-testid="progress-view-tabs"
      >
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`participant-progress-view-tab-${tab.id}`}
            aria-selected={viewTab === tab.id}
            aria-controls={`participant-progress-view-panel-${tab.id}`}
            className={
              viewTab === tab.id
                ? 'kitchen-mgmt-tabs__tab kitchen-mgmt-tabs__tab--active chef-results-progress-tabs__button chef-results-progress-tabs__button--active'
                : 'kitchen-mgmt-tabs__tab chef-results-progress-tabs__button'
            }
            data-testid={`progress-view-tab-${tab.id}`}
            onClick={() => setViewTab(tab.id)}
            onKeyDown={(event) => handleViewTabKeyDown(event, tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id={`participant-progress-view-panel-${viewTab}`}
        role="tabpanel"
        className="participant-progress-panel"
        data-testid={`progress-view-panel-${viewTab}`}
      >
        {viewTab === 'recent' ? (
          <div data-testid="progress-recent-panel">
            <p className="kitchen-mgmt-snapshot-hint" data-testid="progress-recent-label">
              {recentCompletedServicesLabel(recentPoints)}
            </p>
            <PeriodSummaryKpis
              summary={{
                ...recentSummary,
                buckets: recentChartBuckets,
                comparison: {
                  overproductionMessage: null,
                  shortageMessage: null,
                  noPreviousPeriodMessage: null,
                  surplusComparison: null,
                  shortageComparison: null,
                  customerErrorComparison: null,
                  interpretationMessage: null,
                },
              }}
              rangeLabel={recentCompletedServicesLabel(recentPoints)}
              title="Recent summary"
              testId="progress-recent-summary"
            />
            <ProgressTrendChart
              buckets={recentChartBuckets}
              latestServiceDate={recentPoints[0]?.serviceDate ?? null}
              testId="progress-recent-chart"
              caption="Recent daily trend"
            />
            <section className="kitchen-mgmt-surface">
              <h4 className="kitchen-mgmt-surface__subtitle">Recent services</h4>
              <ul className="chef-results-progress-history-list" data-testid="progress-recent-list">
                {recentPoints.map((point) => (
                  <li key={point.serviceDate}>
                    <RecentServiceRow
                      point={point}
                      teamSurplusGrams={teamSurplusGramsByDate.get(point.serviceDate)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        {viewTab === 'trends' ? (
          <div data-testid="progress-trends-panel">
            <div
              className="kitchen-mgmt-tabs chef-results-progress-tabs"
              role="tablist"
              aria-label="Progress period"
              data-testid="progress-period-tabs"
            >
              {TREND_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`participant-progress-trend-tab-${tab.id}`}
                  aria-selected={trendTab === tab.id}
                  aria-controls={`participant-progress-trend-panel-${tab.id}`}
                  className={
                    trendTab === tab.id
                      ? 'kitchen-mgmt-tabs__tab kitchen-mgmt-tabs__tab--active'
                      : 'kitchen-mgmt-tabs__tab'
                  }
                  data-testid={`progress-tab-${tab.id}`}
                  onClick={() => setTrendTab(tab.id)}
                  onKeyDown={(event) => handleTrendTabKeyDown(event, tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              id={`participant-progress-trend-panel-${trendTab}`}
              role="tabpanel"
              data-testid={`progress-panel-${trendTab}`}
            >
              {activeTrendPeriod.emptyMessage ? (
                <div className="kitchen-mgmt-surface" data-testid="progress-period-empty">
                  <p>{activeTrendPeriod.emptyMessage}</p>
                  {activeTrendPeriod.emptyHelper ? (
                    <p className="kitchen-mgmt-snapshot-hint">{activeTrendPeriod.emptyHelper}</p>
                  ) : null}
                </div>
              ) : (
                <div className="participant-progress-panel__content">
                  <PeriodSummaryKpis
                    summary={activeTrendPeriod.summary}
                    rangeLabel={activeTrendPeriod.periodRangeLabel}
                  />
                  <ProgressTrendChart
                    buckets={activeTrendPeriod.summary.buckets}
                    latestServiceDate={trendTab === 'week' ? asOfServiceDate : latestServiceDate}
                  />
                  <PreviousPeriodCard period={activeTrendPeriod} />
                </div>
              )}
            </div>
          </div>
        ) : null}

        {viewTab === 'history' ? (
          <HistoryPanel
            servicePoints={servicePoints}
            teamSurplusGramsByDate={teamSurplusGramsByDate}
          />
        ) : null}
      </div>

      {kitchenProgress ? <KitchenProgressSection progress={kitchenProgress} /> : null}
    </section>
  );
}
