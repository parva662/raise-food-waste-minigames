import { describe, it, expect } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import { CANTEEN_CONFIG } from '../config/canteen';
import {
  calculatePointsForTimingStatus,
  formatPointsBreakdown,
  formatSavedStatusSummary,
  getLateTotalPoints,
  getOnTimeTotalPoints,
} from '../utils/points';
import {
  getPointsBreakdownForInstant,
  getSubmissionPhase,
  getSubmissionWindowStatus,
  isSubmissionAllowed,
} from '../services/submissionWindow';

function helsinki(date: string, time: string): Date {
  return fromZonedTime(`${date} ${time}`, 'Europe/Helsinki');
}

const LUNCH_DATE = '2026-01-07';
const SUBMISSION_DAY = '2026-01-06';

describe('points configuration', () => {
  it('uses 20 base points', () => {
    expect(CANTEEN_CONFIG.basePoints).toBe(20);
  });

  it('uses +5 on-time bonus', () => {
    expect(CANTEEN_CONFIG.onTimeBonus).toBe(5);
  });

  it('uses -5 late penalty', () => {
    expect(CANTEEN_CONFIG.latePenalty).toBe(-5);
  });
});

describe('points calculation', () => {
  it('calculates on-time total as 25', () => {
    expect(getOnTimeTotalPoints()).toBe(25);
    expect(calculatePointsForTimingStatus('on-time')).toEqual({
      basePoints: 20,
      timingAdjustment: 5,
      totalPoints: 25,
      timingStatus: 'on-time',
    });
  });

  it('calculates late total as 15', () => {
    expect(getLateTotalPoints()).toBe(15);
    expect(calculatePointsForTimingStatus('late')).toEqual({
      basePoints: 20,
      timingAdjustment: -5,
      totalPoints: 15,
      timingStatus: 'late',
    });
  });

  it('formats on-time saved status with total points', () => {
    expect(formatSavedStatusSummary(calculatePointsForTimingStatus('on-time'))).toBe(
      'Lunch saved · 25 points',
    );
    expect(formatPointsBreakdown(calculatePointsForTimingStatus('on-time'))).toBe(
      '20 base points + 5 on-time bonus',
    );
  });

  it('formats late saved status with total points', () => {
    expect(formatSavedStatusSummary(calculatePointsForTimingStatus('late'))).toBe(
      'Lunch saved late · 15 points',
    );
    expect(formatPointsBreakdown(calculatePointsForTimingStatus('late'))).toBe(
      '20 base points − 5 late penalty',
    );
  });
});

describe('submission window totals', () => {
  it('produces 25 points exactly at 18:00', () => {
    expect(getSubmissionPhase(helsinki(SUBMISSION_DAY, '18:00:00'), LUNCH_DATE)).toBe('on-time');
    expect(getPointsBreakdownForInstant(helsinki(SUBMISSION_DAY, '18:00:00'), LUNCH_DATE)?.totalPoints).toBe(25);
  });

  it('produces 15 points after 18:00', () => {
    expect(getSubmissionPhase(helsinki(SUBMISSION_DAY, '18:00:01'), LUNCH_DATE)).toBe('late');
    expect(getPointsBreakdownForInstant(helsinki(SUBMISSION_DAY, '20:15:00'), LUNCH_DATE)?.totalPoints).toBe(15);
  });

  it('accepts exactly 23:00 with 15 points', () => {
    expect(getSubmissionPhase(helsinki(SUBMISSION_DAY, '23:00:00'), LUNCH_DATE)).toBe('late');
    expect(getPointsBreakdownForInstant(helsinki(SUBMISSION_DAY, '23:00:00'), LUNCH_DATE)?.totalPoints).toBe(15);
  });

  it('rejects submission after 23:00', () => {
    expect(getSubmissionPhase(helsinki(SUBMISSION_DAY, '23:00:01'), LUNCH_DATE)).toBe('closed');
    expect(getPointsBreakdownForInstant(helsinki(SUBMISSION_DAY, '23:00:01'), LUNCH_DATE)).toBeNull();
    expect(isSubmissionAllowed(helsinki(SUBMISSION_DAY, '23:00:01'), LUNCH_DATE)).toBe(false);
  });
});

describe('deadline card copy', () => {
  it('shows on-time totals and breakdown before 18:00', () => {
    const status = getSubmissionWindowStatus(helsinki(SUBMISSION_DAY, '17:30:00'), LUNCH_DATE);
    expect(status.message).toBe('On-time submission');
    expect(status.detailLines[0]).toBe('Submit by 18:00 to receive 25 points.');
    expect(status.detailLines[1]).toBe('20 base points + 5 on-time bonus');
  });

  it('shows late totals and breakdown after 18:00', () => {
    const status = getSubmissionWindowStatus(helsinki(SUBMISSION_DAY, '19:00:00'), LUNCH_DATE);
    expect(status.message).toBe('Late submission period');
    expect(status.detailLines[0]).toBe('You can still submit until 23:00 and receive 15 points.');
    expect(status.detailLines[1]).toBe('20 base points − 5 late penalty');
    expect(status.detailLines[2]).toBe(
      'Your selection will still be included in the canteen estimate.',
    );
  });
});
