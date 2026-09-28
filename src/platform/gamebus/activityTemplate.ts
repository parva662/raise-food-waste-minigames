import { readGameBusLinkedPropertySlug, readGameBusSlug } from '@/platform/gamebus/gameBusSlug';
import type { TaskActivityTemplate, TaskData } from '@/platform/gamebus/types';

export function findActivityTemplate(
  task: TaskData,
  reference: string,
): TaskActivityTemplate | undefined {
  return (task.activityTemplates ?? []).find((t) => t.slug === reference);
}

/** Property template slugs linked to an activity template (runtime TASK shape). */
export function resolveLinkedPropertyRefs(activity: TaskActivityTemplate): string[] {
  const linked = activity.linkedProperties;
  if (Array.isArray(linked) && linked.length > 0) {
    return [...linked]
      .sort((a, b) => {
        const ao = typeof a.order === 'number' ? a.order : 0;
        const bo = typeof b.order === 'number' ? b.order : 0;
        return ao - bo;
      })
      .map(readGameBusLinkedPropertySlug)
      .filter((ref): ref is string => Boolean(ref));
  }

  const embedded = activity.properties;
  if (Array.isArray(embedded) && embedded.length > 0) {
    return embedded.map((item) => readGameBusSlug(item)).filter((ref): ref is string => Boolean(ref));
  }

  return [];
}

export function resolvePropertyRefsForActivity(
  task: TaskData,
  activityReference: string,
): string[] {
  const activity = findActivityTemplate(task, activityReference);
  if (!activity) {
    throw new Error(`Activity template "${activityReference}" not found on TASK`);
  }

  const fromActivity = resolveLinkedPropertyRefs(activity);
  if (fromActivity.length > 0) return fromActivity;

  const fromTaskLevel = (task.propertyTemplates ?? [])
    .map((p) => p.slug)
    .filter((ref) => ref.length > 0);
  if (fromTaskLevel.length > 0) return fromTaskLevel;

  return [];
}
