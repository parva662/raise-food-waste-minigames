import { parseISO, subDays, format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { CANTEEN_CONFIG } from '../config/canteen';
import type { SubmissionPhase, SubmissionWindowStatus } from '../types/declaration';

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

function submissionDeadlineInstant(lunchDate: string): Date {
  const submissionDateIso = getSubmissionDateIso(lunchDate);
  return helsinkiInstant(
    submissionDateIso,
    CANTEEN_CONFIG.submissionDeadlineHour,
    CANTEEN_CONFIG.submissionDeadlineMinute,
    CANTEEN_CONFIG.submissionDeadlineSecond,
  );
}

export function getSubmissionPhase(now: Date, lunchDate: string): SubmissionPhase {
  const deadlineEnd = submissionDeadlineInstant(lunchDate);
  const lunchStart = lunchDayStart(lunchDate);
  const nowMs = now.getTime();

  if (nowMs > deadlineEnd.getTime() || nowMs >= lunchStart.getTime()) {
    return 'closed';
  }
  return 'open';
}

export function getSubmissionWindowStatus(now: Date, lunchDate: string): SubmissionWindowStatus {
  const phase = getSubmissionPhase(now, lunchDate);
  const deadline = submissionDeadlineInstant(lunchDate);
  const deadlineLabel = `${pad(CANTEEN_CONFIG.submissionDeadlineHour)}:${pad(CANTEEN_CONFIG.submissionDeadlineMinute)}`;

  if (phase === 'open') {
    return {
      phase,
      countdownTargetIso: deadline.toISOString(),
      message: 'Submission open',
      detailLines: [`Submit by ${deadlineLabel}`],
    };
  }

  return {
    phase,
    countdownTargetIso: null,
    message: 'Submission closed',
    detailLines: ['Lunch selection is closed for this date.'],
  };
}

export function isSubmissionAllowed(now: Date, lunchDate: string): boolean {
  return getSubmissionPhase(now, lunchDate) === 'open';
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
