import { PowerestaClientError } from './errors.ts';
import type {
  DatedPublishedMenu,
  PowerestaLanguage,
  PowerestaRecipeDetail,
  PowerestaUnitOfMeasurement,
  PublishedMenuDiscoveryItem,
  PublishedMenuMetadata,
} from './types.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function assertOkStatus(status: number, context: string): void {
  if (status === 401) {
    throw new PowerestaClientError(`${context} unauthorized.`, 'UNAUTHORIZED', status);
  }
  if (status < 200 || status >= 300) {
    throw new PowerestaClientError(`${context} failed with HTTP ${status}.`, 'HTTP_ERROR', status);
  }
}

/**
 * Documentation shows both a single object and “list” wording.
 * Accept a single discovery item or an array; reject other shapes.
 */
export function parsePublishedMenuDiscovery(payload: unknown): PublishedMenuDiscoveryItem[] {
  if (Array.isArray(payload)) {
    return payload.map((item, index) => {
      if (!isRecord(item)) {
        throw new PowerestaClientError(
          `Published menu discovery item ${index} is not an object.`,
          'VALIDATION_FAILED',
          undefined,
          item,
        );
      }
      return item as PublishedMenuDiscoveryItem;
    });
  }
  if (isRecord(payload)) {
    return [payload as PublishedMenuDiscoveryItem];
  }
  throw new PowerestaClientError(
    'Published menu discovery response must be an object or array.',
    'VALIDATION_FAILED',
    undefined,
    payload,
  );
}

export function parsePublishedMenuMetadata(payload: unknown): PublishedMenuMetadata {
  if (!isRecord(payload)) {
    throw new PowerestaClientError(
      'Published menu metadata response must be an object.',
      'VALIDATION_FAILED',
      undefined,
      payload,
    );
  }
  return payload as PublishedMenuMetadata;
}

/**
 * Dated menu responses may be one day object or an array of day objects.
 * Pagination/envelope wrappers are undocumented — reject unknown wrappers.
 */
export function parseDatedPublishedMenus(payload: unknown): DatedPublishedMenu[] {
  if (Array.isArray(payload)) {
    return payload.map((item, index) => {
      if (!isRecord(item)) {
        throw new PowerestaClientError(
          `Dated menu item ${index} is not an object.`,
          'VALIDATION_FAILED',
          undefined,
          item,
        );
      }
      return item as DatedPublishedMenu;
    });
  }
  if (isRecord(payload)) {
    return [payload as DatedPublishedMenu];
  }
  throw new PowerestaClientError(
    'Dated published menu response must be an object or array.',
    'VALIDATION_FAILED',
    undefined,
    payload,
  );
}

export function parseLanguages(payload: unknown): PowerestaLanguage[] {
  if (Array.isArray(payload)) {
    return payload.map((item, index) => {
      if (!isRecord(item)) {
        throw new PowerestaClientError(
          `Language item ${index} is not an object.`,
          'VALIDATION_FAILED',
          undefined,
          item,
        );
      }
      return item as PowerestaLanguage;
    });
  }
  if (isRecord(payload)) {
    return [payload as PowerestaLanguage];
  }
  throw new PowerestaClientError(
    'Languages response must be an object or array.',
    'VALIDATION_FAILED',
    undefined,
    payload,
  );
}

export function parseUnitOfMeasurement(payload: unknown): PowerestaUnitOfMeasurement {
  if (!isRecord(payload)) {
    throw new PowerestaClientError(
      'Unit of measurement response must be an object.',
      'VALIDATION_FAILED',
      undefined,
      payload,
    );
  }
  return payload as PowerestaUnitOfMeasurement;
}

/**
 * Recipe list documentation shows a single object example while describing “all entities”.
 * Accept one object or an array; do not invent pagination parsing.
 */
export function parseRecipeList(payload: unknown): PowerestaRecipeDetail[] {
  if (Array.isArray(payload)) {
    return payload.map((item, index) => {
      if (!isRecord(item)) {
        throw new PowerestaClientError(
          `Recipe list item ${index} is not an object.`,
          'VALIDATION_FAILED',
          undefined,
          item,
        );
      }
      return item as PowerestaRecipeDetail;
    });
  }
  if (isRecord(payload)) {
    return [payload as PowerestaRecipeDetail];
  }
  throw new PowerestaClientError(
    'Recipe list response must be an object or array.',
    'VALIDATION_FAILED',
    undefined,
    payload,
  );
}

export function parseRecipeDetail(payload: unknown): PowerestaRecipeDetail {
  if (!isRecord(payload)) {
    throw new PowerestaClientError(
      'Recipe detail response must be an object.',
      'VALIDATION_FAILED',
      undefined,
      payload,
    );
  }
  return payload as PowerestaRecipeDetail;
}
