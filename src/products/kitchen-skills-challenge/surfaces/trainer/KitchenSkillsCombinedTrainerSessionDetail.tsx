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
  type KitchenSkillsModuleAssessmentState,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import {
  EMPTY_REVIEW_DRAFT,
  reviewDraftStorageKey,
  type KitchenSkillsReviewFormDraft,
} from '@/products/kitchen-skills-challenge/surfaces/trainer/reviewDrafts';
import { normalizeRecipeId } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
import { sortModulesForTrainer } from '@/products/kitchen-skills-challenge/read/trainerSessions';
import { TrainerStateDot } from '@/products/kitchen-skills-challenge/surfaces/trainer/TrainerStatusChip';
import { useReadyKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { parseKitchenSkillsReviewScore } from '@/products/kitchen-skills-challenge/domain/assessment/scores';
import { kitchenSkillsReviewCommitErrorMessage } from '@/products/kitchen-skills-challenge/gamebus/reviewPostErrors';
import { COMBINED_REVIEW_MODULE_ORDER } from '@/products/kitchen-skills-challenge/gamebus/combinedWastePracticeReview';
import { ScorePicker } from '@/products/kitchen-skills-challenge/surfaces/trainer/KitchenSkillsTrainerReviewForm';

const ALL_MODULES: readonly KitchenSkillsReviewedModule[] = COMBINED_REVIEW_MODULE_ORDER;

/** Combined list/detail labels: awaiting + reviewed both present as Submitted. */
const COMBINED_STATE_LABELS: Record<KitchenSkillsModuleAssessmentState, string> = {
  needs_assessment: 'To assess',
  awaiting_confirmation: 'Submitted',
  reviewed: 'Submitted',
};

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
    return listSessionRecipeIds(session).length === 1;
  });
}

function scoreMissing(draftScore: string): boolean {
  return !parseKitchenSkillsReviewScore(draftScore).ok;
}

function ModuleStatusLabel({ state }: { state: KitchenSkillsModuleAssessmentState }) {
  return (
    <span
      className={`kitchen-day-tutor-combined-status kitchen-day-tutor-combined-status--${state}`}
      data-state={state}
    >
      {COMBINED_STATE_LABELS[state]}
    </span>
  );
}

function ModuleReadback({
  module,
  review,
  state,
}: {
  module: KitchenSkillsReviewedModule;
  review: NonNullable<
    | ReturnType<typeof findConfirmedRecipeModuleReview>
    | ReturnType<typeof findAwaitingRecipeModuleReview>
  >;
  state: 'awaiting_confirmation' | 'reviewed';
}) {
  return (
    <div
      className={
        state === 'reviewed'
          ? 'kitchen-day-tutor-combined-assessment kitchen-day-tutor-combined-assessment--saved'
          : 'kitchen-day-tutor-combined-assessment kitchen-day-tutor-combined-assessment--awaiting'
      }
      data-testid={
        state === 'reviewed'
          ? `kitchen-day-combined-review-${module}-submitted`
          : `kitchen-day-combined-review-${module}-awaiting`
      }
    >
      <dl className="kitchen-day-tutor-combined-readback">
        <div>
          <dt>Time</dt>
          <dd data-testid={`kitchen-day-combined-review-${module}-time-value`}>
            {review.timeEfficiencyScore}
            <span className="kitchen-day-tutor-assessment__out-of">/5</span>
          </dd>
        </div>
        <div>
          <dt>Quality</dt>
          <dd data-testid={`kitchen-day-combined-review-${module}-quality-value`}>
            {review.preparationQualityScore}
            <span className="kitchen-day-tutor-assessment__out-of">/5</span>
          </dd>
        </div>
      </dl>
      {review.chefFeedback ? (
        <p
          className="kitchen-day-tutor-combined-feedback-readback"
          data-testid={`kitchen-day-combined-review-${module}-feedback-value`}
        >
          {review.chefFeedback}
        </p>
      ) : null}
    </div>
  );
}

