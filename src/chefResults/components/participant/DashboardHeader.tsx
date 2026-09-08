import { CalendarDays, CheckCircle2, Clock3, FileQuestion } from 'lucide-react';
import { formatServiceDateLong } from '../../displayFormat';

export type DashboardStatus =
  | 'loading'
  | 'result-ready'
  | 'waiting-closeout'
  | 'no-forecast';

interface DashboardHeaderProps {
  serviceDate: string;
  status: DashboardStatus;
}

const STATUS_COPY: Record<Exclude<DashboardStatus, 'loading'>, { label: string; className: string }> =
  {
    'result-ready': { label: 'Result ready', className: 'chef-results-status-chip--ready' },
    'waiting-closeout': {
      label: 'Waiting for service closeout',
      className: 'chef-results-status-chip--waiting',
    },
    'no-forecast': {
      label: 'No forecast for this service',
      className: 'chef-results-status-chip--neutral',
    },
  };

export function DashboardHeader({ serviceDate, status }: DashboardHeaderProps) {
  const statusCopy = status === 'loading' ? null : STATUS_COPY[status];

  return (
    <header className="chef-results-dashboard-header" data-testid="dashboard-header">
      <div className="chef-results-dashboard-header__main">
        <h1 className="chef-results-dashboard-header__title">Kitchen Staff Dashboard</h1>
        <p className="chef-results-dashboard-header__lead">
          See what happened in the latest service, how your forecast would have performed, and how
          your forecasting changes over time.
        </p>
        <p className="chef-results-dashboard-header__caveat">
          Forecast feedback is estimated from observed service demand and is not waste personally
          attributed to you.
        </p>
      </div>

      <div className="chef-results-dashboard-header__meta" data-testid="participant-results-header">
        <div className="chef-results-dashboard-header__date-row">
          <CalendarDays size={18} aria-hidden="true" />
          <div>
            <p className="chef-results-dashboard-header__date-label">Service date</p>
            <p className="chef-results-dashboard-header__date-value">
              {formatServiceDateLong(serviceDate)}
            </p>
          </div>
        </div>

        {status === 'loading' ? (
          <div
            className="chef-results-status-chip chef-results-status-chip--loading"
            data-testid="dashboard-status-chip"
          >
            <Clock3 size={14} aria-hidden="true" />
            <span>Loading results…</span>
          </div>
        ) : statusCopy ? (
          <div
            className={`chef-results-status-chip ${statusCopy.className}`}
            data-testid="dashboard-status-chip"
          >
            {status === 'result-ready' ? (
              <CheckCircle2 size={14} aria-hidden="true" />
            ) : status === 'no-forecast' ? (
              <FileQuestion size={14} aria-hidden="true" />
            ) : (
              <Clock3 size={14} aria-hidden="true" />
            )}
            <span>{statusCopy.label}</span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
