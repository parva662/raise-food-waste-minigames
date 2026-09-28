const CHEF_RESULTS_HASH_PREFIX = '#/chef-results';
const GAMEBUS_DEBUG_PARAM = 'gamebusDebug';

/**
 * Temporary deployed investigation flag for #/chef-results only.
 * Example: #/chef-results?gamebusDebug=1
 */
export function isChefResultsGameBusDebugMode(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash;
  if (!hash.startsWith(CHEF_RESULTS_HASH_PREFIX)) return false;

  const queryStart = hash.indexOf('?');
  if (queryStart === -1) return false;

  return new URLSearchParams(hash.slice(queryStart + 1)).get(GAMEBUS_DEBUG_PARAM) === '1';
}

/** DEV build or explicit #/chef-results?gamebusDebug=1 on deployed builds. */
export function isChefResultsGameBusInvestigationEnabled(): boolean {
  return import.meta.env.DEV || isChefResultsGameBusDebugMode();
}
