import { isChefResultsGameBusDebugMode } from '../gamebus/chefResultsInvestigation';

export function formatRawInputCollectionsJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export function isParentInputCollectionsMessage(event: MessageEvent): boolean {
  if (event.source !== window.parent) return false;
  const payload = event.data;
  if (typeof payload !== 'object' || payload === null) return false;
  return (payload as { type?: unknown }).type === 'INPUT_COLLECTIONS';
}

export function extractInputCollectionsData(event: MessageEvent): unknown {
  const payload = event.data as { data?: unknown };
  return payload.data;
}

/**
 * Independent parent-message listener for raw INPUT_COLLECTIONS capture.
 * Does not use the GameBus bridge or parsers.
 */
export function startRawInputCollectionsCapture(
  onCapture: (data: unknown) => void,
): () => void {
  if (!isChefResultsGameBusDebugMode() || typeof window === 'undefined') {
    return () => {};
  }

  const handleMessage = (event: MessageEvent) => {
    if (!isParentInputCollectionsMessage(event)) return;
    const data = extractInputCollectionsData(event);
    console.info('[gamebus] RAW INPUT_COLLECTIONS data', data);
    onCapture(data);
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}
