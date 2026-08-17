/**
 * Temporary diagnostic for Custom Embed Page parent-message shape discovery.
 * Enabled in DEV or with #/chef-results?gamebusDebug=1 on deployed builds.
 */
import { isChefResultsGameBusInvestigationEnabled } from '../gamebus/chefResultsInvestigation';

export function startChefResultsRawParentMessageDiagnostic(): () => void {
  if (!isChefResultsGameBusInvestigationEnabled() || typeof window === 'undefined') {
    return () => {};
  }

  const logRawParentMessage = (event: MessageEvent) => {
    if (event.source !== window.parent) return;

    const data = event.data;
    const summary: {
      dataType: string;
      origin: string;
      keys?: string[];
      type?: string;
    } = {
      dataType: typeof data,
      origin: event.origin,
    };

    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      summary.keys = Object.keys(data);
      if ('type' in data && typeof (data as { type: unknown }).type === 'string') {
        summary.type = (data as { type: string }).type;
      }
    }

    console.info('[gamebus] raw parent message', summary);
  };

  window.addEventListener('message', logRawParentMessage, true);
  return () => window.removeEventListener('message', logRawParentMessage, true);
}
