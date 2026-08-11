import { formatServiceDateShort } from '../../displayFormat';
import type { ParticipantWeekSummary } from '../../participantWeekData';
import { formatGrams } from '../../useChefResultsData';

interface YourWeekSectionProps {
  week: ParticipantWeekSummary;
}

type TrendPoint = {
  x: number;
  y: number;
  value: number;
  serviceDate: string;
};

function buildTrendPoints(
  points: readonly { serviceDate: string; value: number }[],
  height: number,
  width: number,
): TrendPoint[] {
  if (points.length === 0) return [];
  const max = Math.max(1, ...points.map((point) => point.value));
  return points.map((point, index) => ({
    x: points.length === 1 ? width / 2 : (index / (points.length - 1)) * width,
    y: height - (point.value / max) * (height - 24) - 8,
    value: point.value,
    serviceDate: point.serviceDate,
  }));
}

function forecastCountLabel(count: number): string {
  return `Across ${count} forecast${count === 1 ? '' : 's'}`;
}

function WeekTrendChart({
  title,
  tone,
  points,
}: {
  title: string;
  tone: 'over' | 'short';
  points: TrendPoint[];
}) {
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <figure className="chef-results-week-chart" data-testid={`week-trend-${tone}`}>
      <figcaption>{title}</figcaption>
      <svg viewBox="0 0 280 96" role="img" aria-label={title}>
        <polyline
          className={`chef-results-week-chart__line chef-results-week-chart__line--${tone}`}
          points={polyline}
          fill="none"
        />
        {points.map((point) => (
          <g key={point.serviceDate} className="chef-results-week-chart__point">
            <circle
              className={`chef-results-week-chart__dot chef-results-week-chart__dot--${tone}`}
              cx={point.x}
              cy={point.y}
              r={4}
            >
              <title>
                {formatServiceDateShort(point.serviceDate)}: {formatGrams(point.value)}
              </title>
            </circle>
            <text
              className="chef-results-week-chart__value"
              x={point.x}
              y={point.y - 8}
              textAnchor="middle"
            >
              {formatGrams(point.value)}
            </text>
          </g>
        ))}
      </svg>
      <ul className="chef-results-week-chart__dates">
        {points.map((point) => (
          <li key={point.serviceDate}>{formatServiceDateShort(point.serviceDate)}</li>
        ))}
      </ul>
    </figure>
  );
}

export function YourWeekSection({ week }: YourWeekSectionProps) {
  const overPoints = buildTrendPoints(
    week.points.map((point) => ({
      serviceDate: point.serviceDate,
      value: point.totalSimulatedOverproductionGrams,
    })),
    96,
    280,
  );
  const shortPoints = buildTrendPoints(
    week.points.map((point) => ({
      serviceDate: point.serviceDate,
      value: point.totalSimulatedShortageGrams,
    })),
    96,
    280,
  );

  return (
    <section className="chef-results-your-week" data-testid="your-week-section">
      <h2 className="chef-results-section-title">Your week</h2>
      <p className="chef-results-section-intro">
        Your forecast results from services you took part in this week.
      </p>

      {week.points.length === 0 ? (
        <p>No forecast results yet for this week.</p>
      ) : (
        <>
          <dl className="chef-results-week-metrics">
            <div>
              <dt>Services participated</dt>
              <dd>{week.participatedServiceCount}</dd>
            </div>
            <div>
              <dt>Weekly simulated overproduction</dt>
              <dd>
                <span className="chef-results-week-metrics__value">
                  {formatGrams(week.totalSimulatedOverproductionGrams)}
                </span>
                <span className="chef-results-week-metrics__context">
                  {forecastCountLabel(week.participatedServiceCount)}
                </span>
              </dd>
            </div>
            <div>
              <dt>Weekly simulated shortage</dt>
              <dd>
                <span className="chef-results-week-metrics__value">
                  {formatGrams(week.totalSimulatedShortageGrams)}
                </span>
                <span className="chef-results-week-metrics__context">
                  {forecastCountLabel(week.participatedServiceCount)}
                </span>
              </dd>
            </div>
            <div>
              <dt>Mean abs. customer error</dt>
              <dd>
                <span className="chef-results-week-metrics__value">
                  {week.meanAbsoluteCustomerForecastError.toFixed(1)}
                </span>
                <span className="chef-results-week-metrics__context">
                  {forecastCountLabel(week.participatedServiceCount)}
                </span>
              </dd>
            </div>
          </dl>

          <div className="chef-results-week-charts">
            <WeekTrendChart
              title="Simulated overproduction trend"
              tone="over"
              points={overPoints}
            />
            <WeekTrendChart
              title="Simulated shortage trend"
              tone="short"
              points={shortPoints}
            />
          </div>
        </>
      )}
    </section>
  );
}
