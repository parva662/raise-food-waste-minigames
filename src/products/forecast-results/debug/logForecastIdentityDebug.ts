import {
  extractGroupActivities,
  filterActivitiesByTemplateReference,
  getActivityTemplateReference,
  getRawKitchenGroupActivitiesInput,
} from '@/platform/gamebus/groupActivities';
import { getAuthenticatedGameBusUser } from '@/platform/gamebus/inputCollections';
import type { GameBusInputCollectionsPayload } from '@/platform/gamebus/types';
import { readGameBusSlug } from '@/platform/gamebus/gameBusSlug';
import { isForecastResultsGameBusDebugMode } from '@/products/forecast-results/debug/forecastResultsInvestigation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readActorId(activity: unknown): string | null {
  if (!isRecord(activity)) return null;
  const actor = activity.actor;
  if (!isRecord(actor)) return null;
  if (typeof actor.id === 'string' && actor.id.trim()) return actor.id.trim();
  if (typeof actor.id === 'number' && Number.isFinite(actor.id)) return String(actor.id);
  return null;
}

function readPropertyString(activity: unknown, slug: string): string | null {
  if (!isRecord(activity) || !Array.isArray(activity.properties)) return null;
  for (const property of activity.properties) {
    if (!isRecord(property)) continue;
    const ref = readGameBusSlug(property.template);
    if (ref !== slug) continue;
    const value = property.value;
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (isRecord(value)) {
      const nested = value.value;
      if (typeof nested === 'string' && nested.trim()) return nested.trim();
      if (typeof nested === 'number' && Number.isFinite(nested)) return String(nested);
    }
  }
  return null;
}

export type ForecastIdentityDebugSnapshot = {
  authenticatedUserId: string | null;
  uniqueForecastActorIds: readonly string[];
  forecastsMatchingAuthenticatedUser: number;
  matchingTargetDates: readonly string[];
  closeoutServiceDates: readonly string[];
};

/**
 * Scalar-only identity snapshot for #/chef-results?gamebusDebug=1.
 * Avoids console objects that some GameBus log UIs collapse to "Object".
 */
export function buildForecastIdentityDebugSnapshot(
  payload: GameBusInputCollectionsPayload | null,
): ForecastIdentityDebugSnapshot {
  const authenticatedUserId = getAuthenticatedGameBusUser(payload)?.id ?? null;
  const activities = extractGroupActivities(getRawKitchenGroupActivitiesInput(payload));
  const forecasts = filterActivitiesByTemplateReference(activities, 'chefForecast');
  const closeouts = filterActivitiesByTemplateReference(activities, 'wasteMeasurement');

  const uniqueForecastActorIds = [
    ...new Set(
      forecasts
        .map((activity) => readActorId(activity))
        .filter((id): id is string => Boolean(id)),
    ),
  ].sort();

  const matchingTargetDates = forecasts
    .filter((activity) => readActorId(activity) === authenticatedUserId)
    .map((activity) => readPropertyString(activity, 'targetDate'))
    .filter((date): date is string => Boolean(date))
    .sort();

  const closeoutServiceDates = [
    ...new Set(
      closeouts
        .map((activity) => readPropertyString(activity, 'serviceDate'))
        .filter((date): date is string => Boolean(date)),
    ),
  ].sort();

  return {
    authenticatedUserId,
    uniqueForecastActorIds,
    forecastsMatchingAuthenticatedUser: matchingTargetDates.length,
    matchingTargetDates: [...new Set(matchingTargetDates)].sort(),
    closeoutServiceDates,
  };
}

/** Logs identity scalars as plain strings when gamebusDebug=1. No names. */
export function logForecastIdentityDebug(payload: GameBusInputCollectionsPayload | null): void {
  if (!isForecastResultsGameBusDebugMode()) return;

  const snapshot = buildForecastIdentityDebugSnapshot(payload);
  console.info(`Authenticated user ID: ${snapshot.authenticatedUserId ?? '(none)'}`);
  console.info(`Unique Forecast actor IDs: ${snapshot.uniqueForecastActorIds.join(', ') || '(none)'}`);
  console.info(`Forecasts matching authenticated user: ${snapshot.forecastsMatchingAuthenticatedUser}`);
  console.info(`Relevant targetDates: ${snapshot.matchingTargetDates.join(', ') || '(none)'}`);
  console.info(`Relevant closeout serviceDates: ${snapshot.closeoutServiceDates.join(', ') || '(none)'}`);

  // Keep template presence as a scalar line for payload sanity (no activity bodies).
  const activities = extractGroupActivities(getRawKitchenGroupActivitiesInput(payload));
  const templateCounts = activities.reduce<Record<string, number>>((counts, activity) => {
    const ref = getActivityTemplateReference(activity) ?? '(missing)';
    counts[ref] = (counts[ref] ?? 0) + 1;
    return counts;
  }, {});
  console.info(
    `Group activity templates: ${
      Object.entries(templateCounts)
        .map(([ref, count]) => `${ref}=${count}`)
        .join(', ') || '(none)'
    }`,
  );
}
