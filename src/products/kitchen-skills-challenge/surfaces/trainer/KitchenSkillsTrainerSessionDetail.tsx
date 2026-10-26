import { useMemo } from 'react';
import type { KitchenSkillsTrainerSession } from '@/products/kitchen-skills-challenge/domain/types';
import { KITCHEN_SKILLS_MODULE_TITLES } from '@/products/kitchen-skills-challenge/domain/types';
import {
  findConfirmedSessionLevelAssessment,
  historicalModuleReviews,
  listSessionRecipeIds,
  recipeDisplayName,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import { KitchenSkillsTrainerReviewForm } from '@/products/kitchen-skills-challenge/surfaces/trainer/KitchenSkillsTrainerReviewForm';
import {
  EMPTY_REVIEW_DRAFT,
  reviewDraftStorageKey,
  type KitchenSkillsReviewFormDraft,
} from '@/products/kitchen-skills-challenge/surfaces/trainer/reviewDrafts';
import {
  sessionAssessmentCounts,
  sessionAssessmentStatus,
  sortModulesForTrainer,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';
import { TrainerStatusChip } from '@/products/kitchen-skills-challenge/surfaces/trainer/TrainerStatusChip';

function SessionProgress({
  session,
  hasUnsavedDraft,
}: {
  session: KitchenSkillsTrainerSession;
  hasUnsavedDraft: boolean;
}) {
  const counts = sessionAssessmentCounts(session);
  const status = sessionAssessmentStatus(session);
  return (
    <section
      className="kitchen-day-tutor-progress"
      aria-label="Session assessment progress"
      data-testid="kitchen-day-tutor-session-progress"
    >
      <TrainerStatusChip state={status} testId="kitchen-day-tutor-session-status" />
      <span className="kitchen-day-tutor-progress__counts" data-testid="kitchen-day-tutor-session-counts">
        {status === 'reviewed'
          ? 'Session assessment saved'
          : counts.outstanding > 0
            ? 'One session assessment outstanding'
            : 'No recorded evidence yet'}
      </span>
      {hasUnsavedDraft ? (
        <span className="kitchen-day-tutor-unsaved-hint" data-testid="kitchen-day-tutor-unsaved-hint">
          Unsaved draft
        </span>
      ) : null}
    </section>
  );
}

function HistoricalModuleReviews({ session }: { session: KitchenSkillsTrainerSession }) {
  const historical = historicalModuleReviews(session);
  if (historical.length === 0) return null;
  return (
    <details
      className="kitchen-day-tutor-legacy"
      data-testid="kitchen-day-tutor-historical-module-reviews"
    >
      <summary>Historical per-module assessments ({historical.length})</summary>
      <p className="kitchen-day-tutor-unlinked__note">
        Earlier Tutor versions saved one assessment per module. These remain readable and do not count
        as a full session assessment.
      </p>
      <ul className="kitchen-day-evidence-list">
        {historical.map((review) => {
          const module = review.reviewedGame!;
          const recipe = review.recipeId
            ? ` · recipe ${recipeDisplayName(session, review.recipeId)}`
            : '';
          return (
            <li key={review.persistId ?? `${module}-${review.submittedAt}-${review.recipeId ?? ''}`}>
              {KITCHEN_SKILLS_MODULE_TITLES[module]}
              {recipe}: time {review.timeEfficiencyScore}/5, quality {review.preparationQualityScore}
              /5
              {review.chefFeedback ? ` — ${review.chefFeedback}` : ''}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

export function KitchenSkillsTrainerSessionDetail({
  selected,
  drafts,
  onDraftChange,
}: {
  selected: KitchenSkillsTrainerSession;
  drafts: Readonly<Record<string, KitchenSkillsReviewFormDraft>>;
  onDraftChange: (key: string, draft: KitchenSkillsReviewFormDraft) => void;
}) {
  const recipeIds = useMemo(() => listSessionRecipeIds(selected), [selected]);
  const draftKey = reviewDraftStorageKey(selected.actorId, selected.sessionId);
  const draft = drafts[draftKey] ?? EMPTY_REVIEW_DRAFT;
  const hasUnsavedDraft =
    draft.timeScore.trim().length > 0 ||
    draft.qualityScore.trim().length > 0 ||
    draft.feedback.trim().length > 0;
  const modules = sortModulesForTrainer([
    ...(selected.portionEntries.length > 0 ? (['portionPrecision'] as const) : []),
    ...(selected.trimEntries.length > 0 ? (['trimSmart'] as const) : []),
    ...(selected.rescueEntries.length > 0 ? (['rescueAndReuse'] as const) : []),
  ]);
  const confirmed = findConfirmedSessionLevelAssessment(selected);
  const showUnsaved = hasUnsavedDraft && !confirmed;

  return (
    <div data-testid="kitchen-day-chef-selected" className="kitchen-day-tutor-session-detail">
      <SessionProgress session={selected} hasUnsavedDraft={showUnsaved} />
      {recipeIds.length > 1 ? (
        <p className="kitchen-day-tutor-recipe-selector__summary" data-testid="kitchen-day-tutor-recipe-summary">
          {recipeIds.length} recipes in this historical session ·{' '}
          {recipeIds.map((id) => recipeDisplayName(selected, id)).join(' · ')}
        </p>
      ) : recipeIds.length === 1 ? (
        <p className="kitchen-day-tutor-progress__recipe" data-testid="kitchen-day-tutor-active-recipe">
          {recipeDisplayName(selected, recipeIds[0]!)}
        </p>
      ) : null}

      <div className="kitchen-day-tutor-workspace" data-testid="kitchen-day-tutor-session-workspace">
        <section className="kitchen-day-tutor-workspace__evidence" aria-label="Student evidence">
          <SessionEvidence
            trimEntries={selected.trimEntries}
            rescueEntries={selected.rescueEntries}
            portionEntries={selected.portionEntries}
            sessionPortionEntries={selected.portionEntries}
            trimEntriesForRescueLookup={selected.trimEntries}
            modules={modules.length > 0 ? modules : undefined}
            moduleReviews={selected.moduleReviews}
            testIdPrefix="kitchen-day-chef"
            collapsePortionTable
          />
        </section>
        <section className="kitchen-day-tutor-workspace__assessment" aria-label="Tutor assessment">
          <KitchenSkillsTrainerReviewForm
            selected={selected}
            draft={draft}
            onDraftChange={(next) => onDraftChange(draftKey, next)}
          />
        </section>
      </div>

      <HistoricalModuleReviews session={selected} />
    </div>
  );
}
