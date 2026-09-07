import { useEffect, useMemo, useState } from 'react';
import { formatServiceDateLong } from './displayFormat';
import { ActualKitchenOutcomeSection } from './components/participant/ActualKitchenOutcomeSection';
import { FixtureCurrentUserSelector } from './components/participant/FixtureCurrentUserSelector';
import { ForecastImpactSection } from './components/participant/ForecastImpactSection';
import { GameBusUserDiagnostic } from './components/participant/GameBusUserDiagnostic';
import { KitchenProgressSection } from './components/participant/KitchenProgressSection';
import { ParticipantHeader } from './components/participant/ParticipantHeader';
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
import { isChefResultsGameBusDebugMode } from '../gamebus/chefResultsInvestigation';
import { resolveChefResultsServiceDate } from '../services/operationalServiceCalendar';
import { getFixtureCurrentUserId } from './currentUserContext';
import { findParticipantDailyResult } from './participantWeekData';
import { buildParticipantProgressServicePoints } from './participantProgressData';
import {
  buildAnonymousTeamBenchmark,
  buildParticipantComparisonInsights,
} from './teamComparison';
import { useGameBusAuthenticatedUser } from './useGameBusAuthenticatedUser';
import { useChefResultsData } from './useChefResultsData';
import { useGameBusEmbed } from '../gamebus/useGameBusEmbed';

/**
 * Participant-safe results view — own identifiable data + anonymous team comparison.
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

  const progressServicePoints = useMemo(() => {
    if (!hasCurrentResult) return [];
    if (embedded && inputCollectionsReady) {
      return buildParticipantProgressServicePoints(
        currentUserId,
        resultsServiceDate,
        inputCollections,
      );
    }
    return buildParticipantProgressServicePoints(fixtureUserId, resultsServiceDate);
  }, [
    currentUserId,
    embedded,
    fixtureUserId,
    hasCurrentResult,
    inputCollections,
    inputCollectionsReady,
    resultsServiceDate,
  ]);

  const kitchenProgress = useMemo(() => {
    if (!hasCurrentResult) return EMPTY_KITCHEN_PROGRESS;
    if (embedded && inputCollectionsReady) {
      return buildParticipantKitchenProgress(inputCollections, currentUserId);
    }
    return buildFixtureKitchenProgress();
  }, [currentUserId, embedded, hasCurrentResult, inputCollections, inputCollectionsReady]);

  const teamBenchmark =
    dailyResults && dailyResults.staffResults.length > 0
      ? buildAnonymousTeamBenchmark(dailyResults.staffResults)
      : null;
  const comparisonInsights =
    ownResult && teamBenchmark
      ? buildParticipantComparisonInsights(ownResult, teamBenchmark)
      : null;

  const formattedResultsDate = formatServiceDateLong(resultsServiceDate);
  const showParticipantHeader = !isEmbeddedLoading;

  return (
    <div
      className="chef-results-page chef-results-page--participant"
      data-testid="chef-results-participant-page"
    >
      {!embedded ? <FixtureCurrentUserSelector /> : null}

      <header className="chef-results-dashboard-intro" data-testid="participant-dashboard-intro">
        <h1 className="chef-results-dashboard-intro__title">Kitchen Staff Dashboard</h1>
        <p className="chef-results-dashboard-intro__body">
          After each service is closed, this dashboard compares your forecast with the actual kitchen
          outcome for the same service date. You can see the real kitchen overproduction, what your
          forecast would have produced, and how your result compares anonymously with other
          participating staff.
        </p>
        <p className="chef-results-dashboard-intro__note">
          Results appear only when both your forecast and the service closeout are available.
        </p>
      </header>

      {isEmbeddedLoading ? (
        <p className="chef-results-empty" data-testid="chef-results-pending">
          Loading kitchen results…
        </p>
      ) : null}

      {showParticipantHeader ? <ParticipantHeader serviceDate={resultsServiceDate} /> : null}

      {!isEmbeddedLoading && resultsState.status === 'ready' && !hasCloseout ? (
        <div className="chef-results-empty-state" data-testid="participant-results-unavailable-closeout">
          <p className="chef-results-empty-state__title">
            Results are not available yet for {formattedResultsDate}.
          </p>
          <p className="chef-results-empty-state__body">
            Results appear after this service has been closed.
          </p>
        </div>
      ) : null}

      {!isEmbeddedLoading && resultsState.status === 'ready' && hasCloseout && !ownResult ? (
        <div className="chef-results-empty-state" data-testid="participant-no-forecast-result">
          <p className="chef-results-empty-state__title">
            No forecast result for {formattedResultsDate}.
          </p>
          <p className="chef-results-empty-state__body">
            You did not submit a valid forecast for this service date.
          </p>
        </div>
      ) : null}

      {hasCurrentResult && dailyResults && ownResult ? (
        <>
          <ActualKitchenOutcomeSection observed={dailyResults.observed} />
          <ForecastImpactSection result={ownResult} />
          {teamBenchmark && comparisonInsights ? (
            <TeamComparisonSection
              participant={ownResult}
              benchmark={teamBenchmark}
              insights={comparisonInsights}
            />
          ) : null}
        </>
      ) : null}

      {hasCurrentResult ? (
        <ParticipantProgressSection
          servicePoints={progressServicePoints}
          asOfServiceDate={resultsServiceDate}
        />
      ) : null}
      {hasCurrentResult ? <KitchenProgressSection progress={kitchenProgress} /> : null}

      {isChefResultsGameBusDebugMode() ? (
        <details className="chef-results-debug-panel" data-testid="chef-results-debug-panel">
          <summary>GameBus debug</summary>
          <GameBusUserDiagnostic
            selectedDate={resultsServiceDate}
            currentUserId={currentUserId}
            hasOwnResult={ownResult !== null}
          />
        </details>
      ) : null}
    </div>
  );
}
