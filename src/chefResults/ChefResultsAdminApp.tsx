import { useEffect, useMemo, useState } from 'react';
import {
  getGroupAdminServiceDates,
  resolveAdminServicePartialState,
  type AdminServicePartialState,
} from './adapters/groupCalculationSource';
import { getFixtureServiceDates } from './adapters/fixtureCalculationSource';
import { ForecastingManagementSection } from './components/management/ForecastingManagementSection';
import { ManagementDashboardHeader } from './components/management/ManagementDashboardHeader';
import { ActualKitchenOutcomeSection } from './components/participant/ActualKitchenOutcomeSection';
import { useChefResultsData } from './useChefResultsData';
import { useGameBusEmbed } from '../gamebus/useGameBusEmbed';

/**
 * Kitchen Management Dashboard — operational forecasting management for authorized users.
 * Route: #/chef-results-admin (hidden from participant navigation).
 *
 * TODO: Route-level authorization is not implemented in this frontend. Access must be
 * enforced by GameBus/platform configuration until a reliable permission signal exists
 * in the INPUT_COLLECTIONS contract.
 */
function AdminPartialServicePanel({ state }: { state: AdminServicePartialState }) {
  if (state.kind === 'closeout_only') {
    return (
      <div data-testid="chef-results-admin-closeout-only">
        <div className="kitchen-mgmt-surface">
          <p className="kitchen-mgmt-snapshot-message">Service closeout recorded</p>
          <p className="kitchen-mgmt-snapshot-hint">
            No eligible staff forecasts are available for this service date, so simulated staff
            comparisons cannot be shown.
          </p>
        </div>
        <ActualKitchenOutcomeSection observed={state.dailyResults.observed} />
      </div>
    );
  }

  if (state.kind === 'forecast_only') {
    return (
      <div className="kitchen-mgmt-surface" data-testid="chef-results-admin-forecast-only">
        <p className="kitchen-mgmt-snapshot-message">Waiting for service closeout</p>
        <p className="kitchen-mgmt-snapshot-hint">
          {state.staffForecasts.length} eligible staff forecast
          {state.staffForecasts.length === 1 ? '' : 's'} available. Simulated results appear after
          closeout is recorded.
        </p>
        <ul data-testid="chef-results-admin-forecast-staff-list">
          {state.staffForecasts.map((forecast) => (
            <li key={forecast.userId}>
              {forecast.userName}: {forecast.forecastTotalCustomers} expected customers
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <p className="kitchen-mgmt-empty" data-testid="chef-results-admin-empty">
      No forecast or service-closeout data is available for this service.
    </p>
  );
}

export function ChefResultsAdminApp() {
  const { embedded, inputCollections, inputCollectionsReady } = useGameBusEmbed();
  const fixtureDates = useMemo(() => getFixtureServiceDates(), []);
  const groupDates = useMemo(() => {
    if (!embedded || !inputCollectionsReady) return [];
    return getGroupAdminServiceDates(inputCollections);
  }, [embedded, inputCollections, inputCollectionsReady]);

  const serviceDates = embedded && inputCollectionsReady ? groupDates : fixtureDates;
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    if (serviceDates.length === 0) {
      setSelectedDate('');
      return;
    }
    setSelectedDate((current) =>
      current && serviceDates.includes(current) ? current : serviceDates[serviceDates.length - 1]!,
    );
  }, [serviceDates]);

  const resultsState = useChefResultsData(selectedDate);
  const dailyResults = resultsState.status === 'ready' ? resultsState.dailyResults : null;
  const isLoading = resultsState.status === 'pending';

  const partialState = useMemo((): AdminServicePartialState | null => {
    if (!embedded || !inputCollectionsReady || !selectedDate || dailyResults) return null;
    return resolveAdminServicePartialState(inputCollections, selectedDate);
  }, [dailyResults, embedded, inputCollections, inputCollectionsReady, selectedDate]);

  return (
    <div
      className="chef-results-page chef-results-page--admin kitchen-mgmt-page"
      data-testid="chef-results-admin-page"
    >
      <ManagementDashboardHeader
        isLoading={isLoading}
        serviceDates={serviceDates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {resultsState.status === 'ready' && selectedDate && !dailyResults && !embedded ? (
        <p className="kitchen-mgmt-empty" data-testid="chef-results-admin-empty">
          No complete forecast and service-closeout result is available for this service.
        </p>
      ) : null}

      {resultsState.status === 'ready' && selectedDate && !dailyResults && partialState ? (
        <AdminPartialServicePanel state={partialState} />
      ) : null}

      {dailyResults ? (
        <ForecastingManagementSection
          dailyResults={dailyResults}
          embedded={embedded}
          inputCollectionsReady={inputCollectionsReady}
          inputCollections={inputCollections}
        />
      ) : null}
    </div>
  );
}
