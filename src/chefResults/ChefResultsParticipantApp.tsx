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
import { resolveChefResultsServiceDate } from '../services/operationalServiceCalendar';
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
 * Participant-safe results view — own identifiable data + other-staff comparison.
 * Route: #/chef-results (GameBus participant menu target).
 *
 * Historical Progress is independent of the current service waiting/no-forecast state.
 */
export function ChefResultsParticipantApp() {
  const { embedded, inputCollections, inputCollectionsReady } = useGameBusEmbed();
  const { user: authenticatedUser } = useGameBusAuthenticatedUser();
  const isEmbeddedLoading = embedded && !inputCollectionsReady;
  const fixtureUserId = getFixtureCurrentUserId();
  const currentUserId = embedded ? authenticatedUser?.id ?? '' : fixtureUserId;

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const resultsServiceDate = useMemo(() => resolveChefResultsServiceDate(now), [now]);
  const [primaryTab, setPrimaryTab] = useState<ParticipantPrimaryTab>('overview');

  const canLoadParticipantData = !isEmbeddedLoading && (!embedded || inputCollectionsReady);
  const canLoadProgress = canLoadParticipantData && Boolean(currentUserId || !embedded);

  const resultsState = useChefResultsData(resultsServiceDate);
  const completeDailyResults = resultsState.status === 'ready' ? resultsState.dailyResults : null;

  const hasCloseout = useMemo(() => {
    if (isEmbeddedLoading) return false;
    if (embedded && inputCollectionsReady) {
      return hasGroupCloseoutForDate(inputCollections, resultsServiceDate);
    }
    return hasFixtureCloseoutForDate(resultsServiceDate);
  }, [embedded, inputCollections, inputCollectionsReady, isEmbeddedLoading, resultsServiceDate]);

  const closeoutOnlyResults = useMemo((): DailyServiceResults | null => {
    if (!canLoadParticipantData || completeDailyResults || !hasCloseout) return null;
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
    resultsServiceDate,
  ]);

  const dailyResults = completeDailyResults ?? closeoutOnlyResults;
  const ownResult = isEmbeddedLoading
    ? null
    : findParticipantDailyResult(currentUserId, resultsServiceDate, completeDailyResults);

  const hasCurrentResult = !isEmbeddedLoading && completeDailyResults !== null && ownResult !== null;

  const pendingForecast = useMemo(() => {
    if (!canLoadParticipantData || hasCloseout || hasCurrentResult) return null;
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
                  resultsReady={resultsState.status === 'ready'}
                  hasCloseout={hasCloseout}
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
