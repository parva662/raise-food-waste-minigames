import type { DailyMealSlots } from '../types/mealChoice';
import type { ChefForecastDraft, ChefForecastSubmission } from '../chef/types';
import { isChefForecastComplete } from '../chef/types';
import type { ActivityMessage, TaskData } from './types';
import { CHEF_ACTIVITY_REF } from './appMode';
import {
  CHEF_FORECAST_REQUIRED_REFS,
  mapChefForecastOptional,
  mapChefForecastRequired,
  type ChefForecastPropertyRef,
} from './mapChefForecast';
import {
  assertChefForecastActivity,
  propertyRefsForChefForecastActivity,
} from './resolveChefForecastProperties';
import { selectActivityTemplate } from './selectActivityTemplate';

export function buildChefActivityMessage(
  task: TaskData,
  submission: ChefForecastSubmission,
  draft: ChefForecastDraft,
  slots: DailyMealSlots,
): ActivityMessage {
  const { reference: templateRef } = selectActivityTemplate(task, CHEF_ACTIVITY_REF);
  assertChefForecastActivity(task, templateRef);

  if (!isChefForecastComplete(draft)) {
    throw new Error('Chef forecast draft is incomplete');
  }

  const propertyRefs = propertyRefsForChefForecastActivity(task, draft);
  const requiredValues = mapChefForecastRequired(submission, draft, slots);
  const optionalValues = mapChefForecastOptional(draft);
  const values = { ...requiredValues, ...optionalValues };
  const start = new Date(submission.submittedAt);
  const end = new Date(start.getTime() + 60_000);

  const properties = propertyRefs.map((ref) => {
    const obj = values[ref as ChefForecastPropertyRef];
    if (obj === undefined) {
      throw new Error(`Missing chefForecast value for property "${ref}"`);
    }
    return {
      template: ref,
      obj: obj as Record<string, unknown>,
    };
  });

  const templates = properties.map((property) => property.template);
  const missingRequired = CHEF_FORECAST_REQUIRED_REFS.filter((ref) => !templates.includes(ref));
  if (missingRequired.length > 0) {
    throw new Error(
      `chefForecast ACTIVITY missing required properties: ${missingRequired.join(', ')}`,
    );
  }

  return {
    type: 'ACTIVITY',
    data: {
      template: templateRef,
      start: start.toISOString(),
      end: end.toISOString(),
      properties,
    },
  };
}
