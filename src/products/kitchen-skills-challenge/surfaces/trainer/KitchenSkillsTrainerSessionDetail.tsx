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
  isLegacySessionReview,
  listSessionRecipeIds,
  recipeAssessmentStatus,
  recipeDisplayName,
  recipeModuleHasEvidence,
  resolveEvidenceRecipeId,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import { formatSessionDate } from '@/products/kitchen-skills-challenge/format';
import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import {
  KitchenSkillsTrainerModuleReviewForm,
  type KitchenSkillsReviewFormDraft,
} from '@/products/kitchen-skills-challenge/surfaces/trainer/KitchenSkillsTrainerReviewForm';
import { normalizeRecipeId } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
import {
  moduleHasEvidence,
  sessionAssessmentStatus,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';

const EMPTY_DRAFT: KitchenSkillsReviewFormDraft = {
  timeScore: '',
  qualityScore: '',
  feedback: '',
};

function draftKey(recipeId: string, module: KitchenSkillsReviewedModule): string {
  return `${recipeId}::${module}`;
}

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

function recipeStatusLabel(status: ReturnType<typeof recipeAssessmentStatus>): string {
  switch (status) {
    case 'reviewed':
      return 'REVIEWED';
    case 'needs_assessment':
      return 'NEEDS ASSESSMENT';
    case 'no_evidence':
      return 'NO EVIDENCE';
  }
}

function sessionStatusLabel(status: ReturnType<typeof sessionAssessmentStatus>): string {
  switch (status) {
    case 'reviewed':
      return 'REVIEWED';
    case 'partially_reviewed':
      return 'PARTIALLY REVIEWED';
    case 'needs_assessment':
      return 'NEEDS ASSESSMENT';
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
  onDraftChange,
}: {
  selected: KitchenSkillsTrainerSession;
  onDraftChange?: (dirty: boolean) => void;
}) {
  const recipeIds = useMemo(() => listSessionRecipeIds(selected), [selected]);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(() => recipeIds[0] ?? null);
  const [activeModule, setActiveModule] = useState<KitchenSkillsReviewedModule>(() =>
    recipeIds[0] ? defaultModuleForRecipe(selected, recipeIds[0]) : defaultModuleTab(selected),
  );
  const [drafts, setDrafts] = useState<Record<string, KitchenSkillsReviewFormDraft>>({});

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
          <h2 className="kitchen-day-tutor-session-detail__title">
            {selected.actorName} — {formatSessionDate(selected.sessionDate)}
          </h2>
          <p
            className="kitchen-day-tutor-session-detail__session-status"
            data-testid="kitchen-day-tutor-session-status"
          >
            Session: {sessionStatusLabel(sessionStatus)}
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
  const currentDraftKey = draftKey(recipeId, moduleForPanel);
  const currentDraft = drafts[currentDraftKey] ?? EMPTY_DRAFT;

  return (
    <div data-testid="kitchen-day-chef-selected" className="kitchen-day-tutor-session-detail">
      <header className="kitchen-day-tutor-session-detail__header">
        <h2 className="kitchen-day-tutor-session-detail__title">
          {selected.actorName} — {formatSessionDate(selected.sessionDate)}
        </h2>
        <p
          className="kitchen-day-tutor-session-detail__session-status"
          data-testid="kitchen-day-tutor-session-status"
        >
          Session: {sessionStatusLabel(sessionStatus)}
        </p>
      </header>
      <p className="kitchen-day-tutor-session-detail__lead" data-testid="kitchen-day-chef-readonly" hidden>
        Student measurements are read-only.
      </p>

      <div
        className="kitchen-day-module-tabs kitchen-day-tutor-recipe-tabs"
        role="tablist"
        aria-label="Recipes in this session"
        data-testid="kitchen-day-tutor-recipe-tabs"
      >
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
                  ? 'kitchen-day-module-tabs__tab kitchen-day-module-tabs__tab--active'
                  : 'kitchen-day-module-tabs__tab'
              }
              aria-selected={selectedTab}
              data-testid={`kitchen-day-tutor-recipe-tab-${id}`}
              data-recipe-status={status}
              onClick={() => {
                setActiveRecipeId(id);
                setActiveModule(defaultModuleForRecipe(selected, id));
              }}
            >
              <span>{recipeDisplayName(selected, id)}</span>
              <span
                className={
                  status === 'reviewed'
                    ? 'kitchen-day-tutor-recipe-badge kitchen-day-tutor-recipe-badge--reviewed'
                    : 'kitchen-day-tutor-recipe-badge kitchen-day-tutor-recipe-badge--needs'
                }
              >
                {status === 'reviewed' ? 'Reviewed' : 'Needs assessment'}
              </span>
            </button>
          );
        })}
      </div>

      <p
        className="kitchen-day-tutor-session-detail__recipe-status"
        data-testid="kitchen-day-tutor-active-recipe"
      >
        {recipeName} — {recipeStatusLabel(recipeStatus)}
      </p>

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

      <div role="tabpanel" data-testid={`kitchen-day-tutor-module-panel-${moduleForPanel}`}>
        {hasEvidence ? (
          <>
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
            <KitchenSkillsTrainerModuleReviewForm
              selected={selected}
              recipeId={recipeId}
              reviewedGame={moduleForPanel}
              moduleTitle={moduleTitle}
              draft={currentDraft}
              onDraftChange={(next) =>
                setDrafts((current) => ({ ...current, [currentDraftKey]: next }))
              }
              onDraftDirtyChange={onDraftChange}
            />
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
