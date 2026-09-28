const PREFIX = '[gamebus]';
const GAMEBUS_DEBUG_PARAM = 'gamebusDebug';

function hashRequestsGameBusDebug(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash;
  const queryStart = hash.indexOf('?');
  if (queryStart === -1) return false;
  return new URLSearchParams(hash.slice(queryStart + 1)).get(GAMEBUS_DEBUG_PARAM) === '1';
}

function isGameBusInvestigationLoggingEnabled(): boolean {
  return import.meta.env.DEV || hashRequestsGameBusDebug();
}

export function gamebusDevLog(event: string, detail?: Record<string, unknown>): void {
  if (!isGameBusInvestigationLoggingEnabled()) return;
  if (detail) {
    console.info(PREFIX, event, detail);
  } else {
    console.info(PREFIX, event);
  }
}
