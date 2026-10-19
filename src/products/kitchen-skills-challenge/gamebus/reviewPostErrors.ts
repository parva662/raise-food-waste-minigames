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
 * Validate that every property we are about to send is linked on the TASK activity template.
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

  // Only required refs must be linked. Optional chefFeedback is omitted at build time if unlinked.
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

/** Sanitize commit/post reasons for tutor-facing copy (no student PII). */
export function kitchenSkillsReviewCommitErrorMessage(
  reason: string,
  moduleTitle: string,
): string {
  switch (reason) {
    case 'no_task':
      return 'Missing GameBus task. Open tutor assessment from the GameBus challenge.';
    case 'missing_task_template':
      return 'The wastePracticeReview activity template is missing from this GameBus task.';
    case 'missing_property_links':
      return 'GameBus has no property templates linked to wastePracticeReview. The review was not saved.';
    case 'missing_student_actor':
      return 'Missing student identity for this session. The review was not saved.';
    case 'tutor_live_blocked':
      return 'Tutor assessment cannot be submitted from this page yet.';
    case 'duplicate_review':
      return `This ${moduleTitle} module already has a confirmed tutor assessment.`;
    case 'duplicate':
      return 'A previous submission for this assessment is still pending confirmation. Retry only if GameBus rejected it.';
    case 'invalid_scores':
      return 'Enter integer scores from 0 to 5. Blank is not a score.';
    case 'missing_recipe':
      return 'This assessment requires a recipe id. The review was not saved.';
    case 'in_flight':
      return 'Another Kitchen Skills submission is already in progress. Try again in a moment.';
    case 'build_failed':
      return 'The review payload could not be built. The review was not saved.';
    case 'submission_not_confirmed':
      return 'The review was sent to GameBus but is not confirmed saved yet. You can retry if it does not appear after reload.';
    default:
      break;
  }

  if (reason.startsWith('unlinked_property:')) {
    const prop = reason.slice('unlinked_property:'.length);
    return `GameBus rejected property “${prop}”: it is not linked to the wastePracticeReview activity template. The review was not saved.`;
  }

  if (/selectedTaskOfMission/i.test(reason) || /not linked to this activity template/i.test(reason)) {
    return 'GameBus rejected the activity (property template not linked). Our app does not send selectedTaskOfMission — check live GameBus task/mission linking. The review was not saved.';
  }

  if (/template/i.test(reason) && /propert/i.test(reason)) {
    return 'GameBus reported a property-template mismatch. The review was not saved.';
  }

  return 'The review could not be saved. Check the GameBus task configuration and try again.';
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
