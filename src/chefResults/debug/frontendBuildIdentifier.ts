/** Stable diagnostic release id for #/chef-results?gamebusDebug=1 (not a git commit SHA). */
export const CHEF_RESULTS_DIAGNOSTIC_RELEASE_ID = 'chef-results-debug-v1';

export type ChefResultsFrontendDiagnosticIdentifier = {
  label: string;
  value: string;
};

/**
 * Diagnostic-only frontend identifier for cache/deployment verification.
 * Uses a stable release id so the value remains meaningful across commits
 * until the diagnostic bundle itself is bumped.
 */
export function getChefResultsFrontendDiagnosticIdentifier(): ChefResultsFrontendDiagnosticIdentifier {
  return {
    label: 'Frontend diagnostic version',
    value: CHEF_RESULTS_DIAGNOSTIC_RELEASE_ID,
  };
}
