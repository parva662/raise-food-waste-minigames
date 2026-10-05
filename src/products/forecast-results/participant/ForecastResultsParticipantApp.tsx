import { useEffect, useMemo, useState } from 'react';
import { DashboardHeader, type DashboardStatus } from '@/products/forecast-results/participant/components/DashboardHeader';
import { FixtureCurrentUserSelector } from '@/products/forecast-results/participant/components/FixtureCurrentUserSelector';
import { ParticipantOverviewSection } from '@/products/forecast-results/participant/components/ParticipantOverviewSection';
import { ParticipantProgressSection } from '@/products/forecast-results/participant/components/ParticipantProgressSection';
import { ParticipantTabNav, type ParticipantPrimaryTab } from '@/products/forecast-results/participant/components/ParticipantTabNav';
import {
  buildFixtureChefForecastsForCalculation,
  buildFixtureKitchenProgress,
  hasFixtureCloseoutForDate,
} from '@/products/forecast-results/adapters/fixtureCalculationSource';
import {
  anonymousTeamAverageOverproductionForDay,
  buildGroupCloseoutOnlyResults,
  buildParticipantKitchenProgress,
  createGroupKitchenCalculationCache,
  getParticipantEligibleForecastForDate,
  hasGroupCloseoutForDate,
  type GroupKitchenCalculationCache,
} from '@/products/forecast-results/adapters/groupCalculationSource';
import {
  isOperationalServiceDay,
  msUntilNextHelsinkiMidnight,
  resolveForecastResultsServiceDate,
} from '@/shared/calendar/operationalServiceCalendar';
import { getFixtureCurrentUserId } from '@/products/forecast-results/currentUserContext';
import { findParticipantDailyResult } from '@/products/forecast-results/calculations/participantWeekData';
import { buildParticipantProgressServicePoints } from '@/products/forecast-results/calculations/participantProgressData';
import {
  buildAnonymousPeerBenchmark,
  buildParticipantPeerComparisonInsights,
} from '@/products/forecast-results/calculations/teamComparison';
import { useGameBusAuthenticatedUser } from '@/products/forecast-results/useGameBusAuthenticatedUser';
import { useForecastResultsData } from '@/products/forecast-results/useForecastResultsData';
import { useGameBusEmbed } from '@/platform/gamebus/useGameBusEmbed';
import type { DailyServiceResults } from '@/products/forecast-results/types';

/**
 * Keep the participant dashboard clock aligned to Europe/Helsinki midnight without
 * relying on a fixed 24h timer (DST-safe) or waiting for a full page reload.
 */
function useHelsinkiDashboardClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let midnightTimeoutId: number | undefined;
    let cancelled = false;

    const refresh = () => {
      if (cancelled) return;
      setNow(new Date());
    };

    const scheduleMidnight = () => {
      if (midnightTimeoutId !== undefined) {
        window.clearTimeout(midnightTimeoutId);
      }
      const delayMs = Math.max(msUntilNextHelsinkiMidnight(new Date()) + 1, 25);
      midnightTimeoutId = window.setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, delayMs);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
        scheduleMidnight();
      }
    };

    scheduleMidnight();
    // Safety net when browsers throttle background timers.
    const intervalId = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      if (midnightTimeoutId !== undefined) {
        window.clearTimeout(midnightTimeoutId);
      }
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return now;
}

/**
 * Participant-safe results view — own identifiable data + other-staff comparison.
 * Route: #/chef-results (GameBus participant menu target).
 *
 * Dashboard date = current Europe/Helsinki calendar day (midnight rollover).
 * Historical Progress is independent of the current service waiting/no-forecast state.
 */
