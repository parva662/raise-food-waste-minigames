import { isChefResultsGameBusDebugMode } from './chefResultsInvestigation';

const PREFIX = '[gamebus]';

function isGameBusInvestigationLoggingEnabled(): boolean {
  return import.meta.env.DEV || isChefResultsGameBusDebugMode();
}

export function gamebusDevLog(event: string, detail?: Record<string, unknown>): void {
  if (!isGameBusInvestigationLoggingEnabled()) return;
  if (detail) {
    console.info(PREFIX, event, detail);
  } else {
    console.info(PREFIX, event);
  }
}
