/**
 * Service closeout configuration.
 * Operational quantity limits align with chef forecast bounds unless product changes.
 */
export const SERVICE_CLOSEOUT_CONFIG = {
  maxQuantity: 1000,
  /** Upper bound for overproduction waste entry (grams). */
  maxWasteGrams: 1_000_000,
  /**
   * RAISE test phase: when no exact-date chefForecast exists in INPUT_COLLECTIONS,
   * show a synthetic read-only forecast. Set to false before production data collection.
   */
  syntheticForecastFallbackEnabled: true,
} as const;

export type ServiceCloseoutConfig = typeof SERVICE_CLOSEOUT_CONFIG;
