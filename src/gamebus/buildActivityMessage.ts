import type { ActiveDeclaration } from '../types/declaration';
import type { DailyMealSlots, MealDraft } from '../types/mealChoice';
import type { ActivityMessage, TaskData } from './types';
import { mapStudentLunchCheckinLegacy, type StudentLunchPropertyRef } from './mapStudentLunchCheckinLegacy';
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
  const preferred = templates.find((t) => t.reference === STUDENT_LUNCH_CHECKIN_REF);
  const chosen = preferred ?? templates[0];
  return { reference: chosen.reference, name: chosen.name };
}

export function buildActivityMessage(
  task: TaskData,
  declaration: ActiveDeclaration,
  draft: MealDraft,
  slots: DailyMealSlots,
): ActivityMessage {
  const { reference: templateRef } = selectActivityTemplate(task);
  assertStudentLunchCheckinActivity(task, templateRef);

  const propertyRefs = propertyRefsForStudentLunchActivity(task);
  const values = mapStudentLunchCheckinLegacy(declaration, draft, slots);
  const start = new Date(declaration.submittedAt);
  const end = new Date(start.getTime() + 60_000);

  const properties = propertyRefs.map((ref) => ({
    template: ref,
    obj: values[ref as StudentLunchPropertyRef],
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
