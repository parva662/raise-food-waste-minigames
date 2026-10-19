import { selectActivityTemplate } from '@/platform/gamebus/selectActivityTemplate';
import type { TaskData } from '@/platform/gamebus/types';
import {
  WASTE_PRACTICE_REVIEW_REQUIRED_REFS,
  type WastePracticeReviewPropertyRef,
} from '@/products/kitchen-skills-challenge/gamebus/mapWastePracticeReview';
import type { KitchenSkillsReviewEntry } from '@/products/kitchen-skills-challenge/domain/types';

function linkedPropertyRefs(task: TaskData, activitySlug: string): string[] {
  const activity = (task.activityTemplates ?? []).find((item) => item.slug === activitySlug);
  if (!activity?.linkedProperties?.length) return [];
  const refs: string[] = [];
  for (const item of activity.linkedProperties) {
    const ref = typeof item.ref === 'string' ? item.ref.trim() : '';
    if (ref) refs.push(ref);
  }
  return refs;
}

/**
 * Client-side TASK linked-property check before postMessage.
 * Does not invent selectedTaskOfMission — that field is not part of our outbound payload.
 */
export function validateWastePracticeReviewLinkedProperties(
  task: TaskData,
  _entry: KitchenSkillsReviewEntry,
): { ok: true } | { ok: false; reason: string; missing: string[] } {
  try {
    selectActivityTemplate(task, 'wastePracticeReview');
  } catch {
    return {
      ok: false,
      reason: 'missing_task_template',
      missing: ['wastePracticeReview'],
    };
  }

  const linked = new Set(linkedPropertyRefs(task, 'wastePracticeReview'));
  if (linked.size === 0) {
    return {
      ok: false,
      reason: 'missing_property_links',
      missing: [...WASTE_PRACTICE_REVIEW_REQUIRED_REFS],
    };
  }

  const missing = WASTE_PRACTICE_REVIEW_REQUIRED_REFS.filter((ref) => !linked.has(ref));
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `unlinked_property:${missing[0]}`,
      missing,
    };
  }
  return { ok: true };
}

/**
 * Tutor-facing copy. Distinguishes client validation from unconfirmed dispatch.
 * GameBus does not document a reliable activity-rejection ACK to the iframe.
 */
export function kitchenSkillsReviewCommitErrorMessage(
  reason: string,
  moduleTitle: string,
): string {
  switch (reason) {
    case 'no_task':
      return 'Assessment cannot be submitted because the GameBus task is not available.';
    case 'missing_task_template':
    case 'missing_property_links':
      return 'Assessment cannot be submitted because the activity configuration is incomplete.';
    case 'missing_student_actor':
      return 'Assessment cannot be submitted because the student session identity is missing.';
    case 'tutor_live_blocked':
      return 'Tutor assessment cannot be submitted from this page yet.';
    case 'duplicate_review':
      return `This ${moduleTitle} assessment is already saved.`;
    case 'duplicate':
    case 'already_dispatched':
    case 'submission_outcome_unknown':
      return 'The submission status could not be verified. Do not submit again until it has been checked in GameBus.';
    case 'invalid_scores':
      return 'Enter integer scores from 0 to 5. Blank is not a score.';
    case 'missing_recipe':
      return 'Assessment cannot be submitted because the recipe identity is missing.';
    case 'in_flight':
      return 'Another Kitchen Skills submission is already in progress. Try again in a moment.';
    case 'build_failed':
      return 'Assessment cannot be submitted because the payload could not be built.';
    default:
      break;
  }

  if (reason.startsWith('unlinked_property:')) {
    return 'Assessment cannot be submitted because the activity configuration is incomplete.';
  }

  return 'Assessment cannot be submitted. Check the configuration and try again.';
}

export function kitchenSkillsReviewAwaitingMessage(): string {
  return 'Assessment sent. Waiting for confirmation from GameBus.';
}

export function kitchenSkillsReviewSavedMessage(): string {
  return 'Assessment saved.';
}

/** Dev/diagnostic log payload — session/module only, never student names or feedback text. */
export function kitchenSkillsReviewDiagnosticPayload(
  reason: string,
  entry: Pick<KitchenSkillsReviewEntry, 'sessionId' | 'recipeId' | 'reviewedGame'>,
  extra?: { missing?: readonly WastePracticeReviewPropertyRef[] | readonly string[] },
): Record<string, unknown> {
  return {
    reason,
    sessionId: entry.sessionId,
    recipeId: entry.recipeId ?? null,
    reviewedGame: entry.reviewedGame,
    ...(extra?.missing ? { missingProperties: [...extra.missing] } : {}),
  };
}
