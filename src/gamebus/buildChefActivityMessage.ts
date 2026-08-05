import type { DailyMealSlots } from '../types/mealChoice';
import type { ChefForecastDraft, ChefForecastSubmission } from '../chef/types';
import { isChefForecastComplete } from '../chef/types';
import type { ActivityMessage, TaskData } from './types';
import { CHEF_ACTIVITY_REF } from './appMode';
import {
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

  const properties = propertyRefs.map((ref) => ({
    template: ref,
    obj: values[ref as ChefForecastPropertyRef] as Record<string, unknown>,
  }));

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
