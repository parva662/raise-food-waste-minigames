import { useEffect, useMemo, useState } from 'react';
import type {
  KitchenSkillsReviewedModule,
  KitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/domain/types';
import {
  KITCHEN_SKILLS_MODULE_TITLES,
  KITCHEN_SKILLS_REVIEWED_MODULES,
} from '@/products/kitchen-skills-challenge/domain/types';
import {
  countReviewedRecipes,
  isLegacySessionReview,
  listSessionRecipeIds,
  recipeAssessmentStatus,
  recipeDisplayName,
  recipeModuleHasEvidence,
  resolveEvidenceRecipeId,
  type KitchenSkillsRecipeAssessmentStatus,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import { formatSessionDate } from '@/products/kitchen-skills-challenge/format';
import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import { KitchenSkillsTrainerModuleReviewForm } from '@/products/kitchen-skills-challenge/surfaces/trainer/KitchenSkillsTrainerReviewForm';
import {
  EMPTY_REVIEW_DRAFT,
  reviewDraftStorageKey,
  type KitchenSkillsReviewFormDraft,
} from '@/products/kitchen-skills-challenge/surfaces/trainer/reviewDrafts';
import { normalizeRecipeId } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
import {
  moduleHasEvidence,
  sessionAssessmentStatus,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';

function defaultModuleForRecipe(
  session: KitchenSkillsTrainerSession,
  recipeId: string,
): KitchenSkillsReviewedModule {
  return (
    KITCHEN_SKILLS_REVIEWED_MODULES.find((module) =>
      recipeModuleHasEvidence(session, recipeId, module),
    ) ?? KITCHEN_SKILLS_REVIEWED_MODULES[0]
  );
}

function defaultModuleTab(session: KitchenSkillsTrainerSession): KitchenSkillsReviewedModule {
  return (
    KITCHEN_SKILLS_REVIEWED_MODULES.find((module) => moduleHasEvidence(session, module)) ??
    KITCHEN_SKILLS_REVIEWED_MODULES[0]
  );
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

function recipeStatusLabel(status: KitchenSkillsRecipeAssessmentStatus): string {
  switch (status) {
    case 'reviewed':
      return 'Reviewed';
    case 'awaiting_confirmation':
      return 'Awaiting GameBus confirmation';
    case 'needs_assessment':
      return 'Needs assessment';
    case 'no_evidence':
      return 'No evidence';
  }
}

function sessionStatusLabel(status: ReturnType<typeof sessionAssessmentStatus>): string {
  switch (status) {
    case 'reviewed':
      return 'Reviewed';
    case 'partially_reviewed':
      return 'Partially reviewed';
    case 'needs_assessment':
      return 'Needs assessment';
  }
}

function recipeStatusClass(status: KitchenSkillsRecipeAssessmentStatus): string {
  switch (status) {
    case 'reviewed':
      return 'kitchen-day-tutor-recipe-chip kitchen-day-tutor-recipe-chip--reviewed';
    case 'awaiting_confirmation':
      return 'kitchen-day-tutor-recipe-chip kitchen-day-tutor-recipe-chip--awaiting';
    case 'needs_assessment':
      return 'kitchen-day-tutor-recipe-chip kitchen-day-tutor-recipe-chip--needs';
    case 'no_evidence':
      return 'kitchen-day-tutor-recipe-chip';
  }
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
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(() => recipeIds[0] ?? null);
  const [activeModule, setActiveModule] = useState<KitchenSkillsReviewedModule>(() =>
    recipeIds[0] ? defaultModuleForRecipe(selected, recipeIds[0]) : defaultModuleTab(selected),
  );

  useEffect(() => {
    const nextIds = listSessionRecipeIds(selected);
    setActiveRecipeId((current) => {
      if (current && nextIds.includes(current)) return current;
      return nextIds[0] ?? null;
    });
  }, [selected]);

  useEffect(() => {
    if (!activeRecipeId) {
      if (!moduleHasEvidence(selected, activeModule)) {
        setActiveModule(defaultModuleTab(selected));
      }
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

  const sessionStatus = sessionAssessmentStatus(selected);
  const reviewedCounts = countReviewedRecipes(selected);

  // Trim/Rescue-only sessions without Portion: keep session-level module assessment UX.
  if (recipeIds.length === 0) {
    const hasEvidence = moduleHasEvidence(selected, activeModule);
    const moduleTitle = KITCHEN_SKILLS_MODULE_TITLES[activeModule];
    const evidencedModules = KITCHEN_SKILLS_REVIEWED_MODULES.filter((module) =>
      moduleHasEvidence(selected, module),
    );
    return (
      <div data-testid="kitchen-day-chef-selected" className="kitchen-day-tutor-session-detail">
        <header className="kitchen-day-tutor-session-detail__header">
          <p
            className="kitchen-day-tutor-session-detail__meta"
            data-testid="kitchen-day-tutor-session-meta"
          >
            <span>Student: {selected.actorName}</span>
            <span>Session: {formatSessionDate(selected.sessionDate)}</span>
          </p>
          <p
            className="kitchen-day-tutor-session-detail__session-status"
            data-testid="kitchen-day-tutor-session-status"
          >
            Session assessment: {sessionStatusLabel(sessionStatus)}
          </p>
        </header>
        <p className="kitchen-day-tutor-session-detail__lead" data-testid="kitchen-day-chef-readonly" hidden>
          Student measurements are read-only.
        </p>
        <div
          className="kitchen-day-module-tabs"
          role="tablist"
          aria-label="Kitchen Skills Challenge modules"
          data-testid="kitchen-day-tutor-module-tabs"
        >
          {(evidencedModules.length > 0 ? evidencedModules : KITCHEN_SKILLS_REVIEWED_MODULES).map(
            (module) => {
              const selectedTab = activeModule === module;
              return (
                <button
                  key={module}
                  type="button"
                  role="tab"
                  className={
                    selectedTab
                      ? 'kitchen-day-module-tabs__tab kitchen-day-module-tabs__tab--active'
                      : 'kitchen-day-module-tabs__tab'
                  }
                  aria-selected={selectedTab}
                  data-testid={`kitchen-day-tutor-module-tab-${module}`}
                  onClick={() => setActiveModule(module)}
                >
                  {KITCHEN_SKILLS_MODULE_TITLES[module]}
                </button>
              );
            },
          )}
        </div>
        <div role="tabpanel" data-testid={`kitchen-day-tutor-module-panel-${activeModule}`}>
          {hasEvidence ? (
            <>
              <SessionEvidence
                trimEntries={activeModule === 'trimSmart' ? selected.trimEntries : []}
                rescueEntries={activeModule === 'rescueAndReuse' ? selected.rescueEntries : []}
                portionEntries={activeModule === 'portionPrecision' ? selected.portionEntries : []}
                sessionPortionEntries={selected.portionEntries}
                trimEntriesForRescueLookup={selected.trimEntries}
                modules={[activeModule]}
                testIdPrefix="kitchen-day-chef"
                collapsePortionTable
              />
              <p className="chef-results-empty" data-testid="kitchen-day-tutor-unattributed-review-note">
                This session has no Portion recipe id for recipe-level assessment. New tutor assessments
                require a recorded recipe.
              </p>
            </>
          ) : (
            <p className="chef-results-empty" data-testid={`kitchen-day-tutor-module-empty-${activeModule}`}>
              No {moduleTitle} evidence in this session yet.
            </p>
          )}
        </div>
        <LegacyReviewsSection legacyReviews={legacyReviews} />
      </div>
    );
  }

  const recipeId = activeRecipeId ?? recipeIds[0]!;
  const recipeName = recipeDisplayName(selected, recipeId);
  const recipeStatus = recipeAssessmentStatus(selected, recipeId);
  const evidencedModulesForRecipe = KITCHEN_SKILLS_REVIEWED_MODULES.filter((module) =>
    recipeModuleHasEvidence(selected, recipeId, module),
  );
  const moduleForPanel = evidencedModulesForRecipe.includes(activeModule)
    ? activeModule
    : evidencedModulesForRecipe[0] ?? activeModule;
  const hasEvidence = recipeModuleHasEvidence(selected, recipeId, moduleForPanel);
  const moduleTitle = KITCHEN_SKILLS_MODULE_TITLES[moduleForPanel];
  const trimForRecipe = entriesForRecipe(selected, selected.trimEntries, recipeId);
  const rescueForRecipe = entriesForRecipe(selected, selected.rescueEntries, recipeId);
  const portionForRecipe = entriesForRecipe(selected, selected.portionEntries, recipeId);
  const currentDraftKey = reviewDraftStorageKey(
    selected.actorId,
    selected.sessionId,
    recipeId,
    moduleForPanel,
  );
  const currentDraft = drafts[currentDraftKey] ?? EMPTY_REVIEW_DRAFT;
  const sessionHasUnsavedDraft = Object.entries(drafts).some(([key, draft]) => {
    if (!key.startsWith(`${selected.actorId}::${selected.sessionId}::`)) return false;
    return (
      draft.timeScore.trim().length > 0 ||
      draft.qualityScore.trim().length > 0 ||
      draft.feedback.trim().length > 0
    );
  });

  return (
    <div data-testid="kitchen-day-chef-selected" className="kitchen-day-tutor-session-detail">
      <header className="kitchen-day-tutor-session-detail__header">
        <p
          className="kitchen-day-tutor-session-detail__meta"
          data-testid="kitchen-day-tutor-session-meta"
        >
          <span>Student: {selected.actorName}</span>
          <span>Session: {formatSessionDate(selected.sessionDate)}</span>
        </p>
        <p
          className="kitchen-day-tutor-session-detail__session-status"
          data-testid="kitchen-day-tutor-session-status"
        >
          Session assessment: {sessionStatusLabel(sessionStatus)}
          {sessionHasUnsavedDraft ? (
            <span
              className="kitchen-day-tutor-unsaved-hint"
              data-testid="kitchen-day-tutor-unsaved-hint"
            >
              {' '}
              · Unsaved draft
            </span>
          ) : null}
        </p>
      </header>
      <p className="kitchen-day-tutor-session-detail__lead" data-testid="kitchen-day-chef-readonly" hidden>
        Student measurements are read-only.
      </p>

      <section
        className="kitchen-day-tutor-recipe-selector"
        aria-label="Recipes in this session"
        data-testid="kitchen-day-tutor-recipe-tabs"
      >
        <p className="kitchen-day-tutor-recipe-selector__summary" data-testid="kitchen-day-tutor-recipe-summary">
          Recipes — {reviewedCounts.reviewed} of {reviewedCounts.total} reviewed
        </p>
        <div className="kitchen-day-tutor-recipe-selector__list" role="tablist">
          {recipeIds.map((id) => {
            const selectedTab = id === recipeId;
            const status = recipeAssessmentStatus(selected, id);
            return (
              <button
                key={id}
                type="button"
                role="tab"
                className={
                  selectedTab
                    ? 'kitchen-day-tutor-recipe-chip kitchen-day-tutor-recipe-chip--active'
                    : recipeStatusClass(status)
                }
                aria-selected={selectedTab}
                data-testid={`kitchen-day-tutor-recipe-tab-${id}`}
                data-recipe-status={status}
                onClick={() => {
                  setActiveRecipeId(id);
                  setActiveModule(defaultModuleForRecipe(selected, id));
                }}
              >
                <span className="kitchen-day-tutor-recipe-chip__name">{recipeDisplayName(selected, id)}</span>
                <span className="kitchen-day-tutor-recipe-chip__status">{recipeStatusLabel(status)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <p className="visually-hidden" data-testid="kitchen-day-tutor-active-recipe">
        {recipeName} — {recipeStatusLabel(recipeStatus)}
      </p>

      {evidencedModulesForRecipe.length > 1 ? (
        <div
          className="kitchen-day-module-tabs"
          role="tablist"
          aria-label="Modules with evidence"
          data-testid="kitchen-day-tutor-module-tabs"
        >
          {evidencedModulesForRecipe.map((module) => {
            const selectedTab = moduleForPanel === module;
            return (
              <button
                key={module}
                type="button"
                role="tab"
                className={
                  selectedTab
                    ? 'kitchen-day-module-tabs__tab kitchen-day-module-tabs__tab--active'
                    : 'kitchen-day-module-tabs__tab'
                }
                aria-selected={selectedTab}
                data-testid={`kitchen-day-tutor-module-tab-${module}`}
                onClick={() => setActiveModule(module)}
              >
                {KITCHEN_SKILLS_MODULE_TITLES[module]}
              </button>
            );
          })}
        </div>
      ) : (
        <span hidden data-testid="kitchen-day-tutor-module-tabs" />
      )}

      <div
        role="tabpanel"
        className="kitchen-day-tutor-workspace"
        data-testid={`kitchen-day-tutor-module-panel-${moduleForPanel}`}
      >
        {hasEvidence ? (
          <>
            <div className="kitchen-day-tutor-workspace__evidence">
              <h3 className="kitchen-day-tutor-workspace__column-title">Recipe performance</h3>
              <SessionEvidence
                trimEntries={moduleForPanel === 'trimSmart' ? trimForRecipe : []}
                rescueEntries={moduleForPanel === 'rescueAndReuse' ? rescueForRecipe : []}
                portionEntries={moduleForPanel === 'portionPrecision' ? portionForRecipe : []}
                sessionPortionEntries={selected.portionEntries}
                trimEntriesForRescueLookup={selected.trimEntries}
                modules={[moduleForPanel]}
                testIdPrefix="kitchen-day-chef"
                collapsePortionTable
              />
            </div>
            <div className="kitchen-day-tutor-workspace__assessment">
              <KitchenSkillsTrainerModuleReviewForm
                selected={selected}
                recipeId={recipeId}
                reviewedGame={moduleForPanel}
                moduleTitle={moduleTitle}
                draft={currentDraft}
                onDraftChange={(next) => onDraftChange(currentDraftKey, next)}
              />
            </div>
          </>
        ) : (
          <p className="chef-results-empty" data-testid={`kitchen-day-tutor-module-empty-${moduleForPanel}`}>
            No {moduleTitle} evidence for this recipe yet.
          </p>
        )}
      </div>

      <LegacyReviewsSection legacyReviews={legacyReviews} />
    </div>
  );
}
