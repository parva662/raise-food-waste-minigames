import type { TaskData } from '@/platform/gamebus/types';

export function selectActivityTemplate(
  task: TaskData,
  expectedRef: string,
): {
  reference: string;
  name: string | null;
} {
  const templates = task.activityTemplates ?? [];
  if (templates.length === 0) {
    throw new Error('TASK has no activityTemplates');
  }

  const activity = templates.find((t) => t.slug === expectedRef);
  if (!activity) {
    const found = templates.map((t) => t.slug).join(', ');
    throw new Error(
      `TASK has no supported activity template (expected ${expectedRef}). Found: ${found || '(none)'}`,
    );
  }

  return { reference: activity.slug, name: activity.name };
}
