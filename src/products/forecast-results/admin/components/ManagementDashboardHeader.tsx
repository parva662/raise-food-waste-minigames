import { ServiceDateSelector } from '@/products/forecast-results/admin/components/ServiceDateSelector';

interface ManagementDashboardHeaderProps {
  isLoading: boolean;
  serviceDates: readonly string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  /** Forecast service-date selector is Forecast & Service only. */
  showServiceDateSelector: boolean;
}

export function ManagementDashboardHeader({
  isLoading,
  serviceDates,
  selectedDate,
  onSelectDate,
  showServiceDateSelector,
}: ManagementDashboardHeaderProps) {
  return (
    <header className="kitchen-mgmt-header" data-testid="kitchen-mgmt-header">
      <div className="kitchen-mgmt-header__main">
        <h1 className="kitchen-mgmt-header__title">Kitchen Management Dashboard</h1>
        <p className="kitchen-mgmt-header__lead">
          Review Forecast &amp; Service outcomes and Kitchen Skills performance for authorized
          administrators and researchers.
        </p>
        {isLoading ? (
          <p className="kitchen-mgmt-header__loading" data-testid="chef-results-admin-pending">
            Loading kitchen results…
          </p>
        ) : null}
      </div>
      {!isLoading && showServiceDateSelector ? (
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
