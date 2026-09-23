export function Sparkline({
  values,
  label,
  testId,
}: {
  values: readonly number[];
  label: string;
  testId: string;
}) {
  if (values.length === 0) {
    return <p className="chef-results-empty">{label}: no history yet.</p>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const width = 280;
  const height = 72;
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <figure className="kitchen-day-week-chart chef-results-week-chart" data-testid={testId}>
      <figcaption>{label}</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        <polyline fill="none" stroke="var(--color-primary)" strokeWidth="3" points={points} />
      </svg>
    </figure>
  );
}