export function ForecastResultsParticipantApp() {
  const { embedded, inputCollections, inputCollectionsReady } = useGameBusEmbed();
  const { user: authenticatedUser } = useGameBusAuthenticatedUser();
  const isEmbeddedLoading = embedded && !inputCollectionsReady;
  const fixtureUserId = getFixtureCurrentUserId();
  const currentUserId = embedded ? authenticatedUser?.id ?? '' : fixtureUserId;

  const now = useHelsinkiDashboardClock();
  const resultsServiceDate = useMemo(() => resolveForecastResultsServiceDate(now), [now]);
  const isServiceDay = useMemo(
    () => isOperationalServiceDay(resultsServiceDate),
    [resultsServiceDate],
  );
  const [primaryTab, setPrimaryTab] = useState<ParticipantPrimaryTab>('overview');

  const canLoadParticipantData = !isEmbeddedLoading && (!embedded || inputCollectionsReady);
  const canLoadProgress = canLoadParticipantData && Boolean(currentUserId || !embedded);

  const kitchenCalculationCache = useMemo((): GroupKitchenCalculationCache | null => {
    if (!embedded || !inputCollectionsReady) return null;
    return createGroupKitchenCalculationCache(inputCollections);
  }, [embedded, inputCollections, inputCollectionsReady]);

  const resultsState = useForecastResultsData(isServiceDay ? resultsServiceDate : '');
  const completeDailyResults =
    isServiceDay && resultsState.status === 'ready' ? resultsState.dailyResults : null;

  const hasCloseout = useMemo(() => {
    if (!isServiceDay || isEmbeddedLoading) return false;
    if (embedded && inputCollectionsReady) {
      return hasGroupCloseoutForDate(inputCollections, resultsServiceDate, kitchenCalculationCache);
    }
    return hasFixtureCloseoutForDate(resultsServiceDate);
  }, [
    embedded,
    inputCollections,
    inputCollectionsReady,
    isEmbeddedLoading,
    isServiceDay,
    resultsServiceDate,
    kitchenCalculationCache,
  ]);

  const closeoutOnlyResults = useMemo((): DailyServiceResults | null => {
    if (!isServiceDay || !canLoadParticipantData || completeDailyResults || !hasCloseout) {
      return null;
    }
    if (embedded && inputCollectionsReady) {
      return buildGroupCloseoutOnlyResults(inputCollections, resultsServiceDate);
    }
    return null;
  }, [
    canLoadParticipantData,
    completeDailyResults,
    embedded,
    hasCloseout,
    inputCollections,
    inputCollectionsReady,
    isServiceDay,
    resultsServiceDate,
  ]);

  const dailyResults = completeDailyResults ?? closeoutOnlyResults;
  const ownResult =
    !isServiceDay || isEmbeddedLoading
      ? null
      : findParticipantDailyResult(currentUserId, resultsServiceDate, completeDailyResults);

  const hasCurrentResult =
    isServiceDay && !isEmbeddedLoading && completeDailyResults !== null && ownResult !== null;

  const pendingForecast = useMemo(() => {
    if (!isServiceDay || !canLoadParticipantData || hasCloseout || hasCurrentResult) return null;
    if (embedded && inputCollectionsReady) {
      return getParticipantEligibleForecastForDate(
        inputCollections,
        currentUserId,
        resultsServiceDate,
        kitchenCalculationCache,
      );
    }
    return (
      buildFixtureChefForecastsForCalculation().find(
        (forecast) =>
          forecast.userId === fixtureUserId && forecast.targetDate === resultsServiceDate,
      ) ?? null
    );
  }, [
    canLoadParticipantData,
    currentUserId,
    embedded,
    fixtureUserId,
    hasCloseout,
    hasCurrentResult,
    inputCollections,
    inputCollectionsReady,
    isServiceDay,
    resultsServiceDate,
    kitchenCalculationCache,
  ]);

  const progressServicePoints = useMemo(() => {
    if (!canLoadProgress) return [];
    if (embedded && inputCollectionsReady) {
      return buildParticipantProgressServicePoints(
        currentUserId,
        resultsServiceDate,
        inputCollections,
        kitchenCalculationCache,
      );
    }
    return buildParticipantProgressServicePoints(fixtureUserId, resultsServiceDate);
  }, [
    canLoadProgress,
    currentUserId,
    embedded,
    fixtureUserId,
    inputCollections,
    inputCollectionsReady,
    kitchenCalculationCache,
    resultsServiceDate,
  ]);

  const teamSurplusGramsByDate = useMemo(() => {
    const map = new Map<string, number>();
    if (!kitchenCalculationCache || !currentUserId) return map;
    for (const date of kitchenCalculationCache.getParticipantResultServiceDates(currentUserId)) {
      const daily = kitchenCalculationCache.getDailyServiceResults(date);
      if (daily) {
        map.set(date, anonymousTeamAverageOverproductionForDay(daily));
      }
    }
    return map;
  }, [currentUserId, kitchenCalculationCache]);

  const kitchenProgress = useMemo(() => {
    if (!canLoadProgress) return null;
    if (embedded && inputCollectionsReady) {
      return buildParticipantKitchenProgress(inputCollections, currentUserId, {
        asOfServiceDate: resultsServiceDate,
        cache: kitchenCalculationCache,
      });
    }
    return buildFixtureKitchenProgress(resultsServiceDate);
  }, [
    canLoadProgress,
    currentUserId,
    embedded,
    inputCollections,
    inputCollectionsReady,
    kitchenCalculationCache,
    resultsServiceDate,
  ]);

  const peerBenchmark =
    completeDailyResults && ownResult
      ? buildAnonymousPeerBenchmark(completeDailyResults.staffResults, currentUserId)
      : null;
  const peerInsights =
    ownResult && peerBenchmark
      ? buildParticipantPeerComparisonInsights(ownResult, peerBenchmark)
      : null;

  const dashboardStatus: DashboardStatus = isEmbeddedLoading
    ? 'loading'
    : !isServiceDay
      ? 'no-service'
      : hasCurrentResult
        ? 'result-ready'
        : hasCloseout
          ? 'no-forecast'
          : 'waiting-closeout';

  return (
    <div
      className="chef-results-page chef-results-page--participant kitchen-mgmt-page"
      data-testid="chef-results-participant-page"
    >
      {!embedded ? <FixtureCurrentUserSelector /> : null}

      <DashboardHeader serviceDate={resultsServiceDate} status={dashboardStatus} />

      {isEmbeddedLoading ? (
        <p className="kitchen-mgmt-empty" data-testid="chef-results-pending">
          Loading kitchen results…
        </p>
      ) : null}

      {!isEmbeddedLoading ? (
        <ParticipantTabNav activeTab={primaryTab} onTabChange={setPrimaryTab}>
          {(tab) => {
            if (tab === 'overview') {
              return (
                <ParticipantOverviewSection
                  resultsReady={isServiceDay && resultsState.status === 'ready'}
                  hasCloseout={hasCloseout}
                  isServiceDay={isServiceDay}
                  ownResult={ownResult}
                  dailyResults={dailyResults}
                  pendingForecast={pendingForecast}
                  peerBenchmark={peerBenchmark}
                  peerInsights={peerInsights}
                />
              );
            }
            return (
              <ParticipantProgressSection
                servicePoints={progressServicePoints}
                asOfServiceDate={resultsServiceDate}
                kitchenProgress={canLoadProgress ? kitchenProgress : null}
                teamSurplusGramsByDate={teamSurplusGramsByDate}
              />
            );
          }}
        </ParticipantTabNav>
      ) : null}
    </div>
  );
}
