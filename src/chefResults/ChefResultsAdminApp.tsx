import { useEffect, useMemo, useState } from 'react';
import { getGroupResultServiceDates } from './adapters/groupCalculationSource';
import { getFixtureServiceDates } from './adapters/fixtureCalculationSource';
import { ForecastingManagementSection } from './components/management/ForecastingManagementSection';
import { ManagementDashboardHeader } from './components/management/ManagementDashboardHeader';
import { ServiceDateSelector } from './components/management/ServiceDateSelector';
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
export function ChefResultsAdminApp() {
  const { embedded, inputCollections, inputCollectionsReady } = useGameBusEmbed();
  const fixtureDates = useMemo(() => getFixtureServiceDates(), []);
  const groupDates = useMemo(() => {
    if (!embedded || !inputCollectionsReady) return [];
    return getGroupResultServiceDates(inputCollections);
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

  return (
    <div
      className="chef-results-page chef-results-page--admin kitchen-mgmt-page"
      data-testid="chef-results-admin-page"
    >
      <ManagementDashboardHeader isLoading={isLoading} />

      {!isLoading ? (
        <ServiceDateSelector
          serviceDates={serviceDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      ) : null}

      {resultsState.status === 'ready' && selectedDate && !dailyResults ? (
        <p className="kitchen-mgmt-empty" data-testid="chef-results-admin-empty">
          No complete forecast and service-closeout result is available for this service.
        </p>
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
