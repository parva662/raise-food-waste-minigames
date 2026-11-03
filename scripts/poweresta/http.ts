import { isPowerestaLiveNetworkEnabled } from './config.ts';
import { PowerestaClientError } from './errors.ts';
import type { PowerestaHttpRequest, PowerestaHttpResponse, PowerestaTransport } from './types.ts';

/**
 * Default transport refuses live network unless POWERESTA_LIVE_NETWORK=1.
 * Offline tests must inject a fake transport.
 */
export function createDisabledLiveTransport(): PowerestaTransport {
  return async () => {
    throw new PowerestaClientError(
      'Live PoweResta network access is disabled. Set POWERESTA_LIVE_NETWORK=1 only after provider authorization.',
      'LIVE_NETWORK_DISABLED',
    );
  };
}

/**
 * Optional real fetch transport for future authorized server-side use.
 * Still blocked unless POWERESTA_LIVE_NETWORK=1. Never attaches cookies.
 */
export function createFetchTransport(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): PowerestaTransport {
  return async (request: PowerestaHttpRequest): Promise<PowerestaHttpResponse> => {
    if (!isPowerestaLiveNetworkEnabled(env)) {
      throw new PowerestaClientError(
        'Live PoweResta network access is disabled by default.',
        'LIVE_NETWORK_DISABLED',
      );
    }
    const response = await fetchImpl(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      // Documented: do not forward login cookies.
      credentials: 'omit',
    });
    const headerEntries: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headerEntries[key] = value;
    });
    return {
      status: response.status,
      headers: headerEntries,
      bodyText: await response.text(),
    };
  };
}

export function parseJsonBody(bodyText: string, context: string): unknown {
  try {
    return JSON.parse(bodyText) as unknown;
  } catch {
    throw new PowerestaClientError(`${context} returned malformed JSON.`, 'MALFORMED_JSON');
  }
}
