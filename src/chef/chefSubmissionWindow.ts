import { parseISO, subDays, format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { CHEF_CONFIG } from '../config/chef';
import type { SubmissionPhase, SubmissionWindowStatus, TimingStatus } from '../types/declaration';
import type { Clock } from '../services/submissionWindow';
import type { ChefForecastSubmission } from './types';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function getSubmissionDateIso(serviceDate: string): string {
  return format(subDays(parseISO(serviceDate), 1), 'yyyy-MM-dd');
}

function helsinkiInstant(dateIso: string, hour: number, minute: number, second: number): Date {
  const local = `${dateIso} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
  return fromZonedTime(local, CHEF_CONFIG.timezone);
}

function serviceDayStart(serviceDate: string): Date {
  return helsinkiInstant(serviceDate, 0, 0, 0);
}

export function getChefSubmissionPhase(now: Date, serviceDate: string): SubmissionPhase {
  const submissionDateIso = getSubmissionDateIso(serviceDate);
  const onTimeEnd = helsinkiInstant(
    submissionDateIso,
    CHEF_CONFIG.onTimeDeadlineHour,
    CHEF_CONFIG.onTimeDeadlineMinute,
    CHEF_CONFIG.onTimeDeadlineSecond,
  );
  const lateEnd = helsinkiInstant(
    submissionDateIso,
    CHEF_CONFIG.lateDeadlineHour,
    CHEF_CONFIG.lateDeadlineMinute,
    CHEF_CONFIG.lateDeadlineSecond,
  );
  const serviceStart = serviceDayStart(serviceDate);
  const nowMs = now.getTime();

  if (nowMs > lateEnd.getTime() || nowMs >= serviceStart.getTime()) {
    return 'closed';
  }
  if (nowMs > onTimeEnd.getTime()) {
    return 'late';
  }
  return 'on-time';
}

export function getChefTimingStatusForInstant(instant: Date, serviceDate: string): TimingStatus {
  return getChefSubmissionPhase(instant, serviceDate) === 'late' ? 'late' : 'on-time';
}

export function isChefSubmissionAllowed(now: Date, serviceDate: string): boolean {
  return getChefSubmissionPhase(now, serviceDate) !== 'closed';
}

export function getChefSubmissionWindowStatus(
  now: Date,
  serviceDate: string,
): SubmissionWindowStatus {
  const phase = getChefSubmissionPhase(now, serviceDate);
  const submissionDateIso = getSubmissionDateIso(serviceDate);

  if (phase === 'on-time') {
    return {
      phase,
      countdownTargetIso: helsinkiInstant(
        submissionDateIso,
        CHEF_CONFIG.onTimeDeadlineHour,
        CHEF_CONFIG.onTimeDeadlineMinute,
        CHEF_CONFIG.onTimeDeadlineSecond,
      ).toISOString(),
      totalPointsIfSubmittedNow: null,
      message: 'Forecast open — on-time period',
      detailLines: [
        `Submit by ${pad(CHEF_CONFIG.onTimeDeadlineHour)}:${pad(CHEF_CONFIG.onTimeDeadlineMinute)} for on-time status.`,
        `Final deadline ${pad(CHEF_CONFIG.lateDeadlineHour)}:${pad(CHEF_CONFIG.lateDeadlineMinute)} on the day before service.`,
      ],
    };
  }

  if (phase === 'late') {
    return {
      phase,
      countdownTargetIso: helsinkiInstant(
        submissionDateIso,
        CHEF_CONFIG.lateDeadlineHour,
        CHEF_CONFIG.lateDeadlineMinute,
        CHEF_CONFIG.lateDeadlineSecond,
      ).toISOString(),
      totalPointsIfSubmittedNow: null,
      message: 'Late forecast period',
      detailLines: [
        `Submit before ${pad(CHEF_CONFIG.lateDeadlineHour)}:${pad(CHEF_CONFIG.lateDeadlineMinute)} tonight.`,
      ],
    };
  }

  return {
    phase,
    countdownTargetIso: null,
    totalPointsIfSubmittedNow: null,
    message: 'Forecast closed',
    detailLines: ['The forecast window has closed for this service date.'],
  };
}

export function createChefForecastSubmission(
  serviceDate: string,
  clock: Clock,
): ChefForecastSubmission | null {
  const now = clock();
  if (!isChefSubmissionAllowed(now, serviceDate)) return null;
  return {
    targetDate: serviceDate,
    timingStatus: getChefTimingStatusForInstant(now, serviceDate),
    submittedAt: now.toISOString(),
  };
}
