import { CheckCircle2, Clock3, FileQuestion, Ban } from 'lucide-react';
import { formatServiceDateLong } from '../../displayFormat';

export type DashboardStatus =
  | 'loading'
  | 'result-ready'
  | 'waiting-closeout'
  | 'no-forecast'
  | 'no-service';

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
    'no-service': {
      label: 'No service today',
      className: 'chef-results-status-chip--neutral',
    },
  };

export function DashboardHeader({ serviceDate, status }: DashboardHeaderProps) {
  const statusCopy = status === 'loading' ? null : STATUS_COPY[status];

  return (
    <header className="kitchen-mgmt-header chef-results-dashboard-header" data-testid="dashboard-header">
      <div className="kitchen-mgmt-header__main chef-results-dashboard-header__main">
        <h1 className="kitchen-mgmt-header__title chef-results-dashboard-header__title">
          Kitchen Staff Dashboard
        </h1>
        <p className="kitchen-mgmt-header__lead chef-results-dashboard-header__lead">
          See your latest service result and how your forecasting changes over time.
        </p>
        <p className="chef-results-dashboard-header__caveat">
          Forecast feedback is estimated — not waste personally attributed to you.
        </p>
      </div>

      <div
        className="chef-results-dashboard-header__meta kitchen-mgmt-date-picker kitchen-mgmt-date-picker--compact"
        data-testid="participant-results-header"
      >
        <div className="chef-results-dashboard-header__meta-block">
          <span className="kitchen-mgmt-date-picker__title">Service date</span>
          <p className="chef-results-dashboard-header__date-value" data-testid="dashboard-calendar-date">
            {formatServiceDateLong(serviceDate)}
          </p>
        </div>

        <div className="chef-results-dashboard-header__meta-block">
          <span className="kitchen-mgmt-date-picker__title">Status</span>
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
              ) : status === 'no-forecast' || status === 'no-service' ? (
                status === 'no-service' ? (
                  <Ban size={14} aria-hidden="true" />
                ) : (
                  <FileQuestion size={14} aria-hidden="true" />
                )
              ) : (
                <Clock3 size={14} aria-hidden="true" />
              )}
              <span>{statusCopy.label}</span>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
