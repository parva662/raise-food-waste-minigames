import { tryPostBuiltActivity, type ActivityPostResult } from '@/platform/gamebus/bridge';
import type { DailyMealSlots } from '@/shared/menu/mealChoice';
import { buildChefActivityMessage } from '@/products/kitchen-forecast/gamebus/buildChefActivityMessage';
import {
  armChefParentMessageDiagnostic,
  logChefActivityBeforePostMessage,
  logChefPostMessageReturned,
  logChefSubmissionException,
  logChefTaskBeforeSubmission,
} from '@/products/kitchen-forecast/gamebus/chefGameBusSubmissionDebug';
import type { ChefForecastDraft, ChefForecastSubmission } from '@/products/kitchen-forecast/types';

export function tryPostChefActivity(
  submission: ChefForecastSubmission,
  draft: ChefForecastDraft,
  slots: DailyMealSlots,
): ActivityPostResult {
  return tryPostBuiltActivity(
    (task) => buildChefActivityMessage(task, submission, draft, slots),
    { type: 'chef-date', targetDate: submission.targetDate },
    {
      logTask: logChefTaskBeforeSubmission,
      beforePost: (message) => {
        armChefParentMessageDiagnostic();
        logChefActivityBeforePostMessage(message);
      },
      afterPost: logChefPostMessageReturned,
      onError: logChefSubmissionException,
      devPayloadLabel: 'chefForecast',
    },
  );
}
