import { useEffect, useMemo, useState } from 'react';
import { formatServiceDateShort } from './displayFormat';
import { ActualKitchenOutcomeSection } from './components/participant/ActualKitchenOutcomeSection';
import { FixtureCurrentUserSelector } from './components/participant/FixtureCurrentUserSelector';
import { ForecastImpactSection } from './components/participant/ForecastImpactSection';
import { GameBusUserDiagnostic } from './components/participant/GameBusUserDiagnostic';
import { KitchenProgressSection } from './components/participant/KitchenProgressSection';
import { ParticipantHeader } from './components/participant/ParticipantHeader';
import { TeamComparisonSection } from './components/participant/TeamComparisonSection';
import { YourWeekSection } from './components/participant/YourWeekSection';
import { buildFixtureKitchenProgress } from './adapters/fixtureCalculationSource';
import {
  buildParticipantKitchenProgress,
  EMPTY_KITCHEN_PROGRESS,
  getParticipantGroupResultServiceDates,
} from './adapters/groupCalculationSource';
import { isChefResultsGameBusDebugMode } from '../gamebus/chefResultsInvestigation';
import { getFixtureCurrentUserId } from './currentUserContext';
import {
  buildParticipantWeekSummary,
  EMPTY_PARTICIPANT_WEEK_SUMMARY,
  findParticipantDailyResult,
} from './participantWeekData';
import { getParticipantResultServiceDates } from './participantResultDates';
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

  const serviceDates = useMemo(() => {
    if (isEmbeddedLoading) return [];
    if (embedded && inputCollectionsReady) {
      return getParticipantGroupResultServiceDates(inputCollections, currentUserId);
    }
    return getParticipantResultServiceDates(fixtureUserId);
  }, [embedded, fixtureUserId, inputCollections, inputCollectionsReady, isEmbeddedLoading, currentUserId]);

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
  const ownResult = isEmbeddedLoading
    ? null
    : findParticipantDailyResult(currentUserId, selectedDate, dailyResults);
  const hasParticipantResults = serviceDates.length > 0;

  const weekSummary = useMemo(() => {
    if (isEmbeddedLoading || !hasParticipantResults) return EMPTY_PARTICIPANT_WEEK_SUMMARY;
    if (embedded && inputCollectionsReady) {
      return buildParticipantWeekSummary(currentUserId, inputCollections);
    }
    return buildParticipantWeekSummary(fixtureUserId);
  }, [
    currentUserId,
    embedded,
    fixtureUserId,
    hasParticipantResults,
    inputCollections,
    inputCollectionsReady,
    isEmbeddedLoading,
  ]);

  const kitchenProgress = useMemo(() => {
    if (isEmbeddedLoading || !hasParticipantResults) return EMPTY_KITCHEN_PROGRESS;
    if (embedded && inputCollectionsReady) {
      return buildParticipantKitchenProgress(inputCollections, currentUserId);
    }
    return buildFixtureKitchenProgress();
  }, [
    currentUserId,
    embedded,
    hasParticipantResults,
    inputCollections,
    inputCollectionsReady,
    isEmbeddedLoading,
  ]);

  const teamBenchmark =
    dailyResults && dailyResults.staffResults.length > 0
      ? buildAnonymousTeamBenchmark(dailyResults.staffResults)
      : null;
  const comparisonInsights =
    ownResult && teamBenchmark
      ? buildParticipantComparisonInsights(ownResult, teamBenchmark)
      : null;
  const showResultContent = !isEmbeddedLoading && resultsState.status === 'ready' && hasParticipantResults;
  const showEmptyState = !isEmbeddedLoading && embedded && !hasParticipantResults;

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

      {showEmptyState ? (
        <div className="chef-results-empty-state" data-testid="participant-no-completed-results">
          <p className="chef-results-empty-state__title">No completed forecast results yet.</p>
          <p className="chef-results-empty-state__body">
            Your result will appear after the service you forecast has been closed.
          </p>
        </div>
      ) : null}

      {hasParticipantResults ? (
        <div className="chef-results-toolbar">
          <label className="chef-results-date-picker">
            <span>Service date</span>
            <select
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              data-testid="chef-results-date-select"
            >
              {serviceDates.map((date) => (
                <option key={date} value={date}>
                  {formatServiceDateShort(date)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {selectedDate && hasParticipantResults ? (
        <ParticipantHeader serviceDate={selectedDate} />
      ) : null}

      {showResultContent && !dailyResults ? (
        <p className="chef-results-empty" data-testid="chef-results-unavailable">
          Results are not available yet for this service date.
        </p>
      ) : null}

      {showResultContent && ownResult && dailyResults ? (
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

      {hasParticipantResults ? <YourWeekSection week={weekSummary} /> : null}
      {hasParticipantResults ? <KitchenProgressSection progress={kitchenProgress} /> : null}

      {isChefResultsGameBusDebugMode() ? (
        <details className="chef-results-debug-panel" data-testid="chef-results-debug-panel">
          <summary>GameBus debug</summary>
          <GameBusUserDiagnostic
            selectedDate={selectedDate}
            currentUserId={currentUserId}
            hasOwnResult={ownResult !== null}
          />
        </details>
      ) : null}
    </div>
  );
}
