import { gamebusDevLog } from './devLog';
import { readGameBusLinkedPropertySlug, readGameBusSlug } from './gameBusSlug';
import {
  findActivityTemplate,
  resolveLinkedPropertyRefs,
  STUDENT_LUNCH_CHECKIN_REF,
} from './resolveActivityProperties';
import type { TaskActivityTemplate, TaskData } from './types';

function linkedPropertyIds(activity: TaskActivityTemplate | undefined): { ref: string; id?: string }[] {
  if (!activity?.linkedProperties?.length) return [];
  const out: { ref: string; id?: string }[] = [];
  for (const item of activity.linkedProperties) {
    const ref = readGameBusLinkedPropertySlug(item);
    if (!ref) continue;
    out.push({ ref, id: typeof item.id === 'string' ? item.id : undefined });
  }
  return out;
}

function embeddedPropertyIds(
  activity: TaskActivityTemplate | undefined,
): { slug: string; id?: string }[] {
  if (!activity?.properties?.length) return [];
  const out: { slug: string; id?: string }[] = [];
  for (const item of activity.properties) {
    const slug = readGameBusSlug(item);
    if (!slug) continue;
    out.push({
      slug,
      id: typeof item.id === 'string' ? item.id : undefined,
    });
  }
  return out;
}

/** Dev-only: log TASK integration shape without user/auth payload. */
export function logTaskStructureSanitized(task: TaskData): void {
  const dataKeys = Object.keys(task);
  const activityTemplates = task.activityTemplates ?? [];
  const student = findActivityTemplate(task, STUDENT_LUNCH_CHECKIN_REF);
  const selected = student ?? activityTemplates[0];

  gamebusDevLog('TASK structure', {
    dataKeys,
    activityTemplateCount: activityTemplates.length,
    activityTemplateSlugs: activityTemplates.map((t) => t.slug),
    taskLevelPropertyTemplateCount: task.propertyTemplates?.length ?? 0,
    taskLevelPropertySlugs: (task.propertyTemplates ?? []).map((p) => ({
      slug: p.slug,
      id: p.id,
    })),
    selectedActivitySlug: selected?.slug ?? null,
    selectedActivityKeys: selected ? Object.keys(selected) : [],
    linkedPropertyRefs: selected ? resolveLinkedPropertyRefs(selected) : [],
    linkedPropertyIds: linkedPropertyIds(selected),
    embeddedPropertyIds: embeddedPropertyIds(selected),
    propertySource: (() => {
      if (!selected) return 'none';
      const fromActivity = resolveLinkedPropertyRefs(selected);
      if (fromActivity.length > 0) {
        if (selected.linkedProperties?.length) return 'activityTemplates[].linkedProperties';
        if (selected.properties?.length) return 'activityTemplates[].properties';
      }
      if ((task.propertyTemplates?.length ?? 0) > 0) return 'TASK.data.propertyTemplates';
      return 'none';
    })(),
  });
}
