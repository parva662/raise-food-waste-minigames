import { useEffect, useMemo, useState } from 'react';
import type {
  KitchenSkillsReviewedModule,
  KitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/domain/types';
import { KITCHEN_SKILLS_MODULE_TITLES } from '@/products/kitchen-skills-challenge/domain/types';
import {
  isLegacySessionReview,
  isReviewPersistConfirmed,
  listSessionRecipeIds,
  recipeAssessmentStatus,
  recipeDisplayName,
  recipeModuleAssessmentState,
  recipeModuleHasEvidence,
  resolveEvidenceRecipeId,
  unattributedEvidenceModules,
  type KitchenSkillsModuleAssessmentState,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import { KitchenSkillsTrainerModuleReviewForm } from '@/products/kitchen-skills-challenge/surfaces/trainer/KitchenSkillsTrainerReviewForm';
import {
  EMPTY_REVIEW_DRAFT,
  reviewDraftStorageKey,
  type KitchenSkillsReviewFormDraft,
} from '@/products/kitchen-skills-challenge/surfaces/trainer/reviewDrafts';
import { normalizeRecipeId } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
import {
  KITCHEN_SKILLS_ASSESSMENT_STATE_LABELS,
  moduleHasEvidence,
  sessionAssessmentCounts,
  sessionAssessmentSlots,
  sessionAssessmentStatus,
  sortModulesForTrainer,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';
import {
  TrainerStateDot,
  TrainerStatusChip,
} from '@/products/kitchen-skills-challenge/surfaces/trainer/TrainerStatusChip';

const ALL_MODULES: readonly KitchenSkillsReviewedModule[] = [
  'portionPrecision',
  'trimSmart',
  'rescueAndReuse',
];

function evidencedModulesForRecipe(
  session: KitchenSkillsTrainerSession,
  recipeId: string,
): KitchenSkillsReviewedModule[] {
  return sortModulesForTrainer(
    ALL_MODULES.filter((module) => recipeModuleHasEvidence(session, recipeId, module)),
  );
}

/** Earliest module needing assessment, else one awaiting confirmation, else the first evidenced. */
function defaultModuleForRecipe(
  session: KitchenSkillsTrainerSession,
  recipeId: string,
): KitchenSkillsReviewedModule {
  const modules = evidencedModulesForRecipe(session, recipeId);
  const withState = (state: KitchenSkillsModuleAssessmentState) =>
    modules.find((module) => recipeModuleAssessmentState(session, recipeId, module) === state);
  return (
    withState('needs_assessment') ??
    withState('awaiting_confirmation') ??
    modules[0] ??
    'portionPrecision'
  );
}

function initialRecipeId(session: KitchenSkillsTrainerSession, recipeIds: readonly string[]): string | null {
  const slots = sessionAssessmentSlots(session).filter((slot) => slot.recipeId !== null);
  return (
    slots.find((slot) => slot.state === 'needs_assessment')?.recipeId ??
    slots.find((slot) => slot.state === 'awaiting_confirmation')?.recipeId ??
    recipeIds[0] ??
    null
  );
}

function defaultLegacyModule(session: KitchenSkillsTrainerSession): KitchenSkillsReviewedModule {
  return sortModulesForTrainer(ALL_MODULES.filter((module) => moduleHasEvidence(session, module)))[0]
    ?? 'portionPrecision';
}

function legacyModuleState(
  session: KitchenSkillsTrainerSession,
  module: KitchenSkillsReviewedModule,
): KitchenSkillsModuleAssessmentState {
  const review = session.moduleReviews[module];
  if (!review) return 'needs_assessment';
  return isReviewPersistConfirmed(review) ? 'reviewed' : 'awaiting_confirmation';
}

function entriesForRecipe<T extends { recipeId?: string }>(
  session: KitchenSkillsTrainerSession,
  entries: readonly T[],
  recipeId: string,
): T[] {
  const rid = normalizeRecipeId(recipeId);
  if (!rid) return [];
  return entries.filter((entry) => resolveEvidenceRecipeId(session, entry.recipeId) === rid);
}

function recipeStateFor(
  session: KitchenSkillsTrainerSession,
  recipeId: string,
): KitchenSkillsModuleAssessmentState {
  const status = recipeAssessmentStatus(session, recipeId);
  return status === 'no_evidence' ? 'reviewed' : status;
}

function SessionProgress({
  session,
  recipeName,
  hasUnsavedDraft,
}: {
  session: KitchenSkillsTrainerSession;
  recipeName: string | null;
  hasUnsavedDraft: boolean;
}) {
  const counts = sessionAssessmentCounts(session);
  return (
    <section
      className="kitchen-day-tutor-progress"
      aria-label="Session assessment progress"
      data-testid="kitchen-day-tutor-session-progress"
    >
      <TrainerStatusChip
        state={sessionAssessmentStatus(session)}
        testId="kitchen-day-tutor-session-status"
      />
      {recipeName ? (
        <span className="kitchen-day-tutor-progress__recipe" data-testid="kitchen-day-tutor-active-recipe">
          {recipeName}
        </span>
      ) : null}
      <span className="kitchen-day-tutor-progress__counts" data-testid="kitchen-day-tutor-session-counts">
        {counts.confirmed} confirmed · {counts.awaiting} awaiting confirmation · {counts.outstanding}{' '}
        outstanding
      </span>
      {hasUnsavedDraft ? (
        <span className="kitchen-day-tutor-unsaved-hint" data-testid="kitchen-day-tutor-unsaved-hint">
          Unsaved draft
        </span>
      ) : null}
    </section>
  );
}

function ModuleTabs({
  modules,
  active,
  stateOf,
  onSelect,
}: {
  modules: readonly KitchenSkillsReviewedModule[];
  active: KitchenSkillsReviewedModule;
  stateOf: (module: KitchenSkillsReviewedModule) => KitchenSkillsModuleAssessmentState;
  onSelect: (module: KitchenSkillsReviewedModule) => void;
}) {
  return (
    <div
      className="kitchen-day-tutor-module-tabs"
      role="tablist"
      aria-label="Recorded modules"
      data-testid="kitchen-day-tutor-module-tabs"
      style={{ ['--tutor-module-count' as string]: modules.length }}
    >
      {modules.map((module) => {
        const selected = module === active;
        const state = stateOf(module);
        return (
          <button
            key={module}
            type="button"
            role="tab"
            className={
              selected
                ? 'kitchen-day-tutor-module-tab kitchen-day-tutor-module-tab--active'
                : 'kitchen-day-tutor-module-tab'
            }
            aria-selected={selected}
            data-testid={`kitchen-day-tutor-module-tab-${module}`}
            data-module-status={state}
            onClick={() => onSelect(module)}
          >
            <span className="kitchen-day-tutor-module-tab__title">
              <TrainerStateDot state={state} />
              {KITCHEN_SKILLS_MODULE_TITLES[module]}
            </span>
            <span className="kitchen-day-tutor-module-tab__state" aria-hidden="true">
              {KITCHEN_SKILLS_ASSESSMENT_STATE_LABELS[state]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RecipeSelector({
  session,
  recipeIds,
  activeRecipeId,
  onSelect,
}: {
  session: KitchenSkillsTrainerSession;
  recipeIds: readonly string[];
  activeRecipeId: string;
  onSelect: (recipeId: string) => void;
}) {
  const reviewed = recipeIds.filter((id) => recipeAssessmentStatus(session, id) === 'reviewed').length;
  return (
    <section
      className="kitchen-day-tutor-recipe-selector"
      aria-label="Recipes in this session"
      data-testid="kitchen-day-tutor-recipe-tabs"
    >
      <p className="kitchen-day-tutor-recipe-selector__summary" data-testid="kitchen-day-tutor-recipe-summary">
        {recipeIds.length} recipes · {reviewed} of {recipeIds.length} reviewed
      </p>
      <div className="kitchen-day-tutor-recipe-selector__list" role="tablist" aria-label="Recipes">
        {recipeIds.map((id) => {
          const selectedTab = id === activeRecipeId;
          const status = recipeAssessmentStatus(session, id);
          const state = recipeStateFor(session, id);
          return (
            <button
              key={id}
              type="button"
              role="tab"
              className={
                selectedTab
                  ? 'kitchen-day-tutor-recipe-chip kitchen-day-tutor-recipe-chip--active'
                  : 'kitchen-day-tutor-recipe-chip'
              }
              aria-selected={selectedTab}
              data-testid={`kitchen-day-tutor-recipe-tab-${id}`}
              data-recipe-status={status}
              onClick={() => onSelect(id)}
            >
              <span className="kitchen-day-tutor-recipe-chip__name">{recipeDisplayName(session, id)}</span>
              <span className={`kitchen-day-tutor-recipe-chip__status kitchen-day-tutor-recipe-chip__status--${state}`}>
                <TrainerStateDot state={state} />
                <span aria-hidden="true">{KITCHEN_SKILLS_ASSESSMENT_STATE_LABELS[state]}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function UnlinkedEvidenceNote({
  session,
  modules,
}: {
  session: KitchenSkillsTrainerSession;
  modules: readonly KitchenSkillsReviewedModule[];
}) {
  if (modules.length === 0) return null;
  return (
    <details className="kitchen-day-tutor-unlinked" data-testid="kitchen-day-tutor-unlinked-evidence">
      <summary>
        {modules.map((module) => KITCHEN_SKILLS_MODULE_TITLES[module]).join(', ')} evidence is not linked to a
        recipe
      </summary>
      <p className="kitchen-day-tutor-unlinked__note" data-testid="kitchen-day-tutor-unattributed-review-note">
        Recorded before recipe tracking, so it cannot be assessed per recipe here. It is shown as outstanding
        until a session-level assessment exists in GameBus.
      </p>
      <SessionEvidence
        trimEntries={modules.includes('trimSmart') ? session.trimEntries : []}
        rescueEntries={modules.includes('rescueAndReuse') ? session.rescueEntries : []}
        portionEntries={[]}
        sessionPortionEntries={session.portionEntries}
        trimEntriesForRescueLookup={session.trimEntries}
        modules={sortModulesForTrainer(modules)}
        testIdPrefix="kitchen-day-chef-unlinked"
        collapsePortionTable
      />
    </details>
  );
}

function LegacyReviewsSection({
  legacyReviews,
}: {
  legacyReviews: KitchenSkillsTrainerSession['reviews'];
}) {
  if (legacyReviews.length === 0) return null;
  return (
    <details
      className="kitchen-day-tutor-legacy"
      data-testid="kitchen-day-tutor-legacy-session-reviews"
    >
      <summary>Historical session-level assessments ({legacyReviews.length})</summary>
      <ul className="kitchen-day-evidence-list">
        {legacyReviews.map((review) => (
          <li key={review.persistId ?? `${review.reviewedGame}-${review.submittedAt}`}>
            {KITCHEN_SKILLS_MODULE_TITLES[review.reviewedGame]}: time {review.timeEfficiencyScore}
            /5, quality {review.preparationQualityScore}/5
            {review.chefFeedback ? ` — ${review.chefFeedback}` : ''}
          </li>
        ))}
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
  /** Parent-owned drafts keyed by actor::session::recipe::module. */
  drafts: Readonly<Record<string, KitchenSkillsReviewFormDraft>>;
  onDraftChange: (key: string, draft: KitchenSkillsReviewFormDraft) => void;
}) {
  const recipeIds = useMemo(() => listSessionRecipeIds(selected), [selected]);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(() =>
    initialRecipeId(selected, recipeIds),
  );
  const [activeModule, setActiveModule] = useState<KitchenSkillsReviewedModule>(() => {
    const recipe = initialRecipeId(selected, recipeIds);
    return recipe ? defaultModuleForRecipe(selected, recipe) : defaultLegacyModule(selected);
  });

  // Feed updates never move the tutor; only re-anchor when the current target vanished.
  useEffect(() => {
    if (activeRecipeId && recipeIds.includes(activeRecipeId)) return;
    const next = initialRecipeId(selected, recipeIds);
    setActiveRecipeId(next);
    if (next) setActiveModule(defaultModuleForRecipe(selected, next));
  }, [selected, recipeIds, activeRecipeId]);

  useEffect(() => {
    if (!activeRecipeId) {
      if (!moduleHasEvidence(selected, activeModule)) setActiveModule(defaultLegacyModule(selected));
      return;
    }
    if (!recipeModuleHasEvidence(selected, activeRecipeId, activeModule)) {
      setActiveModule(defaultModuleForRecipe(selected, activeRecipeId));
    }
  }, [selected, activeRecipeId, activeModule]);

  const legacyReviews = useMemo(
    () => (selected.reviews ?? []).filter(isLegacySessionReview),
    [selected],
  );
  const sessionHasUnsavedDraft = Object.entries(drafts).some(([key, draft]) => {
    if (!key.startsWith(`${selected.actorId}::${selected.sessionId}::`)) return false;
    return (
      draft.timeScore.trim().length > 0 ||
      draft.qualityScore.trim().length > 0 ||
      draft.feedback.trim().length > 0
    );
  });

  // Trim/Rescue-only sessions without any recipe id: read-only legacy module evidence.
  if (recipeIds.length === 0) {
    const modules = sortModulesForTrainer(ALL_MODULES.filter((module) => moduleHasEvidence(selected, module)));
    const module = modules.includes(activeModule) ? activeModule : modules[0] ?? activeModule;
    const legacyReview = selected.moduleReviews[module];
    return (
      <div data-testid="kitchen-day-chef-selected" className="kitchen-day-tutor-session-detail">
        <SessionProgress session={selected} recipeName={null} hasUnsavedDraft={false} />
        <p className="kitchen-day-tutor-session-detail__lead" data-testid="kitchen-day-chef-readonly" hidden>
          Student measurements are read-only.
        </p>
        {modules.length > 0 ? (
          <ModuleTabs
            modules={modules}
            active={module}
            stateOf={(item) => legacyModuleState(selected, item)}
            onSelect={setActiveModule}
          />
        ) : null}
        <div
          role="tabpanel"
          className="kitchen-day-tutor-workspace"
          data-testid={`kitchen-day-tutor-module-panel-${module}`}
        >
          {modules.includes(module) ? (
            <>
              <section className="kitchen-day-tutor-workspace__evidence" aria-label="Student evidence">
                <SessionEvidence
                  trimEntries={module === 'trimSmart' ? selected.trimEntries : []}
                  rescueEntries={module === 'rescueAndReuse' ? selected.rescueEntries : []}
                  portionEntries={module === 'portionPrecision' ? selected.portionEntries : []}
                  sessionPortionEntries={selected.portionEntries}
                  trimEntriesForRescueLookup={selected.trimEntries}
                  modules={[module]}
                  testIdPrefix="kitchen-day-chef"
                  collapsePortionTable
                  hideSectionTitles
                />
              </section>
              <section className="kitchen-day-tutor-workspace__assessment" aria-label="Tutor assessment">
                <div className="kitchen-day-tutor-assessment">
                  <div className="kitchen-day-tutor-assessment__header">
                    <h3 className="kitchen-day-tutor-assessment__title">Tutor assessment</h3>
                    <TrainerStatusChip state={legacyModuleState(selected, module)} />
                  </div>
                  {legacyReview ? (
                    <p className="kitchen-day-tutor-assessment__status">
                      Session-level assessment: time {legacyReview.timeEfficiencyScore}/5, quality{' '}
                      {legacyReview.preparationQualityScore}/5
                    </p>
                  ) : null}
                  <p className="kitchen-day-tutor-assessment__status" data-testid="kitchen-day-tutor-unattributed-review-note">
                    This session has no recipe id, so it cannot receive a recipe-level assessment. New tutor
                    assessments require a recorded recipe.
                  </p>
                </div>
              </section>
            </>
          ) : (
            <p className="chef-results-empty" data-testid={`kitchen-day-tutor-module-empty-${module}`}>
              No {KITCHEN_SKILLS_MODULE_TITLES[module]} evidence in this session yet.
            </p>
          )}
        </div>
        <LegacyReviewsSection legacyReviews={legacyReviews} />
      </div>
    );
  }

  const recipeId = activeRecipeId && recipeIds.includes(activeRecipeId) ? activeRecipeId : recipeIds[0]!;
  const modulesForRecipe = evidencedModulesForRecipe(selected, recipeId);
  const moduleForPanel = modulesForRecipe.includes(activeModule)
    ? activeModule
    : modulesForRecipe[0] ?? activeModule;
  const moduleTitle = KITCHEN_SKILLS_MODULE_TITLES[moduleForPanel];
  const currentDraftKey = reviewDraftStorageKey(
    selected.actorId,
    selected.sessionId,
    recipeId,
    moduleForPanel,
  );
  const currentDraft = drafts[currentDraftKey] ?? EMPTY_REVIEW_DRAFT;
  const unlinkedModules = unattributedEvidenceModules(selected);

  return (
    <div data-testid="kitchen-day-chef-selected" className="kitchen-day-tutor-session-detail">
      <SessionProgress
        session={selected}
        recipeName={recipeIds.length === 1 ? recipeDisplayName(selected, recipeId) : null}
        hasUnsavedDraft={sessionHasUnsavedDraft}
      />
      <p className="kitchen-day-tutor-session-detail__lead" data-testid="kitchen-day-chef-readonly" hidden>
        Student measurements are read-only.
      </p>

      {recipeIds.length > 1 ? (
        <RecipeSelector
          session={selected}
          recipeIds={recipeIds}
          activeRecipeId={recipeId}
          onSelect={(id) => {
            setActiveRecipeId(id);
            setActiveModule(defaultModuleForRecipe(selected, id));
          }}
        />
      ) : null}

      <ModuleTabs
        modules={modulesForRecipe}
        active={moduleForPanel}
        stateOf={(module) => recipeModuleAssessmentState(selected, recipeId, module)}
        onSelect={setActiveModule}
      />

      <div
        role="tabpanel"
        className="kitchen-day-tutor-workspace"
        aria-label={`${recipeDisplayName(selected, recipeId)} — ${moduleTitle}`}
        data-testid={`kitchen-day-tutor-module-panel-${moduleForPanel}`}
      >
        {modulesForRecipe.includes(moduleForPanel) ? (
          <>
            <section className="kitchen-day-tutor-workspace__evidence" aria-label="Student evidence">
              <SessionEvidence
                trimEntries={
                  moduleForPanel === 'trimSmart'
                    ? entriesForRecipe(selected, selected.trimEntries, recipeId)
                    : []
                }
                rescueEntries={
                  moduleForPanel === 'rescueAndReuse'
                    ? entriesForRecipe(selected, selected.rescueEntries, recipeId)
                    : []
                }
                portionEntries={
                  moduleForPanel === 'portionPrecision'
                    ? entriesForRecipe(selected, selected.portionEntries, recipeId)
                    : []
                }
                sessionPortionEntries={selected.portionEntries}
                trimEntriesForRescueLookup={selected.trimEntries}
                modules={[moduleForPanel]}
                testIdPrefix="kitchen-day-chef"
                collapsePortionTable
                hideSectionTitles
                hidePortionRecipeTitle
              />
            </section>
            <section className="kitchen-day-tutor-workspace__assessment" aria-label="Tutor assessment">
              <KitchenSkillsTrainerModuleReviewForm
                selected={selected}
                recipeId={recipeId}
                reviewedGame={moduleForPanel}
                moduleTitle={moduleTitle}
                draft={currentDraft}
                onDraftChange={(next) => onDraftChange(currentDraftKey, next)}
              />
            </section>
          </>
        ) : (
          <p className="chef-results-empty" data-testid={`kitchen-day-tutor-module-empty-${moduleForPanel}`}>
            No {moduleTitle} evidence for this recipe yet.
          </p>
        )}
      </div>

      <UnlinkedEvidenceNote session={selected} modules={unlinkedModules} />
      <LegacyReviewsSection legacyReviews={legacyReviews} />
    </div>
  );
}
