import type { StaffWeeklySummary } from '../types';
import { formatGrams } from '../useChefResultsData';

interface WeeklySummaryPanelProps {
  summaries: StaffWeeklySummary[];
}

export function WeeklySummaryPanel({ summaries }: WeeklySummaryPanelProps) {
  if (summaries.length === 0) return null;

  return (
    <section className="chef-results-panel" data-testid="weekly-summary-panel">
      <h2 className="chef-results-panel__title">Provisional weekly summary (fixtures)</h2>
      <p className="chef-results-panel__intro">
        Raw aggregated metrics only — no ranking or composite score. Staff may have participated on
        different numbers of service days.
      </p>
      <div className="chef-results-table-wrap">
        <table className="chef-results-table">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Services</th>
              <th>Total simulated overproduction</th>
              <th>Total simulated shortage</th>
              <th>Mean abs. customer error</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <tr key={summary.userId}>
                <td>{summary.userName}</td>
                <td>{summary.participatedServiceCount}</td>
                <td>{formatGrams(summary.totalSimulatedOverproductionGrams)}</td>
                <td>{formatGrams(summary.totalSimulatedShortageGrams)}</td>
                <td>{summary.meanAbsoluteCustomerForecastError.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
