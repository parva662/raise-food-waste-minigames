import { CHEF_CONFIG } from '../config/chef';
import {
  formatChefForecastDeadlineLabel,
  getChefForecastCutoffInstant,
  isChefForecastSubmissionInstantEligible,
} from '../services/chefForecastEligibilityPolicy';
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
  const cutoff = getChefForecastCutoffInstant(serviceDate);
  const deadlineLabel = formatChefForecastDeadlineLabel();

  if (phase === 'closed') {
    return {
      phase,
      countdownTargetIso: null,
      message: 'Forecast closed',
      detailLines: [
        `Forecasts for this service date must be submitted before ${deadlineLabel}.`,
      ],
    };
  }

  return {
    phase,
    countdownTargetIso: cutoff.toISOString(),
    message: 'Forecast open',
    detailLines: [`Submit before ${deadlineLabel} (${CHEF_CONFIG.timezone}).`],
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
