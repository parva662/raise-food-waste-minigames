import { useEffect, useMemo, useState } from 'react';
import { CurrentServiceSection } from './components/participant/CurrentServiceSection';
import { DashboardHeader, type DashboardStatus } from './components/participant/DashboardHeader';
import { FixtureCurrentUserSelector } from './components/participant/FixtureCurrentUserSelector';
import { ForecastImpactSection } from './components/participant/ForecastImpactSection';
import { ActualKitchenOutcomeSection } from './components/participant/ActualKitchenOutcomeSection';
import { KitchenProgressSection } from './components/participant/KitchenProgressSection';
import { TeamComparisonSection } from './components/participant/TeamComparisonSection';
import { ParticipantProgressSection } from './components/participant/ParticipantProgressSection';
import {
  buildFixtureKitchenProgress,
  hasFixtureCloseoutForDate,
} from './adapters/fixtureCalculationSource';
import {
  buildParticipantKitchenProgress,
  EMPTY_KITCHEN_PROGRESS,
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

/**
 * Participant-safe results view — own identifiable data + anonymous peer comparison.
 * Route: #/chef-results (GameBus participant menu target).
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

  const resultsState = useChefResultsData(resultsServiceDate);
  const dailyResults = resultsState.status === 'ready' ? resultsState.dailyResults : null;
  const ownResult = isEmbeddedLoading
    ? null
    : findParticipantDailyResult(currentUserId, resultsServiceDate, dailyResults);

  const hasCloseout = useMemo(() => {
    if (isEmbeddedLoading) return false;
    if (embedded && inputCollectionsReady) {
      return hasGroupCloseoutForDate(inputCollections, resultsServiceDate);
    }
    return hasFixtureCloseoutForDate(resultsServiceDate);
  }, [embedded, inputCollections, inputCollectionsReady, isEmbeddedLoading, resultsServiceDate]);

  const hasCurrentResult = !isEmbeddedLoading && resultsState.status === 'ready' && ownResult !== null;

  const canLoadParticipantData = !isEmbeddedLoading && (!embedded || inputCollectionsReady);
  const canLoadProgress = canLoadParticipantData && Boolean(currentUserId || !embedded);

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
    if (!canLoadProgress) return EMPTY_KITCHEN_PROGRESS;
    if (embedded && inputCollectionsReady) {
      return buildParticipantKitchenProgress(inputCollections, currentUserId);
    }
    return buildFixtureKitchenProgress();
  }, [canLoadProgress, currentUserId, embedded, inputCollections, inputCollectionsReady]);

  const peerBenchmark =
    dailyResults && ownResult
      ? buildAnonymousPeerBenchmark(dailyResults.staffResults, currentUserId)
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
      className="chef-results-page chef-results-page--participant"
      data-testid="chef-results-participant-page"
    >
      {!embedded ? <FixtureCurrentUserSelector /> : null}

      <DashboardHeader serviceDate={resultsServiceDate} status={dashboardStatus} />

      {isEmbeddedLoading ? (
        <p className="chef-results-empty" data-testid="chef-results-pending">
          Loading kitchen results…
        </p>
      ) : null}

      {!isEmbeddedLoading ? (
        <CurrentServiceSection>
          {resultsState.status === 'ready' && !hasCloseout ? (
            <div className="chef-results-empty-state" data-testid="participant-results-unavailable-closeout">
              <p className="chef-results-empty-state__title">Waiting for service closeout</p>
              <p className="chef-results-empty-state__body">
                Results for this service date will appear after the kitchen closeout is recorded.
              </p>
            </div>
          ) : null}

          {resultsState.status === 'ready' && hasCloseout && !ownResult ? (
            <div className="chef-results-empty-state" data-testid="participant-no-forecast-result">
              <p className="chef-results-empty-state__title">No forecast for this service</p>
              <p className="chef-results-empty-state__body">
                You did not submit a valid forecast for this service date.
              </p>
            </div>
          ) : null}

          {hasCurrentResult && dailyResults && ownResult ? (
            <>
              <ActualKitchenOutcomeSection observed={dailyResults.observed} />
              <ForecastImpactSection result={ownResult} observed={dailyResults.observed} />
            </>
          ) : null}
        </CurrentServiceSection>
      ) : null}

      {hasCurrentResult && dailyResults && ownResult && peerBenchmark && peerInsights ? (
        <TeamComparisonSection
          participant={ownResult}
          benchmark={peerBenchmark}
          insights={peerInsights}
        />
      ) : null}

      {canLoadProgress ? (
        <ParticipantProgressSection
          servicePoints={progressServicePoints}
          asOfServiceDate={resultsServiceDate}
        />
      ) : null}

      {canLoadProgress ? <KitchenProgressSection progress={kitchenProgress} /> : null}
    </div>
  );
}
