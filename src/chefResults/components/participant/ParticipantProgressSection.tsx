import { useMemo, useState } from 'react';
import { formatServiceDateLong } from '../../displayFormat';
import {
  buildParticipantProgressPeriodView,
  formatCustomerError,
  formatGramsPerCustomer,
  type ProgressChartBucket,
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

function ProgressBarChart({ buckets }: { buckets: readonly ProgressChartBucket[] }) {
  const rates = buckets
    .map((bucket) => bucket.overproductionRateGramsPerCustomer)
    .filter((value): value is number => value !== null);
  const maxRate = Math.max(1, ...rates, 0);

  return (
    <figure className="chef-results-progress-chart" data-testid="progress-bar-chart">
      <figcaption className="chef-results-progress-chart__caption">
        Simulated overproduction (g/customer)
      </figcaption>
      <svg
        className="chef-results-progress-chart__svg"
        viewBox={`0 0 ${Math.max(280, buckets.length * 56)} 140`}
        role="img"
        aria-label="Simulated overproduction per customer"
      >
        {buckets.map((bucket, index) => {
          const rate = bucket.overproductionRateGramsPerCustomer ?? 0;
          const barHeight = rate === 0 ? 2 : (rate / maxRate) * 96;
          const x = index * 56 + 12;
          const y = 120 - barHeight;
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
                {bucket.overproductionRateGramsPerCustomer === null
                  ? '—'
                  : bucket.overproductionRateGramsPerCustomer.toFixed(1)}
              </text>
              <text
                className="chef-results-progress-chart__label"
                x={x + 16}
                y={132}
                textAnchor="middle"
              >
                {bucket.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function PeriodSummary({ period }: { period: ProgressPeriodView }) {
  const { summary } = period;

  return (
    <div className="chef-results-progress-summary" data-testid="progress-period-summary">
      {summary.comparison.overproductionMessage ? (
        <p className="chef-results-progress-comparison" data-testid="progress-overproduction-comparison">
          {summary.comparison.overproductionMessage}
        </p>
      ) : null}
      {summary.comparison.noPreviousPeriodMessage ? (
        <p className="chef-results-progress-comparison chef-results-progress-comparison--muted">
          {summary.comparison.noPreviousPeriodMessage}
        </p>
      ) : null}

      <dl className="chef-results-progress-metrics">
        <div>
          <dt>Average simulated overproduction</dt>
          <dd data-testid="progress-average-overproduction">
            {formatGramsPerCustomer(summary.overproductionRateGramsPerCustomer)}
          </dd>
        </div>
        <div>
          <dt>Shortage risk</dt>
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

      {summary.comparison.shortageMessage ? (
        <p className="chef-results-progress-shortage-comparison" data-testid="progress-shortage-comparison">
          {summary.comparison.shortageMessage}
        </p>
      ) : null}

      <p className="chef-results-progress-normalization-note">
        Values are normalized by the number of customers served so services of different sizes can be
        compared fairly.
      </p>
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

  return (
    <section className="chef-results-progress" data-testid="your-progress-section">
      <h2 className="chef-results-section-title">Your progress</h2>
      <p className="chef-results-section-intro">
        See how your forecasts perform over time. Lower simulated overproduction is better, as long
        as shortages stay under control.
      </p>

      <div
        className="chef-results-progress-tabs"
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
          <p className="chef-results-progress-empty" data-testid="progress-period-empty">
            {activePeriod.emptyMessage}
          </p>
        ) : (
          <>
            <ProgressBarChart buckets={activePeriod.summary.buckets} />
            <PeriodSummary period={activePeriod} />
          </>
        )}
      </div>
    </section>
  );
}
