import { parseISO, subDays, format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { CANTEEN_CONFIG } from '../config/canteen';
import type {
  SubmissionPhase,
  SubmissionWindowStatus,
  TimingStatus,
} from '../types/declaration';
import {
  calculatePointsForTimingStatus,
  formatPointsBreakdown,
  getLateTotalPoints,
  getOnTimeTotalPoints,
} from '../utils/points';

export type Clock = () => Date;

export const systemClock: Clock = () => new Date();

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function getSubmissionDateIso(lunchDate: string): string {
  return format(subDays(parseISO(lunchDate), 1), 'yyyy-MM-dd');
}

function helsinkiInstant(dateIso: string, hour: number, minute: number, second: number): Date {
  const local = `${dateIso} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
  return fromZonedTime(local, CANTEEN_CONFIG.timezone);
}

function lunchDayStart(lunchDate: string): Date {
  return helsinkiInstant(lunchDate, 0, 0, 0);
}

export function getSubmissionPhase(now: Date, lunchDate: string): SubmissionPhase {
  const submissionDateIso = getSubmissionDateIso(lunchDate);
  const onTimeEnd = helsinkiInstant(
    submissionDateIso,
    CANTEEN_CONFIG.onTimeDeadlineHour,
    CANTEEN_CONFIG.onTimeDeadlineMinute,
    CANTEEN_CONFIG.onTimeDeadlineSecond,
  );
  const lateEnd = helsinkiInstant(
    submissionDateIso,
    CANTEEN_CONFIG.lateDeadlineHour,
    CANTEEN_CONFIG.lateDeadlineMinute,
    CANTEEN_CONFIG.lateDeadlineSecond,
  );
  const lunchStart = lunchDayStart(lunchDate);
  const nowMs = now.getTime();

  if (nowMs > lateEnd.getTime() || nowMs >= lunchStart.getTime()) {
    return 'closed';
  }
  if (nowMs > onTimeEnd.getTime()) {
    return 'late';
  }
  return 'on-time';
}

export function getTimingStatusForInstant(instant: Date, lunchDate: string): TimingStatus {
  return getSubmissionPhase(instant, lunchDate) === 'late' ? 'late' : 'on-time';
}

export function getPointsBreakdownForInstant(instant: Date, lunchDate: string) {
  const phase = getSubmissionPhase(instant, lunchDate);
  if (phase === 'closed') return null;
  return calculatePointsForTimingStatus(phase === 'late' ? 'late' : 'on-time');
}

export function getSubmissionWindowStatus(now: Date, lunchDate: string): SubmissionWindowStatus {
  const phase = getSubmissionPhase(now, lunchDate);
  const submissionDateIso = getSubmissionDateIso(lunchDate);

  if (phase === 'on-time') {
    const breakdown = calculatePointsForTimingStatus('on-time');
    return {
      phase,
      countdownTargetIso: helsinkiInstant(
        submissionDateIso,
        CANTEEN_CONFIG.onTimeDeadlineHour,
        CANTEEN_CONFIG.onTimeDeadlineMinute,
        CANTEEN_CONFIG.onTimeDeadlineSecond,
      ).toISOString(),
      totalPointsIfSubmittedNow: getOnTimeTotalPoints(),
      message: 'On-time submission',
      detailLines: [
        `Submit by 18:00 to receive ${breakdown.totalPoints} points.`,
        formatPointsBreakdown(breakdown),
      ],
    };
  }

  if (phase === 'late') {
    const breakdown = calculatePointsForTimingStatus('late');
    return {
      phase,
      countdownTargetIso: helsinkiInstant(
        submissionDateIso,
        CANTEEN_CONFIG.lateDeadlineHour,
        CANTEEN_CONFIG.lateDeadlineMinute,
        CANTEEN_CONFIG.lateDeadlineSecond,
      ).toISOString(),
      totalPointsIfSubmittedNow: getLateTotalPoints(),
      message: 'Late submission period',
      detailLines: [
        `You can still submit until 23:00 and receive ${breakdown.totalPoints} points.`,
        formatPointsBreakdown(breakdown),
        'Your selection will still be included in the canteen estimate.',
      ],
    };
  }

  return {
    phase,
    countdownTargetIso: null,
    totalPointsIfSubmittedNow: null,
    message: 'Submission closed',
    detailLines: ['Lunch selection is closed for this date.'],
  };
}

export function isSubmissionAllowed(now: Date, lunchDate: string): boolean {
  return getSubmissionPhase(now, lunchDate) !== 'closed';
}

export function formatCountdown(now: Date, targetIso: string): string {
  const targetMs = new Date(targetIso).getTime();
  const diffMs = Math.max(0, targetMs - now.getTime());
  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function helsinkiNowParts(now: Date): { dateIso: string; timeLabel: string } {
  const zoned = toZonedTime(now, CANTEEN_CONFIG.timezone);
  const dateIso = format(zoned, 'yyyy-MM-dd');
  const timeLabel = format(zoned, 'HH:mm');
  return { dateIso, timeLabel };
}
