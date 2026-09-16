import { CHEF_CONFIG } from '../config/chef';
import { isChefForecastSubmissionInstantEligible } from '../services/chefForecastEligibilityPolicy';
import {
  CHEF_GRACE_WINDOW_OPENS_LABEL,
  CHEF_WINDOW_SWITCH_LABEL,
  getChefAdvanceWindowEndInstant,
  getChefGraceWindowEndInstant,
} from '../services/chefForecastWindow';
import { getOperationalDateIso } from '../utils/dates';
import type { TimingStatus } from '../types/declaration';
import type { Clock } from '../services/submissionWindow';
import type { ChefForecastSubmission, ChefSubmissionPhase, ChefSubmissionWindowStatus } from './types';

export function getChefSubmissionPhase(now: Date, serviceDate: string): ChefSubmissionPhase {
  return isChefForecastSubmissionInstantEligible(now, serviceDate) ? 'on-time' : 'closed';
}

export function getChefTimingStatusForInstant(_instant: Date, _serviceDate: string): TimingStatus {
  return 'on-time';
}

export function isChefSubmissionAllowed(now: Date, serviceDate: string): boolean {
  return getChefSubmissionPhase(now, serviceDate) !== 'closed';
}

export function getChefSubmissionWindowStatus(
  now: Date,
  serviceDate: string,
): ChefSubmissionWindowStatus {
  const phase = getChefSubmissionPhase(now, serviceDate);
  const today = getOperationalDateIso(now);
  const targetsToday = serviceDate === today;
  const timezone = CHEF_CONFIG.timezone;

  if (phase === 'closed') {
    return targetsToday
      ? {
          phase,
          countdownTargetIso: null,
          windowLabel: `Opens ${CHEF_GRACE_WINDOW_OPENS_LABEL} today`,
          message: 'Forecast closed',
          detailLines: [
            `Forecasts for today's service can be submitted between ${CHEF_GRACE_WINDOW_OPENS_LABEL} and ${CHEF_WINDOW_SWITCH_LABEL} (${timezone}).`,
          ],
        }
      : {
          phase,
          countdownTargetIso: null,
          windowLabel: `Opens ${CHEF_WINDOW_SWITCH_LABEL} on the previous service day`,
          message: 'Forecast closed',
          detailLines: [
            `Today is not an operational lunch-service day. Forecasts for this service open at ${CHEF_WINDOW_SWITCH_LABEL} on the previous operational service day (${timezone}).`,
          ],
        };
  }

  if (targetsToday) {
    return {
      phase,
      countdownTargetIso: getChefGraceWindowEndInstant(serviceDate).toISOString(),
      windowLabel: `Deadline ${CHEF_WINDOW_SWITCH_LABEL} today`,
      message: 'Forecast open',
      detailLines: [
        `Same-day window for today's service: submit before ${CHEF_WINDOW_SWITCH_LABEL} (${timezone}).`,
      ],
    };
  }

  return {
    phase,
    countdownTargetIso: getChefAdvanceWindowEndInstant(today).toISOString(),
    windowLabel: 'Deadline midnight tonight',
    message: 'Forecast open',
    detailLines: [
      `Submit before midnight (${timezone}).`,
      `Entry for this service reopens ${CHEF_GRACE_WINDOW_OPENS_LABEL}–${CHEF_WINDOW_SWITCH_LABEL} on the service day itself.`,
    ],
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
    timingStatus: 'on-time',
    submittedAt: now.toISOString(),
  };
}
