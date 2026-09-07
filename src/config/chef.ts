import { CANTEEN_CONFIG } from './canteen';

/**
 * Kitchen forecast configuration.
 * Final submission cutoff: 08:30:00 on the target service date (Europe/Helsinki).
 */
export const CHEF_CONFIG = {
  /** Maximum allowed integer for expected customers and all forecast quantities. */
  maxForecastQuantity: 1000,
  timezone: CANTEEN_CONFIG.timezone,
  forecastCutoffHour: 8,
  forecastCutoffMinute: 30,
  forecastCutoffSecond: 0,
} as const;

export type ChefConfig = typeof CHEF_CONFIG;
