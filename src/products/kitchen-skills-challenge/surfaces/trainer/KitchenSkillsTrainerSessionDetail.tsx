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
  recipeDisplayName,
  recipeModuleHasEvidence,
  resolveEvidenceRecipeId,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import { formatSessionDate } from '@/products/kitchen-skills-challenge/format';
import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import { KitchenSkillsTrainerModuleReviewForm } from '@/products/kitchen-skills-challenge/surfaces/trainer/KitchenSkillsTrainerReviewForm';
import { normalizeRecipeId } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
import { moduleHasEvidence } from '@/products/kitchen-skills-challenge/read/trainerSessions';

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

  // Trim/Rescue-only sessions without Portion: keep session-level module assessment UX.
  if (recipeIds.length === 0) {
    const hasEvidence = moduleHasEvidence(selected, activeModule);
    const moduleTitle = KITCHEN_SKILLS_MODULE_TITLES[activeModule];
    return (
      <div data-testid="kitchen-day-chef-selected" className="kitchen-day-tutor-session-detail">
        <h2 className="kitchen-day-tutor-session-detail__title">
          {selected.actorName} · {formatSessionDate(selected.sessionDate)}
        </h2>
        <p className="kitchen-day-tutor-session-detail__lead" data-testid="kitchen-day-chef-readonly">
          Student measurements are read-only.
        </p>
        {legacyReviews.length > 0 ? (
          <section
            className="chef-results-panel"
            data-testid="kitchen-day-tutor-legacy-session-reviews"
          >
            <h3 className="chef-results-panel__title">Historical session-level assessment</h3>
            <ul className="kitchen-day-evidence-list">
              {legacyReviews.map((review) => (
                <li key={review.persistId ?? `${review.reviewedGame}-${review.submittedAt}`}>
                  {KITCHEN_SKILLS_MODULE_TITLES[review.reviewedGame]}: time {review.timeEfficiencyScore}
                  /5, quality {review.preparationQualityScore}/5
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <div
          className="kitchen-day-module-tabs"
          role="tablist"
          aria-label="Kitchen Skills Challenge modules"
          data-testid="kitchen-day-tutor-module-tabs"
        >
          {KITCHEN_SKILLS_REVIEWED_MODULES.map((module) => {
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
                {moduleHasEvidence(selected, module) ? '' : ' (no evidence)'}
              </button>
            );
          })}
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
      </div>
    );
  }

  const recipeId = activeRecipeId ?? recipeIds[0]!;
  const recipeName = recipeDisplayName(selected, recipeId);
  const hasEvidence = recipeModuleHasEvidence(selected, recipeId, activeModule);
  const moduleTitle = KITCHEN_SKILLS_MODULE_TITLES[activeModule];
  const trimForRecipe = entriesForRecipe(selected, selected.trimEntries, recipeId);
  const rescueForRecipe = entriesForRecipe(selected, selected.rescueEntries, recipeId);
  const portionForRecipe = entriesForRecipe(selected, selected.portionEntries, recipeId);

  return (
    <div data-testid="kitchen-day-chef-selected" className="kitchen-day-tutor-session-detail">
      <h2 className="kitchen-day-tutor-session-detail__title">
        {selected.actorName} · {formatSessionDate(selected.sessionDate)}
      </h2>
      <p className="kitchen-day-tutor-session-detail__lead" data-testid="kitchen-day-chef-readonly">
        Student measurements are read-only.
      </p>

      {recipeIds.length > 1 ? (
        <div
          className="kitchen-day-module-tabs"
          role="tablist"
          aria-label="Recipes in this session"
          data-testid="kitchen-day-tutor-recipe-tabs"
        >
          {recipeIds.map((id) => {
            const selectedTab = id === recipeId;
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
                onClick={() => {
                  setActiveRecipeId(id);
                  setActiveModule(defaultModuleForRecipe(selected, id));
                }}
              >
                {recipeDisplayName(selected, id)}
              </button>
            );
          })}
        </div>
      ) : null}

      <p className="kitchen-day-tutor-session-detail__lead" data-testid="kitchen-day-tutor-active-recipe">
        Recipe: {recipeName}
      </p>

      {legacyReviews.length > 0 ? (
        <section
          className="chef-results-panel"
          data-testid="kitchen-day-tutor-legacy-session-reviews"
        >
          <h3 className="chef-results-panel__title">Historical session-level assessment</h3>
          <p className="chef-results-panel__intro">
            Earlier tutor assessments were recorded for the whole session, not for a single recipe.
          </p>
          <ul className="kitchen-day-evidence-list">
            {legacyReviews.map((review) => (
              <li key={review.persistId ?? `${review.reviewedGame}-${review.submittedAt}`}>
                {KITCHEN_SKILLS_MODULE_TITLES[review.reviewedGame]}: time {review.timeEfficiencyScore}/5,
                quality {review.preparationQualityScore}/5
                {review.chefFeedback ? ` — ${review.chefFeedback}` : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div
        className="kitchen-day-module-tabs"
        role="tablist"
        aria-label="Kitchen Skills Challenge modules"
        data-testid="kitchen-day-tutor-module-tabs"
      >
        {KITCHEN_SKILLS_REVIEWED_MODULES.map((module) => {
          const selectedTab = activeModule === module;
          const evidenced = recipeModuleHasEvidence(selected, recipeId, module);
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
              {evidenced ? '' : ' (no evidence)'}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" data-testid={`kitchen-day-tutor-module-panel-${activeModule}`}>
        {hasEvidence ? (
          <>
            <SessionEvidence
              trimEntries={activeModule === 'trimSmart' ? trimForRecipe : []}
              rescueEntries={activeModule === 'rescueAndReuse' ? rescueForRecipe : []}
              portionEntries={activeModule === 'portionPrecision' ? portionForRecipe : []}
              sessionPortionEntries={selected.portionEntries}
              trimEntriesForRescueLookup={selected.trimEntries}
              modules={[activeModule]}
              testIdPrefix="kitchen-day-chef"
            />
            <KitchenSkillsTrainerModuleReviewForm
              key={`${recipeId}:${activeModule}`}
              selected={selected}
              recipeId={recipeId}
              reviewedGame={activeModule}
              moduleTitle={moduleTitle}
              onDraftChange={onDraftChange}
            />
          </>
        ) : (
          <p className="chef-results-empty" data-testid={`kitchen-day-tutor-module-empty-${activeModule}`}>
            No {moduleTitle} evidence for this recipe yet.
          </p>
        )}
      </div>
    </div>
  );
}
