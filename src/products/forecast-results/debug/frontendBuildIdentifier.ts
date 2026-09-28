/** Stable diagnostic release id for #/chef-results?gamebusDebug=1 (not a git commit SHA). */
export const FORECAST_RESULTS_DIAGNOSTIC_RELEASE_ID = 'chef-results-debug-v1';

export type ForecastResultsFrontendDiagnosticIdentifier = {
  label: string;
  value: string;
};

/**
 * Diagnostic-only frontend identifier for cache/deployment verification.
 * Uses a stable release id so the value remains meaningful across commits
 * until the diagnostic bundle itself is bumped.
 */
export function getForecastResultsFrontendDiagnosticIdentifier(): ForecastResultsFrontendDiagnosticIdentifier {
  return {
    label: 'Frontend diagnostic version',
    value: FORECAST_RESULTS_DIAGNOSTIC_RELEASE_ID,
  };
}
