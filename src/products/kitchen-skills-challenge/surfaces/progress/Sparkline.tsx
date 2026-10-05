export function Sparkline({
  values,
  labels,
  label,
  testId,
  unit = 'number',
}: {
  values: readonly number[];
  labels?: readonly string[];
  label: string;
  testId: string;
  unit?: 'percent' | 'minutes' | 'number';
}) {
  if (values.length === 0) {
    return (
      <p className="kitchen-day-progress-empty" data-testid={`${testId}-empty`}>
        No {label.toLowerCase()} history yet.
      </p>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const width = 320;
  const height = 160;
  const padX = 8;
  const padTop = 12;
  const padBottom = 28;
  const chartHeight = height - padTop - padBottom;
  const points = values.map((value, index) => {
    const x =
      values.length === 1
        ? width / 2
        : padX + (index / (values.length - 1)) * (width - padX * 2);
    const y = padTop + (chartHeight - ((value - min) / span) * chartHeight);
    return { x, y, value };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');
  const formatValue = (value: number) => {
    if (unit === 'percent') return `${value.toFixed(1)}%`;
    if (unit === 'minutes') return `${value.toFixed(1)} min`;
    return value.toFixed(1);
  };
  const firstLabel = labels?.[0];
  const lastLabel = labels && labels.length > 1 ? labels[labels.length - 1] : undefined;

  return (
    <figure className="kitchen-day-progress-chart" data-testid={testId}>
      <figcaption className="kitchen-day-progress-chart__caption">{label}</figcaption>
      <div className="kitchen-day-progress-chart__meta">
        <span>Low {formatValue(min)}</span>
        <span>High {formatValue(max)}</span>
        <span>Latest {formatValue(values[values.length - 1]!)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        <line
          className="kitchen-day-progress-chart__axis"
          x1={padX}
          y1={padTop}
          x2={padX}
          y2={height - padBottom}
        />
        <line
          className="kitchen-day-progress-chart__axis"
          x1={padX}
          y1={height - padBottom}
          x2={width - padX}
          y2={height - padBottom}
        />
        <polyline
          className="kitchen-day-progress-chart__line"
          fill="none"
          points={polyline}
        />
        {points.map((point, index) => (
          <circle
            key={`${point.x}-${index}`}
            className="kitchen-day-progress-chart__dot"
            cx={point.x}
            cy={point.y}
            r="3.5"
          />
        ))}
        {firstLabel ? (
          <text className="kitchen-day-progress-chart__tick" x={padX} y={height - 8}>
            {firstLabel}
          </text>
        ) : null}
        {lastLabel ? (
          <text
            className="kitchen-day-progress-chart__tick"
            x={width - padX}
            y={height - 8}
            textAnchor="end"
          >
            {lastLabel}
          </text>
        ) : null}
      </svg>
    </figure>
  );
}
