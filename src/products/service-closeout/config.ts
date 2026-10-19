/**
 * Service closeout configuration.
 * Operational quantity limits align with chef forecast bounds unless product changes.
 */
export const SERVICE_CLOSEOUT_CONFIG = {
  maxQuantity: 1000,
  /** Upper bound for overproduction waste entry (grams). */
  maxWasteGrams: 1_000_000,
  /**
   * Synthetic read-only forecast when no exact-date chefForecast exists.
   * Enabled only in Vite DEV / test. Production builds must never silently
   * substitute synthetic forecasts for missing operational data.
   */
  syntheticForecastFallbackEnabled: import.meta.env.DEV,
} as const;

export type ServiceCloseoutConfig = typeof SERVICE_CLOSEOUT_CONFIG;
