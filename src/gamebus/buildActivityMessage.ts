import type { ActiveDeclaration } from '../types/declaration';
import type { DailyMealSlots, MealDraft } from '../types/mealChoice';
import type { ActivityMessage, TaskData } from './types';
import {
  mapStudentLunchCheckin,
  type StudentLunchPropertyRef,
} from './mapStudentLunchCheckin';
import {
  assertStudentLunchCheckinActivity,
  propertyRefsForStudentLunchActivity,
  STUDENT_LUNCH_CHECKIN_REF,
} from './resolveActivityProperties';

export function selectActivityTemplate(task: TaskData): {
  reference: string;
  name: string | null;
} {
  const templates = task.activityTemplates ?? [];
  if (templates.length === 0) {
    throw new Error('TASK has no activityTemplates');
  }

  const activity = templates.find((t) => t.reference === STUDENT_LUNCH_CHECKIN_REF);
  if (!activity) {
    const found = templates.map((t) => t.reference).join(', ');
    throw new Error(
      `TASK has no supported lunch activity template (expected ${STUDENT_LUNCH_CHECKIN_REF}). Found: ${found || '(none)'}`,
    );
  }

  return { reference: activity.reference, name: activity.name };
}

export function buildActivityMessage(
  task: TaskData,
  declaration: ActiveDeclaration,
  draft: MealDraft,
  slots: DailyMealSlots,
): ActivityMessage {
  const { reference: templateRef } = selectActivityTemplate(task);
  assertStudentLunchCheckinActivity(task, templateRef);

  const propertyRefs = propertyRefsForStudentLunchActivity(task, draft);
  const values = mapStudentLunchCheckin(declaration, draft, slots);
  const start = new Date(declaration.submittedAt);
  const end = new Date(start.getTime() + 60_000);

  const properties = propertyRefs.map((ref) => ({
    template: ref,
    obj: values[ref as StudentLunchPropertyRef] as Record<string, unknown>,
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
