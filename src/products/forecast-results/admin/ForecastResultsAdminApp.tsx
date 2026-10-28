import { useEffect, useMemo, useRef, useState } from 'react';
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
import { resolveDefaultAdminServiceDate } from '@/products/forecast-results/admin/resolveDefaultAdminServiceDate';
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
import { useHelsinkiDashboardClock } from '@/shared/calendar/useHelsinkiDashboardClock';
import { getOperationalDateIso } from '@/shared/time/dates';

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
  const now = useHelsinkiDashboardClock();
  const todayIso = useMemo(() => getOperationalDateIso(now), [now]);
  const fixtureDates = useMemo(() => getFixtureServiceDates(), []);
  const groupDates = useMemo(() => {
    if (!embedded || !inputCollectionsReady) return [];
    return getGroupAdminServiceDates(inputCollections);
  }, [embedded, inputCollections, inputCollectionsReady]);

  const serviceDates = embedded && inputCollectionsReady ? groupDates : fixtureDates;
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeArea, setActiveArea] = useState<ManagementAreaTab>('forecast');
  const [selectedDateIsUpcoming, setSelectedDateIsUpcoming] = useState(false);
  const manualDateRef = useRef<string | null>(null);

  useEffect(() => {
    if (serviceDates.length === 0) {
      setSelectedDate('');
      setSelectedDateIsUpcoming(false);
      return;
    }

    const manual = manualDateRef.current;
    if (manual && serviceDates.includes(manual)) {
      setSelectedDate(manual);
      setSelectedDateIsUpcoming(manual > todayIso);
      return;
    }

    setSelectedDate((current) => {
      if (current && serviceDates.includes(current)) return current;
      return resolveDefaultAdminServiceDate(serviceDates, todayIso)?.date ?? '';
    });
  }, [serviceDates, todayIso]);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDateIsUpcoming(false);
      return;
    }
    setSelectedDateIsUpcoming(selectedDate > todayIso);
  }, [selectedDate, todayIso]);

  const handleSelectDate = (date: string) => {
    manualDateRef.current = date;
    setSelectedDate(date);
    setSelectedDateIsUpcoming(date > todayIso);
  };

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
        onSelectDate={handleSelectDate}
        showServiceDateSelector={activeArea === 'forecast'}
        selectedDateIsUpcoming={selectedDateIsUpcoming}
        todayIso={todayIso}
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
                onSelectDate={handleSelectDate}
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