function ModuleDraftForm({
  module,
  draft,
  onDraftChange,
  disabled,
  showMissingHints,
}: {
  module: KitchenSkillsReviewedModule;
  draft: KitchenSkillsReviewFormDraft;
  onDraftChange: (draft: KitchenSkillsReviewFormDraft) => void;
  disabled: boolean;
  showMissingHints: boolean;
}) {
  const timeName = `combined-time-${module}`;
  const qualityName = `combined-quality-${module}`;
  const timeParsed = parseKitchenSkillsReviewScore(draft.timeScore);
  const qualityParsed = parseKitchenSkillsReviewScore(draft.qualityScore);
  const timeInvalid = draft.timeScore.trim().length > 0 && !timeParsed.ok;
  const qualityInvalid = draft.qualityScore.trim().length > 0 && !qualityParsed.ok;
  const timeMissing = showMissingHints && scoreMissing(draft.timeScore);
  const qualityMissing = showMissingHints && scoreMissing(draft.qualityScore);

  return (
    <div
      className="kitchen-day-tutor-combined-assessment"
      data-testid={`kitchen-day-combined-review-${module}-form`}
    >
      <ScorePicker
        label="Time efficiency"
        name={timeName}
        value={draft.timeScore}
        disabled={disabled}
        invalid={timeInvalid}
        required
        missingHint={timeMissing ? 'Select a score' : null}
        testId={`kitchen-day-combined-review-${module}-time-picker`}
        onChange={(next) => onDraftChange({ ...draft, timeScore: next })}
      />
      <ScorePicker
        label="Preparation quality"
        name={qualityName}
        value={draft.qualityScore}
        disabled={disabled}
        invalid={qualityInvalid}
        required
        missingHint={qualityMissing ? 'Select a score' : null}
        testId={`kitchen-day-combined-review-${module}-quality-picker`}
        onChange={(next) => onDraftChange({ ...draft, qualityScore: next })}
      />
      <label className="kitchen-day-field kitchen-day-tutor-combined-feedback-field">
        <span>Feedback (optional)</span>
        <textarea
          className="kitchen-day-input kitchen-day-tutor-combined-feedback-input"
          data-testid={`kitchen-day-combined-review-${module}-feedback`}
          value={draft.feedback}
          disabled={disabled}
          rows={2}
          onChange={(event) => onDraftChange({ ...draft, feedback: event.target.value })}
        />
      </label>
    </div>
  );
}

