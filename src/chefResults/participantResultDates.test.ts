import { describe, it, expect } from 'vitest';
import { formatServiceDateLong, formatServiceDateShort } from './displayFormat';
import {
  getLatestParticipantResultDate,
  getParticipantResultServiceDates,
} from './participantResultDates';

describe('participant result dates', () => {
  it('returns only dates where the participant has a finalized result', () => {
    const dates = getParticipantResultServiceDates('fixture-user-c');
    expect(dates).toEqual(['2026-07-27', '2026-07-28', '2026-07-29', '2026-07-31']);
    expect(dates).not.toContain('2026-07-30');
  });

  it('selects the latest available result date for the participant', () => {
    expect(getLatestParticipantResultDate('fixture-user-c')).toBe('2026-07-31');
    expect(getLatestParticipantResultDate('fixture-user-a')).toBe('2026-07-30');
  });

  it('does not fabricate dates without results', () => {
    expect(getParticipantResultServiceDates('fixture-user-a')).not.toContain('2026-07-28');
    expect(getParticipantResultServiceDates('fixture-user-a')).not.toContain('2026-07-31');
    expect(getLatestParticipantResultDate('missing-user')).toBeNull();
  });
});

describe('service date display formatting', () => {
  it('formats long readable labels while keeping ISO internally', () => {
    expect(formatServiceDateLong('2026-07-27')).toBe('Monday, 27 July 2026');
    expect(formatServiceDateShort('2026-07-27')).toMatch(/Mon/i);
    expect(formatServiceDateShort('2026-07-27')).toMatch(/27/);
  });
});
