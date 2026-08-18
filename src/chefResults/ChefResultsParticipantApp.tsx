import { useEffect, useMemo, useState } from 'react';
import { formatServiceDateShort } from './displayFormat';
import { CategoryDetailPanel } from './components/participant/CategoryDetailPanel';
import { CategoryOutcomeVisual } from './components/participant/CategoryOutcomeVisual';
import { FixtureCurrentUserSelector } from './components/participant/FixtureCurrentUserSelector';
import { GameBusUserDiagnostic } from './components/participant/GameBusUserDiagnostic';
import { KitchenProgressSection } from './components/participant/KitchenProgressSection';
import { ParticipantHeader } from './components/participant/ParticipantHeader';
import { SummaryCards } from './components/participant/SummaryCards';
import { TeamComparisonSection } from './components/participant/TeamComparisonSection';
import { YourWeekSection } from './components/participant/YourWeekSection';
import { buildFixtureKitchenProgress } from './adapters/fixtureCalculationSource';
import {
  buildGroupKitchenProgress,
  EMPTY_KITCHEN_PROGRESS,
  getGroupResultServiceDates,
} from './adapters/groupCalculationSource';
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
  const currentUserId = embedded
    ? authenticatedUser?.id ?? ''
    : fixtureUserId;

  const serviceDates = useMemo(() => {
    if (isEmbeddedLoading) return [];
    if (embedded && inputCollectionsReady) {
      return getGroupResultServiceDates(inputCollections);
    }
    return getParticipantResultServiceDates(fixtureUserId);
  }, [embedded, fixtureUserId, inputCollections, inputCollectionsReady, isEmbeddedLoading]);

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
  const weekSummary = useMemo(() => {
    if (isEmbeddedLoading) return EMPTY_PARTICIPANT_WEEK_SUMMARY;
    if (embedded && inputCollectionsReady) {
      return buildParticipantWeekSummary(currentUserId, inputCollections);
    }
    return buildParticipantWeekSummary(fixtureUserId);
  }, [
    currentUserId,
    embedded,
    fixtureUserId,
    inputCollections,
    inputCollectionsReady,
    isEmbeddedLoading,
  ]);
  const kitchenProgress = useMemo(() => {
    if (isEmbeddedLoading) return EMPTY_KITCHEN_PROGRESS;
    if (embedded && inputCollectionsReady) {
      return buildGroupKitchenProgress(inputCollections);
    }
    return buildFixtureKitchenProgress();
  }, [embedded, inputCollections, inputCollectionsReady, isEmbeddedLoading]);

  const teamBenchmark =
    dailyResults && dailyResults.staffResults.length > 0
      ? buildAnonymousTeamBenchmark(dailyResults.staffResults)
      : null;
  const comparisonInsights =
    ownResult && teamBenchmark
      ? buildParticipantComparisonInsights(ownResult, teamBenchmark)
      : null;
  const showResultContent = !isEmbeddedLoading && resultsState.status === 'ready';

  return (
    <div
      className="chef-results-page chef-results-page--participant"
      data-testid="chef-results-participant-page"
    >
      <GameBusUserDiagnostic
        selectedDate={selectedDate}
        currentUserId={currentUserId}
        hasOwnResult={ownResult !== null}
      />
      {!embedded ? <FixtureCurrentUserSelector /> : null}

      {isEmbeddedLoading ? (
        <p className="chef-results-empty" data-testid="chef-results-pending">
          Loading kitchen results…
        </p>
      ) : null}

      <div className="chef-results-toolbar">
        <label className="chef-results-date-picker">
          <span>Service date</span>
          <select
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            data-testid="chef-results-date-select"
            disabled={serviceDates.length === 0}
          >
            {serviceDates.map((date) => (
              <option key={date} value={date}>
                {formatServiceDateShort(date)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedDate ? <ParticipantHeader serviceDate={selectedDate} /> : null}

      {showResultContent && !dailyResults ? (
        <p className="chef-results-empty" data-testid="chef-results-unavailable">
          Results are not available yet for this service date.
        </p>
      ) : null}

      {showResultContent && dailyResults && !ownResult ? (
        <p className="chef-results-empty" data-testid="participant-no-result">
          You did not submit a forecast for this service date.
        </p>
      ) : null}

      {showResultContent && ownResult ? (
        <>
          <SummaryCards result={ownResult} />
          <CategoryOutcomeVisual result={ownResult} />
          <CategoryDetailPanel result={ownResult} />
          {teamBenchmark && comparisonInsights ? (
            <TeamComparisonSection
              participant={ownResult}
              benchmark={teamBenchmark}
              insights={comparisonInsights}
            />
          ) : null}
        </>
      ) : null}

      {!isEmbeddedLoading ? <YourWeekSection week={weekSummary} /> : null}
      {!isEmbeddedLoading ? <KitchenProgressSection progress={kitchenProgress} /> : null}
    </div>
  );
}
