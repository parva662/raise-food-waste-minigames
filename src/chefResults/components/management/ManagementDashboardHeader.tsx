import { ServiceDateSelector } from './ServiceDateSelector';

interface ManagementDashboardHeaderProps {
  isLoading: boolean;
  serviceDates: readonly string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function ManagementDashboardHeader({
  isLoading,
  serviceDates,
  selectedDate,
  onSelectDate,
}: ManagementDashboardHeaderProps) {
  return (
    <header className="kitchen-mgmt-header" data-testid="kitchen-mgmt-header">
      <div className="kitchen-mgmt-header__main">
        <h1 className="kitchen-mgmt-header__title">Kitchen Management Dashboard</h1>
        <p className="kitchen-mgmt-header__lead">
          Review kitchen service outcomes, staff forecasts and performance over time.
        </p>
        {isLoading ? (
          <p className="kitchen-mgmt-header__loading" data-testid="chef-results-admin-pending">
            Loading kitchen results…
          </p>
        ) : null}
      </div>
      {!isLoading ? (
        <ServiceDateSelector
          serviceDates={serviceDates}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          compact
        />
      ) : null}
    </header>
  );
}
