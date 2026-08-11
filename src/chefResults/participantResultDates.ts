import { buildAllFixtureDailyServiceResults } from './adapters/fixtureCalculationSource';

/**
 * Service dates where finalized results exist for the given participant.
 * Future GameBus phase: same rule using latest available finalized result per actor.
 */
export function getParticipantResultServiceDates(userId: string): readonly string[] {
  const dates: string[] = [];

  for (const day of buildAllFixtureDailyServiceResults()) {
    if (day.staffResults.some((result) => result.userId === userId)) {
      dates.push(day.serviceDate);
    }
  }

  return dates.sort();
}

/** Latest service date with a finalized result for the participant, or null if none. */
export function getLatestParticipantResultDate(userId: string): string | null {
  const dates = getParticipantResultServiceDates(userId);
  if (dates.length === 0) return null;
  return dates[dates.length - 1]!;
}
