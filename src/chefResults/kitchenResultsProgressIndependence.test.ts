import { describe, expect, it } from 'vitest';
import type { GameBusInputCollectionsPayload } from '../gamebus/types';
import {
  buildParticipantProgressServicePoints,
  buildParticipantProgressPeriodView,
} from './participantProgressData';
import {
  getParticipantGroupResultServiceDates,
  resolveAdminServicePartialState,
} from './adapters/groupCalculationSource';

/**
 * Root-cause probe: waiting for current closeout must not erase historical Progress.
 * Progress points come only from completed (forecast + closeout) participant dates.
 */
describe('Kitchen Results progress vs waiting-closeout separation', () => {
  it('documents that Progress uses completed dates independently of current waiting state', () => {
    // Fixture-backed path: points exist for historical services even when asOf is a later date.
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-09-16');
    expect(points.length).toBeGreaterThan(0);

    // Current calendar month may be empty while Year still has history — that is period filtering,
    // not "waiting for closeout erased Progress".
    const month = buildParticipantProgressPeriodView(points, 'month', '2026-09-16');
    const year = buildParticipantProgressPeriodView(points, 'year', '2026-09-16');
    expect(year.summary.servicesCompleted).toBeGreaterThan(0);
    if (month.summary.servicesCompleted === 0) {
      expect(month.emptyMessage).toMatch(/this month/i);
    }
  });

  it('returns no participant dates from empty INPUT_COLLECTIONS (payload absence, not UI waiting)', () => {
    const empty: GameBusInputCollectionsPayload = {};
    expect(getParticipantGroupResultServiceDates(empty, 'any-user')).toEqual([]);
    expect(buildParticipantProgressServicePoints('any-user', '2026-09-16', empty)).toEqual([]);
  });
});

describe('resolveAdminServicePartialState', () => {
  it('returns empty when neither forecast nor closeout exists', () => {
    const state = resolveAdminServicePartialState({}, '2026-09-16');
    expect(state.kind).toBe('empty');
  });
});
