import { CANTEEN_CONFIG } from './canteen';

/**
 * Chef kitchen forecast configuration.
 * Deadline defaults to 23:00 on the day before the target service date (Europe/Helsinki).
 * The kitchen may later provide the final operational deadline — update these values only here.
 */
export const CHEF_CONFIG = {
  /** Maximum allowed integer for expected customers and all forecast quantities. */
  maxForecastQuantity: 1000,
  timezone: CANTEEN_CONFIG.timezone,
  /** On-time boundary for timingStatus (before this = on-time, after until late deadline = late). */
  onTimeDeadlineHour: 18,
  onTimeDeadlineMinute: 0,
  onTimeDeadlineSecond: 0,
  /** Final submission deadline on the day before target service date. */
  lateDeadlineHour: 23,
  lateDeadlineMinute: 0,
  lateDeadlineSecond: 0,
} as const;

export type ChefConfig = typeof CHEF_CONFIG;
