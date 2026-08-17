import { useMemo, useState } from 'react';
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
import { getFixtureCurrentUserId } from './currentUserContext';
import { buildParticipantWeekSummary, findParticipantDailyResult } from './participantWeekData';
import {
  getLatestParticipantResultDate,
  getParticipantResultServiceDates,
} from './participantResultDates';
import {
  buildAnonymousTeamBenchmark,
  buildParticipantComparisonInsights,
} from './teamComparison';
import { useChefResultsFixtureData } from './useChefResultsData';

/**
 * Participant-safe results view — own identifiable data + anonymous team comparison.
 * Route: #/chef-results (GameBus participant menu target).
 */
export function ChefResultsParticipantApp() {
  const currentUserId = getFixtureCurrentUserId();
  const serviceDates = useMemo(
    () => getParticipantResultServiceDates(currentUserId),
    [currentUserId],
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    () => getLatestParticipantResultDate(getFixtureCurrentUserId()) ?? '',
  );
  const { dailyResults } = useChefResultsFixtureData(selectedDate);
  const ownResult = findParticipantDailyResult(currentUserId, selectedDate);
  const weekSummary = useMemo(() => buildParticipantWeekSummary(currentUserId), [currentUserId]);

  const teamBenchmark =
    dailyResults && dailyResults.staffResults.length > 0
      ? buildAnonymousTeamBenchmark(dailyResults.staffResults)
      : null;
  const comparisonInsights =
    ownResult && teamBenchmark
      ? buildParticipantComparisonInsights(ownResult, teamBenchmark)
      : null;

  return (
    <div
      className="chef-results-page chef-results-page--participant"
      data-testid="chef-results-participant-page"
    >
      <GameBusUserDiagnostic />
      <FixtureCurrentUserSelector />

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

      <ParticipantHeader serviceDate={selectedDate} />

      {!ownResult ? (
        <p className="chef-results-empty" data-testid="participant-no-result">
          You did not participate in a forecast for this service date.
        </p>
      ) : (
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
      )}

      <YourWeekSection week={weekSummary} />
      <KitchenProgressSection />
    </div>
  );
}
