import { useEffect, useMemo, useState } from 'react';
import {
  getGroupAdminServiceDates,
  resolveAdminServicePartialState,
} from '@/products/forecast-results/adapters/groupCalculationSource';
import { getFixtureServiceDates } from '@/products/forecast-results/adapters/fixtureCalculationSource';
import {
  adminServiceViewFromPartial,
} from '@/products/forecast-results/admin/adminServiceView';
import {
  buildAdminHistoryRowsFromFixtures,
  buildAdminHistoryRowsFromGroup,
} from '@/products/forecast-results/admin/buildAdminHistoryRows';
import { ForecastingManagementSection } from '@/products/forecast-results/admin/components/ForecastingManagementSection';
import { ManagementAreaNav, type ManagementAreaTab } from '@/products/forecast-results/admin/components/ManagementAreaNav';
import { ManagementDashboardHeader } from '@/products/forecast-results/admin/components/ManagementDashboardHeader';
import { KitchenSkillsManagementSection } from '@/products/forecast-results/admin/skills/KitchenSkillsManagementSection';
import {
  buildKitchenSkillsManagementSummary,
  type KitchenSkillsManagementDataState,
} from '@/products/forecast-results/admin/skills/buildKitchenSkillsManagementSummary';
import { useForecastResultsData } from '@/products/forecast-results/useForecastResultsData';
import { useGameBusEmbed } from '@/platform/gamebus/useGameBusEmbed';
import {
  extractGroupActivities,
  getRawKitchenSkillsTrainerActivitiesInput,
  summarizeKitchenSkillsTrainerInput,
} from '@/platform/gamebus/groupActivities';

/**
 * Kitchen Management Dashboard — unified Forecast & Service + Kitchen Skills.
 * Route: #/chef-results-admin (hidden from participant navigation).
 *
 * Authorization: route-level checks are not implemented in this frontend. Identifiable
 * group data must be supplied only through GameBus-authorized Input Collections.
 * Hiding the React route is not sufficient production authorization.
 */
export function ForecastResultsAdminApp() {
  const { embedded, inputCollections, inputCollectionsReady } = useGameBusEmbed();
  const fixtureDates = useMemo(() => getFixtureServiceDates(), []);
  const groupDates = useMemo(() => {
    if (!embedded || !inputCollectionsReady) return [];
    return getGroupAdminServiceDates(inputCollections);
  }, [embedded, inputCollections, inputCollectionsReady]);

  const serviceDates = embedded && inputCollectionsReady ? groupDates : fixtureDates;
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeArea, setActiveArea] = useState<ManagementAreaTab>('forecast');

  useEffect(() => {
    if (serviceDates.length === 0) {
      setSelectedDate('');
      return;
    }
    setSelectedDate((current) =>
      current && serviceDates.includes(current) ? current : serviceDates[serviceDates.length - 1]!,
    );
  }, [serviceDates]);

  const resultsState = useForecastResultsData(selectedDate);
  const dailyResults = resultsState.status === 'ready' ? resultsState.dailyResults : null;
  const isLoading = resultsState.status === 'pending';

  const partialState = useMemo(() => {
    if (!embedded || !inputCollectionsReady || !selectedDate) return null;
    return resolveAdminServicePartialState(inputCollections, selectedDate);
  }, [embedded, inputCollections, inputCollectionsReady, selectedDate]);

  const serviceView = useMemo(() => {
    if (!embedded) {
      if (!selectedDate) return adminServiceViewFromPartial('', null, null);
      return adminServiceViewFromPartial(selectedDate, null, dailyResults);
    }
    if (!inputCollectionsReady) {
      return adminServiceViewFromPartial(selectedDate, null, null);
    }
    return adminServiceViewFromPartial(selectedDate, partialState, dailyResults);
  }, [dailyResults, embedded, inputCollectionsReady, partialState, selectedDate]);

  const historyRows = useMemo(() => {
    if (!embedded) return buildAdminHistoryRowsFromFixtures(fixtureDates);
    if (!inputCollectionsReady) return [];
    return buildAdminHistoryRowsFromGroup(inputCollections, groupDates);
  }, [embedded, fixtureDates, groupDates, inputCollections, inputCollectionsReady]);

  const skillsData = useMemo((): KitchenSkillsManagementDataState => {
    if (!embedded) return { status: 'standalone' };
    if (!inputCollectionsReady) return { status: 'pending' };
    const summary = summarizeKitchenSkillsTrainerInput(inputCollections);
    if (!summary.collectionPresent) return { status: 'unavailable' };
    const raw = getRawKitchenSkillsTrainerActivitiesInput(inputCollections);
    const activities = extractGroupActivities(raw);
    return buildKitchenSkillsManagementSummary(activities);
  }, [embedded, inputCollections, inputCollectionsReady]);

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
        showServiceDateSelector={activeArea === 'forecast'}
      />

      {!isLoading ? (
        <ManagementAreaNav activeArea={activeArea} onAreaChange={setActiveArea}>
          {(area) => {
            if (area === 'skills') {
              return <KitchenSkillsManagementSection data={skillsData} />;
            }
            return (
              <ForecastingManagementSection
                view={serviceView}
                historyRows={historyRows}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                embedded={embedded}
                inputCollectionsReady={inputCollectionsReady}
                inputCollections={inputCollections}
              />
            );
          }}
        </ManagementAreaNav>
      ) : null}
    </div>
  );
}
