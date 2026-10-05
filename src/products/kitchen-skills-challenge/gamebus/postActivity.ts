import { buildKitchenSkillsTrimSmartActivityMessage } from '@/products/kitchen-skills-challenge/gamebus/buildKitchenSkillsTrimSmartActivityMessage';
import { buildPortionPrecisionActivityMessage } from '@/products/kitchen-skills-challenge/gamebus/buildPortionPrecisionActivityMessage';
import { buildRescueAndReuseActivityMessage } from '@/products/kitchen-skills-challenge/gamebus/buildRescueAndReuseActivityMessage';
import { buildWastePracticeReviewActivityMessage } from '@/products/kitchen-skills-challenge/gamebus/buildWastePracticeReviewActivityMessage';
import { getGameBusTask } from '@/platform/gamebus/bridge';
import type { GameBusOutboundActivityMessage, TaskData } from '@/platform/gamebus/types';
import {
  KITCHEN_SKILLS_STUDENT_LIVE_BLOCK_REASON,
  KITCHEN_SKILLS_TRAINER_LIVE_BLOCK_REASON,
  canPostKitchenSkillsStudentActivity,
  canPostKitchenSkillsTrainerReview,
} from '@/products/kitchen-skills-challenge/gamebus/liveIntegration';
import type {
  KitchenSkillsPortionEntry,
  KitchenSkillsRescueEntry,
  KitchenSkillsReviewEntry,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';

export type KitchenSkillsPostResult =
  | { ok: true; status: 'posted_awaiting_persist'; message: GameBusOutboundActivityMessage }
  | { ok: false; reason: string };

const attemptedKeys = new Set<string>();
let postInFlight = false;

export function resetKitchenSkillsPostStateForTests(): void {
  attemptedKeys.clear();
  postInFlight = false;
}

export function tryPostKitchenSkillsActivity(
  task: TaskData | null,
  messageBuilder: (task: TaskData) => GameBusOutboundActivityMessage,
  attemptKey: string,
  canPost: boolean,
  blockReason: string,
): KitchenSkillsPostResult {
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

export function tryPostKitchenSkillsTrim(entry: KitchenSkillsTrimEntry): KitchenSkillsPostResult {
  return tryPostKitchenSkillsActivity(
    getGameBusTask(),
    (task) => buildKitchenSkillsTrimSmartActivityMessage(task, entry),
    `trim:${entry.sessionId}:${entry.ingredientId}`,
    canPostKitchenSkillsStudentActivity(),
    KITCHEN_SKILLS_STUDENT_LIVE_BLOCK_REASON,
  );
}

export function tryPostKitchenSkillsRescue(entry: KitchenSkillsRescueEntry): KitchenSkillsPostResult {
  return tryPostKitchenSkillsActivity(
    getGameBusTask(),
    (task) => buildRescueAndReuseActivityMessage(task, entry),
    `rescue:${entry.sessionId}:${entry.ingredientId}`,
    canPostKitchenSkillsStudentActivity(),
    KITCHEN_SKILLS_STUDENT_LIVE_BLOCK_REASON,
  );
}

export function tryPostKitchenSkillsPortion(entry: KitchenSkillsPortionEntry): KitchenSkillsPostResult {
  return tryPostKitchenSkillsActivity(
    getGameBusTask(),
    (task) => buildPortionPrecisionActivityMessage(task, entry),
    `portion:${entry.sessionId}:${entry.recipeId}:${entry.submittedAt}`,
    canPostKitchenSkillsStudentActivity(),
    KITCHEN_SKILLS_STUDENT_LIVE_BLOCK_REASON,
  );
}

export function tryPostKitchenSkillsReview(
  entry: KitchenSkillsReviewEntry,
  studentActorId: string,
): KitchenSkillsPostResult {
  const actorId = studentActorId.trim();
  if (!actorId) {
    return { ok: false, reason: 'missing_student_actor' };
  }
  return tryPostKitchenSkillsActivity(
    getGameBusTask(),
    (task) => buildWastePracticeReviewActivityMessage(task, entry, actorId),
    `review:${entry.sessionId}:${entry.reviewedGame}`,
    canPostKitchenSkillsTrainerReview(),
    KITCHEN_SKILLS_TRAINER_LIVE_BLOCK_REASON,
  );
}
