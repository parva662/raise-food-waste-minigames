import { useEffect, useMemo, useState } from 'react';
import { DashboardHeader, type DashboardStatus } from './components/participant/DashboardHeader';
import { FixtureCurrentUserSelector } from './components/participant/FixtureCurrentUserSelector';
import { ParticipantOverviewSection } from './components/participant/ParticipantOverviewSection';
import { ParticipantProgressSection } from './components/participant/ParticipantProgressSection';
import { ParticipantTabNav, type ParticipantPrimaryTab } from './components/participant/ParticipantTabNav';
import {
  buildFixtureChefForecastsForCalculation,
  buildFixtureKitchenProgress,
  hasFixtureCloseoutForDate,
} from './adapters/fixtureCalculationSource';
import {
  buildGroupCloseoutOnlyResults,
  buildParticipantKitchenProgress,
  getParticipantEligibleForecastForDate,
  hasGroupCloseoutForDate,
} from './adapters/groupCalculationSource';
import {
  isOperationalServiceDay,
  msUntilNextHelsinkiMidnight,
  resolveChefResultsServiceDate,
} from '../services/operationalServiceCalendar';
import { getFixtureCurrentUserId } from './currentUserContext';
import { findParticipantDailyResult } from './participantWeekData';
import { buildParticipantProgressServicePoints } from './participantProgressData';
import {
  buildAnonymousPeerBenchmark,
  buildParticipantPeerComparisonInsights,
} from './teamComparison';
import { useGameBusAuthenticatedUser } from './useGameBusAuthenticatedUser';
import { useChefResultsData } from './useChefResultsData';
import { useGameBusEmbed } from '../gamebus/useGameBusEmbed';
import type { DailyServiceResults } from './types';

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
export function ChefResultsParticipantApp() {
  const { embedded, inputCollections, inputCollectionsReady } = useGameBusEmbed();
  const { user: authenticatedUser } = useGameBusAuthenticatedUser();
  const isEmbeddedLoading = embedded && !inputCollectionsReady;
  const fixtureUserId = getFixtureCurrentUserId();
  const currentUserId = embedded ? authenticatedUser?.id ?? '' : fixtureUserId;

  const now = useHelsinkiDashboardClock();
  const resultsServiceDate = useMemo(() => resolveChefResultsServiceDate(now), [now]);
  const isServiceDay = useMemo(
    () => isOperationalServiceDay(resultsServiceDate),
    [resultsServiceDate],
  );
  const [primaryTab, setPrimaryTab] = useState<ParticipantPrimaryTab>('overview');

  const canLoadParticipantData = !isEmbeddedLoading && (!embedded || inputCollectionsReady);
  const canLoadProgress = canLoadParticipantData && Boolean(currentUserId || !embedded);

  const resultsState = useChefResultsData(isServiceDay ? resultsServiceDate : '');
  const completeDailyResults =
    isServiceDay && resultsState.status === 'ready' ? resultsState.dailyResults : null;

  const hasCloseout = useMemo(() => {
    if (!isServiceDay || isEmbeddedLoading) return false;
    if (embedded && inputCollectionsReady) {
      return hasGroupCloseoutForDate(inputCollections, resultsServiceDate);
    }
    return hasFixtureCloseoutForDate(resultsServiceDate);
  }, [
    embedded,
    inputCollections,
    inputCollectionsReady,
    isEmbeddedLoading,
    isServiceDay,
    resultsServiceDate,
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
  ]);

  const progressServicePoints = useMemo(() => {
    if (!canLoadProgress) return [];
    if (embedded && inputCollectionsReady) {
      return buildParticipantProgressServicePoints(
        currentUserId,
        resultsServiceDate,
        inputCollections,
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
    resultsServiceDate,
  ]);

  const kitchenProgress = useMemo(() => {
    if (!canLoadProgress) return null;
    if (embedded && inputCollectionsReady) {
      return buildParticipantKitchenProgress(inputCollections, currentUserId);
    }
    return buildFixtureKitchenProgress();
  }, [canLoadProgress, currentUserId, embedded, inputCollections, inputCollectionsReady]);

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
              />
            );
          }}
        </ParticipantTabNav>
      ) : null}
    </div>
  );
}
