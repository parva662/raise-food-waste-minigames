import type { ChefForecastDraft } from '../chef/types';
import type { TaskData } from './types';
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

  const linked = resolveLinkedPropertyRefs(activity);
  if (linked.length > 0) {
    const missingRequired = CHEF_FORECAST_REQUIRED_REFS.filter((ref) => !linked.includes(ref));
    if (missingRequired.length > 0) {
      throw new Error(
        `Activity template "${CHEF_FORECAST_REF}" missing linked property refs: ${missingRequired.join(', ')}`,
      );
    }
  }
}

/**
 * Ordered property references for chefForecast ACTIVITY.properties[].template.
 * Twelve required refs always; optional refs appended when values are present.
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

  if (linked.length === 0) {
    return [...required, ...optional];
  }

  for (const ref of required) {
    if (!linked.includes(ref)) {
      throw new Error(
        `Activity template "${CHEF_FORECAST_REF}" missing linked property ref "${ref}"`,
      );
    }
    if (FORBIDDEN_CHEF_REFS.has(ref)) {
      throw new Error(`Forbidden property ref "${ref}" on chefForecast`);
    }
  }

  for (const ref of optional) {
    if (!linked.includes(ref)) {
      throw new Error(
        `Activity template "${CHEF_FORECAST_REF}" missing linked property ref "${ref}" for entered optional value`,
      );
    }
  }

  return [...required, ...optional];
}
