import { tryPostBuiltActivity, type ActivityPostResult } from '@/platform/gamebus/bridge';
import type { DailyMealSlots, MealDraft } from '@/shared/menu/mealChoice';
import { buildActivityMessage } from '@/products/lunch-declaration/gamebus/buildActivityMessage';
import {
  logStudentActivityBeforePostMessage,
  logStudentPostMessageReturned,
  logStudentSubmissionException,
  logStudentTaskBeforeSubmission,
} from '@/products/lunch-declaration/gamebus/studentGameBusSubmissionDebug';
import type { ActiveDeclaration } from '@/products/lunch-declaration/types/declaration';

export function tryPostActivity(
  declaration: ActiveDeclaration,
  draft: MealDraft,
  slots: DailyMealSlots,
): ActivityPostResult {
  return tryPostBuiltActivity(
    (task) => buildActivityMessage(task, declaration, draft, slots),
    { type: 'once' },
    {
      logTask: logStudentTaskBeforeSubmission,
      beforePost: logStudentActivityBeforePostMessage,
      afterPost: logStudentPostMessageReturned,
      onError: logStudentSubmissionException,
    },
  );
}