function CombinedSubmitSuccessDialog({
  onAssessAnother,
  onClose,
}: {
  onAssessAnother: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="chef-zero-dialog-backdrop kitchen-day-combined-submit-backdrop"
      role="presentation"
      data-testid="kitchen-day-combined-submit-success-backdrop"
    >
      <div
        className="chef-zero-dialog kitchen-day-combined-submit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kitchen-day-combined-submit-success-title"
        data-testid="kitchen-day-combined-submit-success"
      >
        <header className="kitchen-day-combined-submit-dialog__header">
          <h2 id="kitchen-day-combined-submit-success-title" className="chef-zero-dialog__title">
            Assessment submitted
          </h2>
        </header>
        <div className="chef-zero-dialog__actions kitchen-day-combined-submit-dialog__actions">
          <button
            type="button"
            className="chef-zero-dialog__btn kitchen-day-button kitchen-day-button--secondary"
            data-testid="kitchen-day-combined-assess-another"
            onClick={onAssessAnother}
          >
            Assess another assignment
          </button>
          <button
            type="button"
            className="chef-zero-dialog__btn chef-zero-dialog__btn--confirm kitchen-day-button kitchen-day-button--primary"
            data-testid="kitchen-day-combined-submit-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function KitchenSkillsCombinedTrainerSessionDetail({
  selected,
  reviewDrafts,
  onReviewDraftChange,
  onAssessAnother,
  onCloseTrainer,
}: {
  selected: KitchenSkillsTrainerSession;
  reviewDrafts: Record<string, KitchenSkillsReviewFormDraft>;
  onReviewDraftChange: (key: string, draft: KitchenSkillsReviewFormDraft) => void;
  onAssessAnother: () => void;
  onCloseTrainer: () => void;
}) {
  const { commitCombinedReview } = useReadyKitchenSkillsSession();
  const recipeIds = useMemo(() => listSessionRecipeIds(selected), [selected]);
  const [recipeId, setRecipeId] = useState<string | null>(() => initialRecipeId(selected, recipeIds));
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showMissingHints, setShowMissingHints] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const sendingRef = useRef(false);

  useEffect(() => {
    setRecipeId(initialRecipeId(selected, listSessionRecipeIds(selected)));
    setError(null);
    setSending(false);
    setShowMissingHints(false);
    setShowSuccessDialog(false);
    sendingRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional session identity deps only
  }, [selected.sessionId, selected.actorId]);

  const activeRecipeId = recipeId && recipeIds.includes(recipeId) ? recipeId : recipeIds[0] ?? null;
  const modules = activeRecipeId ? evidencedModulesForRecipe(selected, activeRecipeId) : [];
  const pendingModules = modules.filter(
    (module) =>
      activeRecipeId != null &&
      recipeModuleAssessmentState(selected, activeRecipeId, module) === 'needs_assessment',
  );

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

  const submit = () => {
    if (sendingRef.current || !activeRecipeId) return;
    if (pendingModules.length === 0) return;
    const incomplete = pendingModules.some((module) => {
      const draft = draftFor(module);
      return scoreMissing(draft.timeScore) || scoreMissing(draft.qualityScore);
    });
    if (incomplete) {
      setShowMissingHints(true);
      setError(null);
      setShowSuccessDialog(false);
      return;
    }
    sendingRef.current = true;
    setSending(true);
    setError(null);
    setShowSuccessDialog(false);
    const submittedAt = new Date().toISOString();
    const modulesPayload: Parameters<typeof commitCombinedReview>[0]['modules'] = {};
    for (const module of pendingModules) {
      const draft = draftFor(module);
      const time = parseKitchenSkillsReviewScore(draft.timeScore);
      const quality = parseKitchenSkillsReviewScore(draft.qualityScore);
      if (!time.ok || !quality.ok) {
        sendingRef.current = false;
        setSending(false);
        setShowMissingHints(true);
        setShowSuccessDialog(false);
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
      setShowSuccessDialog(false);
      setError(kitchenSkillsReviewCommitErrorMessage(result.reason, 'combined', result.missing));
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
    setShowMissingHints(false);
    setShowSuccessDialog(true);
  };

  return (
    <div className="kitchen-day-tutor-session" data-testid="kitchen-day-tutor-combined-session">
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
                    setShowMissingHints(false);
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
        <div className="kitchen-day-tutor-combined-panel" data-testid="kitchen-day-tutor-combined-stack">
          <div
            className="kitchen-day-tutor-combined-module-strip"
            aria-label="Module assessment status"
            data-testid="kitchen-day-tutor-combined-module-strip"
          >
            {modules.map((module) => {
              const state = recipeModuleAssessmentState(selected, activeRecipeId, module);
              return (
                <span key={module} className="kitchen-day-tutor-combined-module-strip__item">
                  <span className="kitchen-day-tutor-combined-module-strip__name">
                    {KITCHEN_SKILLS_MODULE_TITLES[module]}
                  </span>
                  <ModuleStatusLabel state={state} />
                </span>
              );
            })}
          </div>

          {modules.map((module) => {
            const state = recipeModuleAssessmentState(selected, activeRecipeId, module);
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
                <header className="kitchen-day-tutor-combined-module__header">
                  <h2 className="kitchen-day-tutor-combined-module__title">
                    {KITCHEN_SKILLS_MODULE_TITLES[module]}
                  </h2>
                  <ModuleStatusLabel state={state} />
                </header>

                <div className="kitchen-day-tutor-combined-module__body">
                  <div className="kitchen-day-tutor-combined-module__evidence">
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
                      collapsePortionTable
                      showWasteAnalytics={module === 'trimSmart'}
                    />
                  </div>
                  <div className="kitchen-day-tutor-combined-module__assessment">
                    {confirmed ? (
                      <ModuleReadback module={module} review={confirmed} state="reviewed" />
                    ) : awaiting ? (
                      <ModuleReadback module={module} review={awaiting} state="awaiting_confirmation" />
                    ) : (
                      <ModuleDraftForm
                        module={module}
                        draft={draftFor(module)}
                        onDraftChange={(draft) => setDraft(module, draft)}
                        disabled={sending}
                        showMissingHints={showMissingHints}
                      />
                    )}
                  </div>
                </div>
              </section>
            );
          })}

          {pendingModules.length > 0 ? (
            <div
              className="kitchen-day-tutor-combined-submit"
              data-testid="kitchen-day-tutor-combined-submit-bar"
            >
              {error ? (
                <p
                  className="kitchen-day-tutor-combined-submit__error"
                  data-testid="kitchen-day-combined-review-error"
                  role="alert"
                >
                  {error}
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
                disabled={sending}
                onClick={submit}
              >
                Submit assessment
              </button>
            </div>
          ) : (
            <p
              className="kitchen-day-tutor-combined-submit__done"
              data-testid="kitchen-day-combined-review-all-done"
            >
              Every evidenced module for this recipe is submitted.
            </p>
          )}
        </div>
      ) : (
        <p data-testid="kitchen-day-tutor-combined-empty">No recipe evidence is available for assessment.</p>
      )}

      {showSuccessDialog ? (
        <CombinedSubmitSuccessDialog onAssessAnother={onAssessAnother} onClose={onCloseTrainer} />
      ) : null}
    </div>
  );
}
