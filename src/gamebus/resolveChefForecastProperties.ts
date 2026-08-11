import type { ChefForecastDraft } from '../chef/types';
import type { TaskData } from './types';
import { gamebusDevLog } from './devLog';
import {
  CHEF_FORECAST_REQUIRED_REFS,
  optionalChefForecastPropertyRefsForDraft,
  orderedChefForecastRequiredPropertyRefs,
} from './mapChefForecast';
import {
  findActivityTemplate,
  resolveLinkedPropertyRefs,
} from './resolveActivityProperties';

export const CHEF_FORECAST_REF = 'chefForecast';

const FORBIDDEN_CHEF_REFS = new Set([
  'chefId',
  'actors',
  'provider',
  'result',
  'accuracy',
  'waste',
  'points',
  'badge',
]);

function warnWhenTaskLinksIncomplete(task: TaskData): void {
  const activity = findActivityTemplate(task, CHEF_FORECAST_REF);
  if (!activity) return;

  const linked = resolveLinkedPropertyRefs(activity);
  if (linked.length === 0) return;

  const missingRequired = CHEF_FORECAST_REQUIRED_REFS.filter((ref) => !linked.includes(ref));
  if (missingRequired.length > 0) {
    gamebusDevLog('chefForecast TASK linkedProperties missing canonical refs', {
      missingRequired,
      linkedPropertyRefs: linked,
      note: 'ACTIVITY will still include all twelve required properties from the mapper',
    });
  }
}

export function assertChefForecastActivity(
  task: TaskData,
  activityReference: string,
): void {
  if (activityReference !== CHEF_FORECAST_REF) {
    throw new Error(
      `Unsupported activity template "${activityReference}" (expected ${CHEF_FORECAST_REF})`,
    );
  }
  const activity = findActivityTemplate(task, activityReference);
  if (!activity) {
    throw new Error(`Activity template "${CHEF_FORECAST_REF}" not found on TASK`);
  }

  warnWhenTaskLinksIncomplete(task);
}

/**
 * Ordered property references for chefForecast ACTIVITY.properties[].template.
 *
 * Always emits the canonical twelve required refs from the mapper — never the raw
 * TASK linkedProperties list. Older embed TASK payloads may still list only the
 * legacy seven-property chefForecast links; returning that list would omit
 * dessertItemId, forecastDessert, and timingStatus even though values exist in
 * mapChefForecastRequired().
 */
export function propertyRefsForChefForecastActivity(
  task: TaskData,
  draft: ChefForecastDraft,
): readonly string[] {
  assertChefForecastActivity(task, CHEF_FORECAST_REF);
  const activity = findActivityTemplate(task, CHEF_FORECAST_REF)!;
  const linked = resolveLinkedPropertyRefs(activity);
  const required = orderedChefForecastRequiredPropertyRefs();
  const optional = optionalChefForecastPropertyRefsForDraft(draft);

  warnWhenTaskLinksIncomplete(task);

  for (const ref of required) {
    if (FORBIDDEN_CHEF_REFS.has(ref)) {
      throw new Error(`Forbidden property ref "${ref}" on chefForecast`);
    }
  }

  for (const ref of optional) {
    if (linked.length > 0 && !linked.includes(ref)) {
      throw new Error(
        `Activity template "${CHEF_FORECAST_REF}" missing linked property ref "${ref}" for entered optional value`,
      );
    }
  }

  return [...required, ...optional];
}
