import { describe, it, expect } from 'vitest';
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

describe('submission window boundaries', () => {
  it('treats times before 23:00 as open', () => {
    expect(getSubmissionPhase(SUBMISSION_TIMES.onTimeEarly, FIXTURE_LUNCH_DATE)).toBe('open');
    expect(getSubmissionPhase(SUBMISSION_TIMES.onTimeExact, FIXTURE_LUNCH_DATE)).toBe('open');
    expect(getSubmissionPhase(SUBMISSION_TIMES.lateJustAfter, FIXTURE_LUNCH_DATE)).toBe('open');
    expect(getSubmissionPhase(SUBMISSION_TIMES.lateBeforeDeadline, FIXTURE_LUNCH_DATE)).toBe('open');
    expect(getSubmissionPhase(SUBMISSION_TIMES.lateExact, FIXTURE_LUNCH_DATE)).toBe('open');
    expect(getSubmissionPhase(SUBMISSION_TIMES.midday, FIXTURE_LUNCH_DATE)).toBe('open');
  });

  it('treats 23:00:01 as closed', () => {
    expect(getSubmissionPhase(SUBMISSION_TIMES.closedJustAfter, FIXTURE_LUNCH_DATE)).toBe('closed');
  });

  it('uses Europe/Helsinki for deadline evaluation', () => {
    const status = getSubmissionWindowStatus(SUBMISSION_TIMES.midday, FIXTURE_LUNCH_DATE);
    expect(status.phase).toBe('open');
    expect(status.detailLines[0]).toBe('Submit by 23:00');
  });

  it('remains correct across daylight-saving-time change dates', () => {
    const springForwardSubmissionDay = '2026-03-28';
    const lunchDate = '2026-03-29';
    expect(getSubmissionPhase(helsinki(springForwardSubmissionDay, '17:30:00'), lunchDate)).toBe(
      'open',
    );
    expect(getSubmissionPhase(helsinki(springForwardSubmissionDay, '19:00:00'), lunchDate)).toBe(
      'open',
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
    const slots = resolveMealSlotsForDate(FIXTURE_LUNCH_DATE)!;
    const declaration = createDeclarationFromDraft(
      { mealChoice: 'soup', mainQuantity: 0, vegetarianQuantity: 0, soupQuantity: 1, dessertQuantity: 1 },
      slots,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      () => SUBMISSION_TIMES.lateEvening,
    );

    expect(declaration).not.toBeNull();
    expect(declaration).not.toHaveProperty('basePoints');
    expect(declaration).not.toHaveProperty('timingAdjustment');
    expect(declaration).not.toHaveProperty('totalPoints');
    expect(declaration).not.toHaveProperty('timingStatus');
    expect(declaration?.submittedAt).toBe(SUBMISSION_TIMES.lateEvening.toISOString());
  });
});
