import { parseISO, subDays, format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { CANTEEN_CONFIG } from '@/shared/calendar/canteen';
import type { SubmissionPhase, SubmissionWindowStatus } from '@/products/lunch-declaration/types/declaration';
import { systemClock, type Clock } from '@/shared/time/clock';
import { formatCountdown } from '@/shared/time/formatCountdown';

export type { Clock };
export { systemClock, formatCountdown };

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

  if (nowMs >= deadlineEnd.getTime() || nowMs >= lunchStart.getTime()) {
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

export function helsinkiNowParts(now: Date): { dateIso: string; timeLabel: string } {
  const zoned = toZonedTime(now, CANTEEN_CONFIG.timezone);
  const dateIso = format(zoned, 'yyyy-MM-dd');
  const timeLabel = format(zoned, 'HH:mm');
  return { dateIso, timeLabel };
}
