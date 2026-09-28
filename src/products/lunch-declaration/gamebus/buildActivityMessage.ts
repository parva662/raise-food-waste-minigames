import type { ActiveDeclaration } from '@/products/lunch-declaration/types/declaration';
import type { DailyMealSlots, MealDraft } from '@/shared/menu/mealChoice';
import type { ActivityMessage, TaskData } from '@/platform/gamebus/types';
import {
  mapStudentLunchCheckin,
  type StudentLunchPropertyRef,
} from '@/products/lunch-declaration/gamebus/mapStudentLunchCheckin';
import {
  assertStudentLunchCheckinActivity,
  propertyRefsForStudentLunchActivity,
  STUDENT_LUNCH_CHECKIN_REF,
} from '@/products/lunch-declaration/gamebus/resolveStudentLunchProperties';
import { logStudentExpectedPropertyRefs } from '@/products/lunch-declaration/gamebus/studentGameBusSubmissionDebug';
import { selectActivityTemplate } from '@/platform/gamebus/selectActivityTemplate';

export function buildActivityMessage(
  task: TaskData,
  declaration: ActiveDeclaration,
  draft: MealDraft,
  slots: DailyMealSlots,
): ActivityMessage {
  const { reference: templateRef } = selectActivityTemplate(task, STUDENT_LUNCH_CHECKIN_REF);
  assertStudentLunchCheckinActivity(task, templateRef);

  const propertyRefs = propertyRefsForStudentLunchActivity(task, draft);
  logStudentExpectedPropertyRefs(propertyRefs);
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
