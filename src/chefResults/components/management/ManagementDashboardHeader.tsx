interface ManagementDashboardHeaderProps {
  isLoading: boolean;
}

export function ManagementDashboardHeader({ isLoading }: ManagementDashboardHeaderProps) {
  return (
    <header className="kitchen-mgmt-header" data-testid="kitchen-mgmt-header">
      <h1 className="kitchen-mgmt-header__title">Kitchen Management Dashboard</h1>
      <p className="kitchen-mgmt-header__lead">
        Review kitchen service outcomes, staff forecasts and forecasting trends.
      </p>
      {isLoading ? (
        <p className="kitchen-mgmt-header__loading" data-testid="chef-results-admin-pending">
          Loading kitchen results…
        </p>
      ) : null}
    </header>
  );
}
