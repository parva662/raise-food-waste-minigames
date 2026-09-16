import { CANTEEN_CONFIG } from './canteen';

/**
 * Kitchen forecast configuration.
 * On an operational service day (Europe/Helsinki): entry is closed before 08:00:00,
 * targets today's service from 08:00:00 to 08:29:59, and targets the next operational
 * service from 08:30:00 to 23:59:59.
 */
export const CHEF_CONFIG = {
  /** Maximum allowed integer for expected customers and all forecast quantities. */
  maxForecastQuantity: 1000,
  timezone: CANTEEN_CONFIG.timezone,
  /** Same-day grace window opens at this Helsinki time on the target service date. */
  graceWindowOpensAt: '08:00:00',
  /** Grace window closes and the advance window for the next service opens at this Helsinki time. */
  windowSwitchAt: '08:30:00',
} as const;

export type ChefConfig = typeof CHEF_CONFIG;
