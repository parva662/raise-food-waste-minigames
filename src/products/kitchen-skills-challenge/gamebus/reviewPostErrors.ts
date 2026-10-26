import { findActivityTemplate, resolveLinkedPropertyRefs } from '@/platform/gamebus/activityTemplate';
import { selectActivityTemplate } from '@/platform/gamebus/selectActivityTemplate';
import type { TaskActivityTemplate, TaskData, TaskLinkedProperty } from '@/platform/gamebus/types';
import {
  WASTE_PRACTICE_REVIEW_DEPRECATED_MODULE_REFS,
  WASTE_PRACTICE_REVIEW_REQUIRED_REFS,
  type WastePracticeReviewPropertyRef,
} from '@/products/kitchen-skills-challenge/gamebus/mapWastePracticeReview';
import type { KitchenSkillsReviewEntry } from '@/products/kitchen-skills-challenge/domain/types';

function linkedPropertyRefs(task: TaskData, activitySlug: string): string[] {
  const activity = findActivityTemplate(task, activitySlug);
  if (!activity) return [];
  return resolveLinkedPropertyRefs(activity);
}

function linkedPropertyByRef(
  activity: TaskActivityTemplate,
  ref: string,
): TaskLinkedProperty | undefined {
  return activity.linkedProperties?.find((item) => (item.slug ?? item.ref) === ref);
}

/**
 * Client-side TASK linked-property check before postMessage.
 * Session-level posts require only the session score fields.
 * If GameBus still marks `reviewedGame` or `recipeId` as required, block with a config error
 * (do not fabricate module values).
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

  const activity = findActivityTemplate(task, 'wastePracticeReview');
  if (!activity) {
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

  const stillRequired = WASTE_PRACTICE_REVIEW_DEPRECATED_MODULE_REFS.filter((ref) => {
    const prop = linkedPropertyByRef(activity, ref);
    return prop?.required === true;
  });
  if (stillRequired.length > 0) {
    return {
      ok: false,
      reason: 'gamebus_session_review_blocked',
      missing: stillRequired,
    };
  }

  return { ok: true };
}

function formatMissingSlugs(missing: readonly string[] | undefined): string {
  if (!missing?.length) return '';
  return missing.join(', ');
}

/**
 * Tutor-facing copy. Distinguishes client validation from unconfirmed dispatch.
 * GameBus does not document a reliable activity-rejection ACK to the iframe.
 * Never claims GameBus rejected an activity when the client blocked before postMessage.
 */
export function kitchenSkillsReviewCommitErrorMessage(
  reason: string,
  _moduleTitle: string,
  missing?: readonly string[],
): string {
  switch (reason) {
    case 'no_task':
      return 'Assessment cannot be submitted because the GameBus task is not available.';
    case 'missing_task_template':
      return 'Assessment cannot be submitted because the wastePracticeReview activity template is missing from this task.';
    case 'missing_property_links': {
      const slugs = formatMissingSlugs(missing) || WASTE_PRACTICE_REVIEW_REQUIRED_REFS.join(', ');
      return `Assessment cannot be submitted because wastePracticeReview has no linked property templates (expected: ${slugs}).`;
    }
    case 'gamebus_session_review_blocked': {
      const slugs = formatMissingSlugs(missing) || 'reviewedGame, recipeId';
      return `Assessment cannot be submitted until GameBus makes these wastePracticeReview properties optional or unlinks them: ${slugs}.`;
    }
    case 'missing_student_actor':
      return 'Assessment cannot be submitted because the student session identity is missing.';
    case 'tutor_live_blocked':
      return 'Tutor assessment cannot be submitted from this page yet.';
    case 'duplicate_review':
      return 'This challenge session already has a session review.';
    case 'duplicate':
    case 'already_dispatched':
    case 'submission_outcome_unknown':
      return 'This session assessment was already submitted. Do not submit again.';
    case 'invalid_scores':
      return 'Select integer scores from 0 to 5 for both dimensions. Unselected is not a score.';
    case 'in_flight':
      return 'Another Kitchen Skills submission is already in progress. Try again in a moment.';
    case 'build_failed':
      return 'Assessment cannot be submitted because the payload could not be built.';
    default:
      break;
  }

  if (reason.startsWith('unlinked_property:')) {
    const fromReason = reason.slice('unlinked_property:'.length);
    const slugs = formatMissingSlugs(missing) || fromReason;
    return `Assessment cannot be submitted because required property links are missing on wastePracticeReview: ${slugs}.`;
  }

  return 'Assessment cannot be submitted. Check the configuration and try again.';
}

/** Shown after postMessage — not GameBus persistence proof. */
export function kitchenSkillsReviewSubmittedMessage(): string {
  return 'Assessment submitted.';
}

/** Shown only after a matching wastePracticeReview is observed in the GameBus feed. */
export function kitchenSkillsReviewSavedMessage(): string {
  return 'Assessment saved.';
}

/** Dev/diagnostic log payload — session only, never student names or feedback text. */
export function kitchenSkillsReviewDiagnosticPayload(
  reason: string,
  entry: Pick<KitchenSkillsReviewEntry, 'sessionId' | 'recipeId' | 'reviewedGame'>,
  extra?: { missing?: readonly WastePracticeReviewPropertyRef[] | readonly string[] },
): Record<string, unknown> {
  return {
    reason,
    sessionId: entry.sessionId,
    recipeId: entry.recipeId ?? null,
    reviewedGame: entry.reviewedGame ?? null,
    ...(extra?.missing ? { missingProperties: [...extra.missing] } : {}),
  };
}
