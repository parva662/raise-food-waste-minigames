import type { GameBusInputCollectionsPayload } from './types';

/** Canonical GameBus Input Collection key (admin configuration). */
export const SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY = 'serviceCloseoutInput';

/**
 * Legacy compatibility alias — older embed payloads nested chefForecasts under the plural key.
 * @deprecated Prefer {@link SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY}; retained for backwards compatibility.
 */
export const SERVICE_CLOSEOUT_INPUTS_COLLECTION_KEY_LEGACY = 'serviceCloseoutInputs';

/** @deprecated Use {@link SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY}. */
export const SERVICE_CLOSEOUT_INPUTS_COLLECTION_KEY = SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY;

/** Input Request key within the service closeout collection (chefForecast activities query). */
export const SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY = 'chefForecasts';

const SERVICE_CLOSEOUT_COLLECTION_LOOKUP_KEYS = [
  SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY,
  SERVICE_CLOSEOUT_INPUTS_COLLECTION_KEY_LEGACY,
] as const;

function getChefForecastsFromCollectionKey(
  payload: GameBusInputCollectionsPayload,
  collectionKey: string,
): unknown | undefined {
  const collection = payload[collectionKey];
  if (collection === null || typeof collection !== 'object' || Array.isArray(collection)) {
    return undefined;
  }
  const nested = (collection as Record<string, unknown>)[SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY];
  return nested === undefined ? undefined : nested;
}

export function getInputCollectionKeys(
  payload: GameBusInputCollectionsPayload | null,
): readonly string[] {
  if (!payload) return [];
  return Object.keys(payload);
}

/**
 * Returns the raw `chefForecasts` value without parsing the API response shape.
 *
 * Lookup order:
 * 1. `data.serviceCloseoutInput.chefForecasts` (canonical)
 * 2. `data.serviceCloseoutInputs.chefForecasts` (legacy compatibility)
 * 3. top-level `data.chefForecasts` (flat fallback)
 */
export function getRawChefForecastsInput(
  payload: GameBusInputCollectionsPayload | null,
): unknown {
  if (!payload) return undefined;

  for (const collectionKey of SERVICE_CLOSEOUT_COLLECTION_LOOKUP_KEYS) {
    const nested = getChefForecastsFromCollectionKey(payload, collectionKey);
    if (nested !== undefined) {
      return nested;
    }
  }

  return payload[SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY];
}
