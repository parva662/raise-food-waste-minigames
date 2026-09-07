import { CANTEEN_CONFIG } from './canteen';

/**
 * Kitchen forecast configuration.
 * Final submission cutoff: 09:00:00 on the target service date (Europe/Helsinki).
 */
export const CHEF_CONFIG = {
  /** Maximum allowed integer for expected customers and all forecast quantities. */
  maxForecastQuantity: 1000,
  timezone: CANTEEN_CONFIG.timezone,
  forecastCutoffHour: 9,
  forecastCutoffMinute: 0,
  forecastCutoffSecond: 0,
} as const;

export type ChefConfig = typeof CHEF_CONFIG;
