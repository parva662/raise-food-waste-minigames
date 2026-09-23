import { selectActivityTemplate } from '../gamebus/selectActivityTemplate';
import type { TaskData } from '../gamebus/types';

/**
 * One GameBus USER_TRIGGERED_EMBEDDED task may carry multiple activityTemplates.
 * Verified live on foodtracker.gamebus.eu: chef-mission / service-closeout task
 * `01a081a9-4fee-7772-b1c6-bdfc7a362ecb` lists chefForecast + kitchenServiceCloseout + wasteMeasurement.
 */
export const KITCHEN_DAY_TASK_ACTIVITY_TEMPLATES = [
  'trimSmart',
  'rescueAndReuse',
  'portionPrecision',
] as const;

export type KitchenDayTaskActivityTemplate =
  (typeof KITCHEN_DAY_TASK_ACTIVITY_TEMPLATES)[number];

export function listTaskActivityTemplateSlugs(task: TaskData): string[] {
  return (task.activityTemplates ?? []).map((template) => template.slug);
}

export function missingKitchenDayTaskTemplates(task: TaskData): string[] {
  const slugs = listTaskActivityTemplateSlugs(task);
  return KITCHEN_DAY_TASK_ACTIVITY_TEMPLATES.filter((slug) => !slugs.includes(slug));
}

export function assertKitchenDayTask(task: TaskData): void {
  const missing = missingKitchenDayTaskTemplates(task);
  if (missing.length > 0) {
    throw new Error(
      `Kitchen Day TASK is missing required activity templates: ${missing.join(', ')}`,
    );
  }
}

export function selectKitchenDayActivityTemplate(
  task: TaskData,
  slug: KitchenDayTaskActivityTemplate,
): string {
  assertKitchenDayTask(task);
  return selectActivityTemplate(task, slug).reference;
}
