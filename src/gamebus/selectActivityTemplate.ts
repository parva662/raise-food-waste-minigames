import type { TaskData } from './types';
import { STUDENT_LUNCH_CHECKIN_REF } from './resolveActivityProperties';

export function selectActivityTemplate(
  task: TaskData,
  expectedRef: string = STUDENT_LUNCH_CHECKIN_REF,
): {
  reference: string;
  name: string | null;
} {
  const templates = task.activityTemplates ?? [];
  if (templates.length === 0) {
    throw new Error('TASK has no activityTemplates');
  }

  const activity = templates.find((t) => t.reference === expectedRef);
  if (!activity) {
    const found = templates.map((t) => t.reference).join(', ');
    throw new Error(
      `TASK has no supported activity template (expected ${expectedRef}). Found: ${found || '(none)'}`,
    );
  }

  return { reference: activity.reference, name: activity.name };
}
