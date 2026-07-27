import { gamebusDevLog } from './devLog';
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
    const ref =
      typeof item.ref === 'string' && item.ref
        ? item.ref
        : typeof item.reference === 'string' && item.reference
          ? item.reference
          : '';
    if (!ref) continue;
    out.push({ ref, id: typeof item.id === 'string' ? item.id : undefined });
  }
  return out;
}

function embeddedPropertyIds(
  activity: TaskActivityTemplate | undefined,
): { reference: string; id?: string }[] {
  if (!activity?.properties?.length) return [];
  const out: { reference: string; id?: string }[] = [];
  for (const item of activity.properties) {
    if (typeof item.reference !== 'string' || !item.reference) continue;
    out.push({
      reference: item.reference,
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
    activityTemplateRefs: activityTemplates.map((t) => t.reference),
    taskLevelPropertyTemplateCount: task.propertyTemplates?.length ?? 0,
    taskLevelPropertyRefs: (task.propertyTemplates ?? []).map((p) => ({
      reference: p.reference,
      id: p.id,
    })),
    selectedActivityReference: selected?.reference ?? null,
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
