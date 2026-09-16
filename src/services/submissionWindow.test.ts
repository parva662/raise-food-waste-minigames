import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSubmissionPhase,
  isSubmissionAllowed,
  getSubmissionWindowStatus,
} from './submissionWindow';
import { createDeclarationFromDraft } from '../utils/declaration';
import { resolveMealSlotsForDate } from './mealSlots';
import { CANTEEN_CONFIG } from '../config/canteen';
import {
  FIXTURE_LUNCH_DATE,
  SUBMISSION_TIMES,
  helsinki,
} from '../test/fixtures/dates';

describe('submission window boundaries (23:59 Helsinki)', () => {
  it('treats times before 23:59 as open', () => {
    expect(getSubmissionPhase(SUBMISSION_TIMES.onTimeEarly, FIXTURE_LUNCH_DATE)).toBe('open');
    expect(getSubmissionPhase(SUBMISSION_TIMES.lateBeforeDeadline, FIXTURE_LUNCH_DATE)).toBe('open');
    expect(getSubmissionPhase(SUBMISSION_TIMES.midday, FIXTURE_LUNCH_DATE)).toBe('open');
  });

  it('treats exactly 23:59:00 as closed', () => {
    expect(getSubmissionPhase(SUBMISSION_TIMES.lateExact, FIXTURE_LUNCH_DATE)).toBe('closed');
  });

  it('treats 23:59:01 as closed', () => {
    expect(getSubmissionPhase(SUBMISSION_TIMES.closedJustAfter, FIXTURE_LUNCH_DATE)).toBe('closed');
  });

  it('uses Europe/Helsinki for deadline evaluation', () => {
    const status = getSubmissionWindowStatus(SUBMISSION_TIMES.midday, FIXTURE_LUNCH_DATE);
    expect(status.phase).toBe('open');
    expect(status.detailLines[0]).toBe('Submit by 23:59');
  });

  it('remains correct across daylight-saving-time change dates', () => {
    const springForwardSubmissionDay = '2026-03-28';
    const lunchDate = '2026-03-29';
    expect(getSubmissionPhase(helsinki(springForwardSubmissionDay, '17:30:00'), lunchDate)).toBe(
      'open',
    );
    expect(getSubmissionPhase(helsinki(springForwardSubmissionDay, '23:58:59'), lunchDate)).toBe(
      'open',
    );
    expect(getSubmissionPhase(helsinki(springForwardSubmissionDay, '23:59:00'), lunchDate)).toBe(
      'closed',
    );
  });

  it('does not change phase based on browser-local timezone interpretation of the same instant', () => {
    const instant = SUBMISSION_TIMES.midday;
    expect(getSubmissionPhase(instant, FIXTURE_LUNCH_DATE)).toBe('open');
    expect(getSubmissionPhase(new Date(instant.toISOString()), FIXTURE_LUNCH_DATE)).toBe('open');
  });

  it('prevents declaration creation when submission is closed', () => {
    const slots = resolveMealSlotsForDate(FIXTURE_LUNCH_DATE);
    if (!slots) throw new Error('Expected meal slots');
    const declaration = createDeclarationFromDraft(
      { mealChoice: 'no_lunch', mainQuantity: 0, vegetarianQuantity: 0, soupQuantity: 0, dessertQuantity: 0 },
      slots,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      () => SUBMISSION_TIMES.closedJustAfter,
    );
    expect(declaration).toBeNull();
    expect(isSubmissionAllowed(SUBMISSION_TIMES.closedJustAfter, FIXTURE_LUNCH_DATE)).toBe(false);
  });
});

describe('submission window without scoring distinction', () => {
  it('does not distinguish on-time vs late before the cutoff', () => {
    const midday = getSubmissionWindowStatus(SUBMISSION_TIMES.midday, FIXTURE_LUNCH_DATE);
    const lateEvening = getSubmissionWindowStatus(SUBMISSION_TIMES.lateEvening, FIXTURE_LUNCH_DATE);

    expect(midday.phase).toBe('open');
    expect(lateEvening.phase).toBe('open');
    expect(midday.message).toBe('Submission open');
    expect(lateEvening.message).toBe('Submission open');
  });

  it('creates declarations without scoring fields before the cutoff', () => {
    const slots = resolveMealSlotsForDate(FIXTURE_LUNCH_DATE);
    if (!slots) throw new Error('Expected meal slots');
    const declaration = createDeclarationFromDraft(
      { mealChoice: 'no_lunch', mainQuantity: 0, vegetarianQuantity: 0, soupQuantity: 0, dessertQuantity: 0 },
      slots,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      () => SUBMISSION_TIMES.lateBeforeDeadline,
    );
    expect(declaration).not.toBeNull();
    expect(declaration && 'pointsAwarded' in declaration).toBe(false);
  });
});

describe('fresh load vs open page across cutoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fresh evaluation at 23:58:59 is open and at 23:59:00 is closed', () => {
    expect(getSubmissionPhase(SUBMISSION_TIMES.lateBeforeDeadline, FIXTURE_LUNCH_DATE)).toBe('open');
    expect(getSubmissionPhase(SUBMISSION_TIMES.lateExact, FIXTURE_LUNCH_DATE)).toBe('closed');
  });
});
