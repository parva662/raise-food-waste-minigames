import { buildKitchenDayTrimSmartActivityMessage } from '../gamebus/buildKitchenDayTrimSmartActivityMessage';
import { buildPortionPrecisionActivityMessage } from '../gamebus/buildPortionPrecisionActivityMessage';
import { buildRescueAndReuseActivityMessage } from '../gamebus/buildRescueAndReuseActivityMessage';
import { buildWastePracticeReviewActivityMessage } from '../gamebus/buildWastePracticeReviewActivityMessage';
import { getGameBusTask } from '../gamebus/bridge';
import type { ActivityMessage, TaskData } from '../gamebus/types';
import {
  KITCHEN_DAY_STUDENT_LIVE_BLOCK_REASON,
  KITCHEN_DAY_TUTOR_LIVE_BLOCK_REASON,
  canPostKitchenDayStudentActivity,
  canPostKitchenDayTutorReview,
} from './liveIntegration';
import type {
  KitchenDayPortionEntry,
  KitchenDayRescueEntry,
  KitchenDayReviewEntry,
  KitchenDayTrimEntry,
} from './types';

export type KitchenDayPostResult =
  | { ok: true; status: 'posted_awaiting_persist'; message: ActivityMessage }
  | { ok: false; reason: string };

const attemptedKeys = new Set<string>();
let postInFlight = false;

export function resetKitchenDayPostStateForTests(): void {
  attemptedKeys.clear();
  postInFlight = false;
}

export function tryPostKitchenDayActivity(
  task: TaskData | null,
  messageBuilder: (task: TaskData) => ActivityMessage,
  attemptKey: string,
  canPost: boolean,
  blockReason: string,
): KitchenDayPostResult {
  if (!canPost) {
    return { ok: false, reason: blockReason };
  }
  if (!task) {
    return { ok: false, reason: 'no_task' };
  }
  if (attemptedKeys.has(attemptKey)) {
    return { ok: false, reason: 'duplicate' };
  }
  if (postInFlight) {
    return { ok: false, reason: 'in_flight' };
  }

  postInFlight = true;
  try {
    const message = messageBuilder(task);
    window.parent.postMessage(message, '*');
    attemptedKeys.add(attemptKey);
    return { ok: true, status: 'posted_awaiting_persist', message };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'build_failed',
    };
  } finally {
    postInFlight = false;
  }
}

export function tryPostKitchenDayTrim(entry: KitchenDayTrimEntry): KitchenDayPostResult {
  return tryPostKitchenDayActivity(
    getGameBusTask(),
    (task) => buildKitchenDayTrimSmartActivityMessage(task, entry),
    `trim:${entry.sessionId}:${entry.ingredientId}`,
    canPostKitchenDayStudentActivity(),
    KITCHEN_DAY_STUDENT_LIVE_BLOCK_REASON,
  );
}

export function tryPostKitchenDayRescue(entry: KitchenDayRescueEntry): KitchenDayPostResult {
  return tryPostKitchenDayActivity(
    getGameBusTask(),
    (task) => buildRescueAndReuseActivityMessage(task, entry),
    `rescue:${entry.sessionId}:${entry.ingredientId}`,
    canPostKitchenDayStudentActivity(),
    KITCHEN_DAY_STUDENT_LIVE_BLOCK_REASON,
  );
}

export function tryPostKitchenDayPortion(entry: KitchenDayPortionEntry): KitchenDayPostResult {
  return tryPostKitchenDayActivity(
    getGameBusTask(),
    (task) => buildPortionPrecisionActivityMessage(task, entry),
    `portion:${entry.sessionId}:${entry.recipeId}:${entry.submittedAt}`,
    canPostKitchenDayStudentActivity(),
    KITCHEN_DAY_STUDENT_LIVE_BLOCK_REASON,
  );
}

export function tryPostKitchenDayReview(entry: KitchenDayReviewEntry): KitchenDayPostResult {
  return tryPostKitchenDayActivity(
    getGameBusTask(),
    (task) => buildWastePracticeReviewActivityMessage(task, entry),
    `review:${entry.sessionId}`,
    canPostKitchenDayTutorReview(),
    KITCHEN_DAY_TUTOR_LIVE_BLOCK_REASON,
  );
}
