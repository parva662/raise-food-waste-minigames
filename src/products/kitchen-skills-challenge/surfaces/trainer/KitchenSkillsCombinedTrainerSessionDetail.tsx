import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  KitchenSkillsReviewedModule,
  KitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/domain/types';
import { KITCHEN_SKILLS_MODULE_TITLES } from '@/products/kitchen-skills-challenge/domain/types';
import {
  findAwaitingRecipeModuleReview,
  findConfirmedRecipeModuleReview,
  listSessionRecipeIds,
  recipeAssessmentStatus,
  recipeDisplayName,
  recipeModuleAssessmentState,
  recipeModuleHasEvidence,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import {
  EMPTY_REVIEW_DRAFT,
  reviewDraftStorageKey,
  type KitchenSkillsReviewFormDraft,
} from '@/products/kitchen-skills-challenge/surfaces/trainer/reviewDrafts';
import { normalizeRecipeId } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
import {
  sessionAssessmentCounts,
  sessionAssessmentStatus,
  sortModulesForTrainer,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';
import {
  TrainerStateDot,
  TrainerStatusChip,
} from '@/products/kitchen-skills-challenge/surfaces/trainer/TrainerStatusChip';
import { useReadyKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { parseKitchenSkillsReviewScore } from '@/products/kitchen-skills-challenge/domain/assessment/scores';
import {
  kitchenSkillsReviewAwaitingMessage,
  kitchenSkillsReviewCommitErrorMessage,
  kitchenSkillsReviewSavedMessage,
} from '@/products/kitchen-skills-challenge/gamebus/reviewPostErrors';
import { COMBINED_REVIEW_MODULE_ORDER } from '@/products/kitchen-skills-challenge/gamebus/combinedWastePracticeReview';
import { ScorePicker } from '@/products/kitchen-skills-challenge/surfaces/trainer/KitchenSkillsTrainerReviewForm';

const ALL_MODULES: readonly KitchenSkillsReviewedModule[] = COMBINED_REVIEW_MODULE_ORDER;

function evidencedModulesForRecipe(
  session: KitchenSkillsTrainerSession,
  recipeId: string,
): KitchenSkillsReviewedModule[] {
  return sortModulesForTrainer(
    ALL_MODULES.filter((module) => recipeModuleHasEvidence(session, recipeId, module)),
  );
}

function initialRecipeId(session: KitchenSkillsTrainerSession, recipeIds: readonly string[]): string | null {
  return (
    recipeIds.find((id) => recipeAssessmentStatus(session, id) === 'needs_assessment') ??
    recipeIds.find((id) => recipeAssessmentStatus(session, id) === 'awaiting_confirmation') ??
    recipeIds[0] ??
    null
  );
}

function entriesForRecipe<T extends { recipeId?: string }>(
  session: KitchenSkillsTrainerSession,
  entries: readonly T[],
  recipeId: string,
): T[] {
  const rid = normalizeRecipeId(recipeId);
  return entries.filter((entry) => {
    const entryRid = normalizeRecipeId(entry.recipeId ?? '');
    if (entryRid) return entryRid === rid;
    // Legacy rows without recipeId attach only when the session has a single recipe.
    return listSessionRecipeIds(session).length === 1;
  });
}

function ModuleReadback({
  module,
  review,
}: {
  module: KitchenSkillsReviewedModule;
  review: NonNullable<ReturnType<typeof findConfirmedRecipeModuleReview>>;
}) {
  return (
    <section
      className="kitchen-day-tutor-assessment kitchen-day-tutor-assessment--saved"
      data-testid={`kitchen-day-combined-review-${module}-submitted`}
    >
      <div className="kitchen-day-tutor-assessment__header">
        <h3 className="kitchen-day-tutor-assessment__title">{KITCHEN_SKILLS_MODULE_TITLES[module]}</h3>
      </div>
      <p className="kitchen-day-tutor-assessment__status kitchen-day-tutor-assessment__status--saved">
        {kitchenSkillsReviewSavedMessage()}
      </p>
      <dl className="kitchen-day-tutor-assessment__readback">
        <div>
          <dt>Time efficiency</dt>
          <dd data-testid={`kitchen-day-combined-review-${module}-time-value`}>
            {review.timeEfficiencyScore}
            <span className="kitchen-day-tutor-assessment__out-of">/5</span>
          </dd>
        </div>
        <div>
          <dt>Preparation quality</dt>
          <dd data-testid={`kitchen-day-combined-review-${module}-quality-value`}>
            {review.preparationQualityScore}
            <span className="kitchen-day-tutor-assessment__out-of">/5</span>
          </dd>
        </div>
        {review.chefFeedback ? (
          <div className="kitchen-day-tutor-assessment__feedback">
            <dt>Feedback</dt>
            <dd data-testid={`kitchen-day-combined-review-${module}-feedback-value`}>
              {review.chefFeedback}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

function ModuleAwaiting({
  module,
  review,
}: {
  module: KitchenSkillsReviewedModule;
  review: NonNullable<ReturnType<typeof findAwaitingRecipeModuleReview>>;
}) {
  return (
    <section
      className="kitchen-day-tutor-assessment kitchen-day-tutor-assessment--awaiting"
      data-testid={`kitchen-day-combined-review-${module}-awaiting`}
    >
      <div className="kitchen-day-tutor-assessment__header">
        <h3 className="kitchen-day-tutor-assessment__title">{KITCHEN_SKILLS_MODULE_TITLES[module]}</h3>
      </div>
      <p
        className="kitchen-day-tutor-assessment__status kitchen-day-tutor-assessment__status--awaiting"
        data-testid={`kitchen-day-combined-review-${module}-awaiting-note`}
      >
        {kitchenSkillsReviewAwaitingMessage()} Saved status updates when the GameBus feed reloads.
      </p>
      <dl className="kitchen-day-tutor-assessment__readback">
        <div>
          <dt>Time efficiency</dt>
          <dd>{review.timeEfficiencyScore}<span className="kitchen-day-tutor-assessment__out-of">/5</span></dd>
        </div>
        <div>
          <dt>Preparation quality</dt>
          <dd>{review.preparationQualityScore}<span className="kitchen-day-tutor-assessment__out-of">/5</span></dd>
        </div>
        {review.chefFeedback ? (
          <div className="kitchen-day-tutor-assessment__feedback">
            <dt>Feedback</dt>
            <dd>{review.chefFeedback}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

function ModuleDraftForm({
  module,
  draft,
  onDraftChange,
  disabled,
}: {
  module: KitchenSkillsReviewedModule;
  draft: KitchenSkillsReviewFormDraft;
  onDraftChange: (draft: KitchenSkillsReviewFormDraft) => void;
  disabled: boolean;
}) {
  const timeName = `combined-time-${module}`;
  const qualityName = `combined-quality-${module}`;
  const timeInvalid = draft.timeScore.trim().length > 0 && !parseKitchenSkillsReviewScore(draft.timeScore).ok;
  const qualityInvalid =
    draft.qualityScore.trim().length > 0 && !parseKitchenSkillsReviewScore(draft.qualityScore).ok;

  return (
    <section
      className="kitchen-day-tutor-assessment"
      data-testid={`kitchen-day-combined-review-${module}-form`}
    >
      <div className="kitchen-day-tutor-assessment__header">
        <h3 className="kitchen-day-tutor-assessment__title">{KITCHEN_SKILLS_MODULE_TITLES[module]}</h3>
      </div>
      <ScorePicker
        label="Time efficiency"
        name={timeName}
        value={draft.timeScore}
        disabled={disabled}
        invalid={timeInvalid}
        testId={`kitchen-day-combined-review-${module}-time-picker`}
        onChange={(next) => onDraftChange({ ...draft, timeScore: next })}
      />
      <ScorePicker
        label="Preparation quality"
        name={qualityName}
        value={draft.qualityScore}
        disabled={disabled}
        invalid={qualityInvalid}
        testId={`kitchen-day-combined-review-${module}-quality-picker`}
        onChange={(next) => onDraftChange({ ...draft, qualityScore: next })}
      />
      <label className="kitchen-day-field kitchen-day-tutor-assessment__feedback-field">
        <span>Feedback (optional)</span>
        <textarea
          className="kitchen-day-input kitchen-day-tutor-assessment__feedback-input"
          data-testid={`kitchen-day-combined-review-${module}-feedback`}
          value={draft.feedback}
          disabled={disabled}
          rows={3}
          onChange={(event) => onDraftChange({ ...draft, feedback: event.target.value })}
        />
      </label>
    </section>
  );
}

export function KitchenSkillsCombinedTrainerSessionDetail({
  selected,
  reviewDrafts,
  onReviewDraftChange,
}: {
  selected: KitchenSkillsTrainerSession;
  reviewDrafts: Record<string, KitchenSkillsReviewFormDraft>;
  onReviewDraftChange: (key: string, draft: KitchenSkillsReviewFormDraft) => void;
}) {
  const { commitCombinedReview } = useReadyKitchenSkillsSession();
  const recipeIds = useMemo(() => listSessionRecipeIds(selected), [selected]);
  const [recipeId, setRecipeId] = useState<string | null>(() => initialRecipeId(selected, recipeIds));
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);

  useEffect(() => {
    setRecipeId(initialRecipeId(selected, listSessionRecipeIds(selected)));
    setError(null);
    setSending(false);
    sendingRef.current = false;
    // Reset when the tutor opens a different student session.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional session identity deps only
  }, [selected.sessionId, selected.actorId]);

  const activeRecipeId = recipeId && recipeIds.includes(recipeId) ? recipeId : recipeIds[0] ?? null;
  const modules = activeRecipeId ? evidencedModulesForRecipe(selected, activeRecipeId) : [];
  const pendingModules = modules.filter(
    (module) =>
      activeRecipeId != null &&
      recipeModuleAssessmentState(selected, activeRecipeId, module) === 'needs_assessment',
  );
  const counts = sessionAssessmentCounts(selected);
  const sessionStatus = sessionAssessmentStatus(selected);

  const draftFor = (module: KitchenSkillsReviewedModule): KitchenSkillsReviewFormDraft => {
    if (!activeRecipeId) return EMPTY_REVIEW_DRAFT;
    const key = reviewDraftStorageKey(selected.actorId, selected.sessionId, activeRecipeId, module);
    return reviewDrafts[key] ?? EMPTY_REVIEW_DRAFT;
  };

  const setDraft = (module: KitchenSkillsReviewedModule, draft: KitchenSkillsReviewFormDraft) => {
    if (!activeRecipeId) return;
    onReviewDraftChange(
      reviewDraftStorageKey(selected.actorId, selected.sessionId, activeRecipeId, module),
      draft,
    );
  };

  const canSubmit = (() => {
    if (!activeRecipeId || pendingModules.length === 0 || sending) return false;
    return pendingModules.every((module) => {
      const draft = draftFor(module);
      return (
        parseKitchenSkillsReviewScore(draft.timeScore).ok &&
        parseKitchenSkillsReviewScore(draft.qualityScore).ok
      );
    });
  })();

  const submit = () => {
    if (sendingRef.current || !activeRecipeId) return;
    if (pendingModules.length === 0) return;
    for (const module of pendingModules) {
      const draft = draftFor(module);
      if (
        !parseKitchenSkillsReviewScore(draft.timeScore).ok ||
        !parseKitchenSkillsReviewScore(draft.qualityScore).ok
      ) {
        setError('Select integer scores from 0 to 5 for both dimensions on every open module. Unselected is not a score.');
        return;
      }
    }
    sendingRef.current = true;
    setSending(true);
    setError(null);
    const submittedAt = new Date().toISOString();
    const modulesPayload: Parameters<typeof commitCombinedReview>[0]['modules'] = {};
    for (const module of pendingModules) {
      const draft = draftFor(module);
      const time = parseKitchenSkillsReviewScore(draft.timeScore);
      const quality = parseKitchenSkillsReviewScore(draft.qualityScore);
      if (!time.ok || !quality.ok) {
        sendingRef.current = false;
        setSending(false);
        setError('Select integer scores from 0 to 5 for both dimensions on every open module. Unselected is not a score.');
        return;
      }
      modulesPayload[module] = {
        timeEfficiencyScore: time.value,
        preparationQualityScore: quality.value,
        ...(draft.feedback.trim() ? { chefFeedback: draft.feedback.trim() } : {}),
      };
    }
    const result = commitCombinedReview(
      {
        sessionId: selected.sessionId,
        sessionDate: selected.sessionDate,
        submittedAt,
        recipeId: activeRecipeId,
        modules: modulesPayload,
      },
      selected.actorId,
    );
    if (!result.ok) {
      sendingRef.current = false;
      setSending(false);
      setError(
        kitchenSkillsReviewCommitErrorMessage(
          result.reason,
          'combined',
          result.missing,
        ),
      );
      return;
    }
    for (const module of pendingModules) {
      onReviewDraftChange(
        reviewDraftStorageKey(selected.actorId, selected.sessionId, activeRecipeId, module),
        EMPTY_REVIEW_DRAFT,
      );
    }
    setSending(false);
    sendingRef.current = false;
  };

  return (
    <div className="kitchen-day-tutor-session" data-testid="kitchen-day-tutor-combined-session">
      <div className="kitchen-day-tutor-session__progress" data-testid="kitchen-day-tutor-session-status">
        <TrainerStatusChip state={sessionStatus} />
        <span>
          {counts.outstanding} to assess · {counts.awaiting} awaiting · {counts.confirmed} reviewed
        </span>
      </div>

      {recipeIds.length > 1 ? (
        <div className="kitchen-day-tutor-recipe-chips" data-testid="kitchen-day-tutor-combined-recipe-chips">
          <p className="kitchen-day-tutor-recipe-chips__meta">
            {recipeIds.length} recipes · select one recipe for a combined assessment
          </p>
          <div className="kitchen-day-tutor-recipe-chips__list" role="tablist" aria-label="Recipes">
            {recipeIds.map((id) => {
              const status = recipeAssessmentStatus(selected, id);
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={id === activeRecipeId}
                  className={
                    id === activeRecipeId
                      ? 'kitchen-day-tutor-recipe-chip kitchen-day-tutor-recipe-chip--active'
                      : 'kitchen-day-tutor-recipe-chip'
                  }
                  data-testid={`kitchen-day-tutor-combined-recipe-${id}`}
                  onClick={() => {
                    setRecipeId(id);
                    setError(null);
                  }}
                >
                  <TrainerStateDot state={status === 'no_evidence' ? 'needs_assessment' : status} />
                  {recipeDisplayName(selected, id)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeRecipeId ? (
        <div className="kitchen-day-tutor-combined-stack" data-testid="kitchen-day-tutor-combined-stack">
          {modules.map((module) => {
            const confirmed = findConfirmedRecipeModuleReview(selected, activeRecipeId, module);
            const awaiting = findAwaitingRecipeModuleReview(selected, activeRecipeId, module);
            const portionEntries =
              module === 'portionPrecision'
                ? entriesForRecipe(selected, selected.portionEntries, activeRecipeId)
                : [];
            const trimEntries =
              module === 'trimSmart'
                ? entriesForRecipe(selected, selected.trimEntries, activeRecipeId)
                : [];
            const rescueEntries =
              module === 'rescueAndReuse'
                ? entriesForRecipe(selected, selected.rescueEntries, activeRecipeId)
                : [];

            return (
              <section
                key={module}
                className="kitchen-day-tutor-combined-module"
                data-testid={`kitchen-day-tutor-combined-module-${module}`}
              >
                <h2 className="kitchen-day-tutor-combined-module__title">
                  {KITCHEN_SKILLS_MODULE_TITLES[module]}
                </h2>
                <div className="kitchen-day-tutor-workspace kitchen-day-tutor-workspace--combined">
                  <div className="kitchen-day-tutor-workspace__evidence">
                    <SessionEvidence
                      trimEntries={trimEntries}
                      rescueEntries={rescueEntries}
                      portionEntries={portionEntries}
                      trimEntriesForRescueLookup={selected.trimEntries}
                      modules={[module]}
                      testIdPrefix={`kitchen-day-combined-${module}`}
                      sessionPortionEntries={selected.portionEntries}
                      hideSectionTitles
                      hidePortionRecipeTitle
                      showWasteAnalytics={module === 'trimSmart'}
                    />
                  </div>
                  <div className="kitchen-day-tutor-workspace__assessment">
                    {confirmed ? (
                      <ModuleReadback module={module} review={confirmed} />
                    ) : awaiting ? (
                      <ModuleAwaiting module={module} review={awaiting} />
                    ) : (
                      <ModuleDraftForm
                        module={module}
                        draft={draftFor(module)}
                        onDraftChange={(draft) => setDraft(module, draft)}
                        disabled={sending}
                      />
                    )}
                  </div>
                </div>
              </section>
            );
          })}

          {pendingModules.length > 0 ? (
            <div className="kitchen-day-tutor-combined-submit" data-testid="kitchen-day-tutor-combined-submit-bar">
              {error ? (
                <p
                  className="kitchen-day-tutor-assessment__status kitchen-day-tutor-assessment__status--warning"
                  data-testid="kitchen-day-combined-review-error"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
              {!canSubmit && !sending ? (
                <p
                  className="kitchen-day-tutor-assessment__status"
                  data-testid="kitchen-day-combined-review-unscored"
                >
                  Select both scores for every open module to submit.
                </p>
              ) : null}
              {sending ? (
                <p className="visually-hidden" data-testid="kitchen-day-combined-review-sending">
                  Sending
                </p>
              ) : null}
              <button
                type="button"
                className="kitchen-day-button kitchen-day-button--primary"
                data-testid="kitchen-day-combined-review-submit"
                disabled={!canSubmit}
                onClick={submit}
              >
                Submit assessment
              </button>
            </div>
          ) : (
            <p
              className="kitchen-day-tutor-assessment__status kitchen-day-tutor-assessment__status--saved"
              data-testid="kitchen-day-combined-review-all-done"
            >
              Every evidenced module for this recipe is submitted or saved.
            </p>
          )}
        </div>
      ) : (
        <p data-testid="kitchen-day-tutor-combined-empty">No recipe evidence is available for assessment.</p>
      )}
    </div>
  );
}
