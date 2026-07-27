import { describe, it, expect } from 'vitest';
import {
  getSubmissionPhase,
  getPointsBreakdownForInstant,
  getTimingStatusForInstant,
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
  it('treats 17:59:59 as on time', () => {
    expect(getSubmissionPhase(SUBMISSION_TIMES.onTimeEarly, FIXTURE_LUNCH_DATE)).toBe('on-time');
  });

  it('treats 18:00:00 as on time', () => {
    expect(getSubmissionPhase(SUBMISSION_TIMES.onTimeExact, FIXTURE_LUNCH_DATE)).toBe('on-time');
  });

  it('treats 18:00:01 as late', () => {
    expect(getSubmissionPhase(SUBMISSION_TIMES.lateJustAfter, FIXTURE_LUNCH_DATE)).toBe('late');
  });

  it('treats 22:59:59 as late', () => {
    expect(getSubmissionPhase(SUBMISSION_TIMES.lateBeforeDeadline, FIXTURE_LUNCH_DATE)).toBe('late');
  });

  it('treats 23:00:00 as late', () => {
    expect(getSubmissionPhase(SUBMISSION_TIMES.lateExact, FIXTURE_LUNCH_DATE)).toBe('late');
  });

  it('treats 23:00:01 as closed', () => {
    expect(getSubmissionPhase(SUBMISSION_TIMES.closedJustAfter, FIXTURE_LUNCH_DATE)).toBe('closed');
  });

  it('uses Europe/Helsinki for deadline evaluation', () => {
    const status = getSubmissionWindowStatus(SUBMISSION_TIMES.onTimeExact, FIXTURE_LUNCH_DATE);
    expect(status.message).toBe('On-time submission');
    expect(getTimingStatusForInstant(SUBMISSION_TIMES.onTimeExact, FIXTURE_LUNCH_DATE)).toBe('on-time');
  });

  it('remains correct across daylight-saving-time change dates', () => {
    const springForwardSubmissionDay = '2026-03-28';
    const lunchDate = '2026-03-29';
    expect(getSubmissionPhase(helsinki(springForwardSubmissionDay, '17:30:00'), lunchDate)).toBe(
      'on-time',
    );
    expect(getSubmissionPhase(helsinki(springForwardSubmissionDay, '19:00:00'), lunchDate)).toBe(
      'late',
    );
  });

  it('does not change phase based on browser-local timezone interpretation of the same instant', () => {
    const instant = SUBMISSION_TIMES.onTimeExact;
    expect(getSubmissionPhase(instant, FIXTURE_LUNCH_DATE)).toBe('on-time');
    expect(getSubmissionPhase(new Date(instant.toISOString()), FIXTURE_LUNCH_DATE)).toBe('on-time');
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

describe('submission window scoring integration', () => {
  it('returns 25 total points on time', () => {
    expect(
      getPointsBreakdownForInstant(SUBMISSION_TIMES.onTimeExact, FIXTURE_LUNCH_DATE)?.totalPoints,
    ).toBe(25);
  });

  it('returns 15 total points late', () => {
    expect(
      getPointsBreakdownForInstant(SUBMISSION_TIMES.lateEvening, FIXTURE_LUNCH_DATE)?.totalPoints,
    ).toBe(15);
  });

  it('returns 15 total points exactly at 23:00', () => {
    expect(
      getPointsBreakdownForInstant(SUBMISSION_TIMES.lateExact, FIXTURE_LUNCH_DATE)?.totalPoints,
    ).toBe(15);
  });

  it('returns null after 23:00', () => {
    expect(getPointsBreakdownForInstant(SUBMISSION_TIMES.closedJustAfter, FIXTURE_LUNCH_DATE)).toBeNull();
  });

  it('scores late submissions at 15 points at submit time', () => {
    const slots = resolveMealSlotsForDate(FIXTURE_LUNCH_DATE)!;
    const declaration = createDeclarationFromDraft(
      { mealChoice: 'soup', mainQuantity: 0, vegetarianQuantity: 0, soupQuantity: 1, dessertQuantity: 1 },
      slots,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      () => SUBMISSION_TIMES.lateEvening,
    );
    expect(declaration?.totalPoints).toBe(15);
  });
});
