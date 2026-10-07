import type { ReactNode } from 'react';
import { discardedWasteGrams } from '@/products/kitchen-skills-challenge/domain/trim/derived';
import { TRIM_TECHNIQUE_LABELS } from '@/products/kitchen-skills-challenge/domain/trim/techniques';
import { compareTrimIngredientToRecipeReference } from '@/products/kitchen-skills-challenge/domain/trim/objectiveComparison';
import { sessionRecipeReference } from '@/products/kitchen-skills-challenge/domain/session/sessionRecipe';
import {
  formatFinalWeightDifference,
  formatMetricPercent,
  formatPortionDeviation,
  formatPortionDifference,
} from '@/products/kitchen-skills-challenge/domain/portion/copy';
import { buildPortionRecipeMetrics } from '@/products/kitchen-skills-challenge/domain/portion/metrics';
import { getRecipeReference, type RecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import {
  formatDeltaPercentagePoints,
  formatDurationFromMinutes,
  formatGrams,
  formatScore,
  formatWastePercent,
} from '@/products/kitchen-skills-challenge/format';
import type {
  KitchenSkillsModuleReviews,
  KitchenSkillsPortionEntry,
  KitchenSkillsRescueEntry,
  KitchenSkillsReviewedModule,
  KitchenSkillsReviewEntry,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';
import { KITCHEN_SKILLS_REVIEWED_MODULES } from '@/products/kitchen-skills-challenge/domain/types';

function Fact({
  label,
  value,
  testId,
  stacked = false,
}: {
  label: string;
  value: string;
  testId?: string;
  stacked?: boolean;
}) {
  return (
    <div className={stacked ? 'kitchen-day-fact kitchen-day-fact--stacked' : 'kitchen-day-fact'}>
      <dt>{label}</dt>
      <dd data-testid={testId}>{value}</dd>
    </div>
  );
}

function PortionCompositionTable({
  entry,
  recipe,
  testIdPrefix,
}: {
  entry: KitchenSkillsPortionEntry;
  recipe: RecipeReference | null;
  testIdPrefix: string;
}) {
  return (
    <div className="kitchen-day-portion-table-wrap">
      <table className="kitchen-day-portion-table">
        <thead>
          <tr>
            <th scope="col">Ingredient</th>
            <th scope="col">Target</th>
            <th scope="col">Actual</th>
            <th scope="col">Difference</th>
            <th scope="col">Deviation %</th>
          </tr>
        </thead>
        <tbody>
          {entry.recipeComposition.map((line) => {
            const required = recipe?.lines.find((item) => item.ingredientId === line.ingredientId);
            return (
              <tr key={line.ingredientId}>
                <th scope="row">{line.ingredientName}</th>
                <td data-testid={`${testIdPrefix}-portion-target-${entry.recipeId}-${line.ingredientId}`}>
                  {required ? `${required.requiredAmount} ${required.unit}` : '—'}
                </td>
                <td data-testid={`${testIdPrefix}-portion-actual-${entry.recipeId}-${line.ingredientId}`}>
                  {line.actualAmount} {line.unit}
                </td>
                <td data-testid={`${testIdPrefix}-portion-difference-${entry.recipeId}-${line.ingredientId}`}>
                  {required ? formatPortionDifference(required, line) : '—'}
                </td>
                <td data-testid={`${testIdPrefix}-deviation-${entry.recipeId}-${line.ingredientId}`}>
                  {required ? formatPortionDeviation(required, line) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EvidenceSection({
  collapsible,
  title,
  testId,
  children,
}: {
  collapsible: boolean;
  title: string;
  testId: string;
  children: ReactNode;
}) {
  if (!collapsible) {
    return (
      <section className="kitchen-day-evidence-section" data-testid={testId}>
        <h3 className="kitchen-day-evidence-section__title">{title}</h3>
        {children}
      </section>
    );
  }

  return (
    <details className="kitchen-day-evidence-section kitchen-day-evidence-section--collapsible" data-testid={testId}>
      <summary className="kitchen-day-evidence-section__title">{title}</summary>
      {children}
    </details>
  );
}

function ModuleReviewReadback({
  review,
  testIdPrefix,
  module,
}: {
  review: KitchenSkillsReviewEntry;
  testIdPrefix: string;
  module: KitchenSkillsReviewedModule;
}) {
  // trimSmart keeps the unscoped legacy testid so existing Session Review tests keep working.
  const testId =
    module === 'trimSmart'
      ? `${testIdPrefix}-tutor-review`
      : `${testIdPrefix}-tutor-review-${module}`;
  return (
    <section
      className="kitchen-day-evidence-section kitchen-day-evidence-section--assessment"
      data-testid={testId}
      data-module={module}
    >
      {module === 'trimSmart' ? (
        <span hidden data-testid={`${testIdPrefix}-tutor-review-trimSmart`} />
      ) : null}
      <h3 className="kitchen-day-evidence-section__title">Tutor assessment</h3>
      <dl className="kitchen-day-facts">
        <Fact label="Time efficiency" value={formatScore(review.timeEfficiencyScore)} />
        <Fact label="Preparation quality" value={formatScore(review.preparationQualityScore)} />
      </dl>
      {review.chefFeedback ? (
        <div className="kitchen-day-evidence-feedback">
          <h4 className="kitchen-day-evidence-card__title">Feedback</h4>
          <p>{review.chefFeedback}</p>
        </div>
      ) : null}
    </section>
  );
}

function resolveModuleReviews(
  moduleReviews: KitchenSkillsModuleReviews | null | undefined,
  review: KitchenSkillsReviewEntry | null | undefined,
): KitchenSkillsModuleReviews {
  const base: KitchenSkillsModuleReviews = moduleReviews ?? {
    trimSmart: null,
    rescueAndReuse: null,
    portionPrecision: null,
  };
  if (!review) return base;
  if (base[review.reviewedGame]) return base;
  return { ...base, [review.reviewedGame]: review };
}

export function SessionEvidence({
  trimEntries,
  rescueEntries,
  portionEntries,
  review,
  moduleReviews,
  trimEntriesForRescueLookup,
  modules = KITCHEN_SKILLS_REVIEWED_MODULES,
  testIdPrefix = 'kitchen-day',
  collapsible = false,
  collapsePortionTable = false,
  showWasteAnalytics = true,
  sessionPortionEntries,
}: {
  trimEntries: readonly KitchenSkillsTrimEntry[];
  rescueEntries: readonly KitchenSkillsRescueEntry[];
  portionEntries: readonly KitchenSkillsPortionEntry[];
  review?: KitchenSkillsReviewEntry | null;
  moduleReviews?: KitchenSkillsModuleReviews | null;
  /** When rescue is shown alone, pass trim entries so ingredient names / discarded waste still resolve. */
  trimEntriesForRescueLookup?: readonly KitchenSkillsTrimEntry[];
  modules?: readonly KitchenSkillsReviewedModule[];
  testIdPrefix?: string;
  collapsible?: boolean;
  collapsePortionTable?: boolean;
  showWasteAnalytics?: boolean;
  /** Portion records for the same session, used to join Trim ingredients to JAMIX. */
  sessionPortionEntries?: readonly KitchenSkillsPortionEntry[];
}) {
  const visible = new Set(modules);
  const recipe = sessionRecipeReference(sessionPortionEntries ?? portionEntries);
  const reviews = resolveModuleReviews(moduleReviews, review);
  const rescueTrimLookup = trimEntriesForRescueLookup ?? trimEntries;

  return (
    <div className="kitchen-day-evidence" data-testid={`${testIdPrefix}-evidence`} data-readonly="true">
      {visible.has('trimSmart') ? (
        <EvidenceSection collapsible={collapsible} title="Trim Smart" testId={`${testIdPrefix}-trim-section`}>
          {trimEntries.length === 0 ? (
            <p className="chef-results-empty">No completed preparation yet.</p>
          ) : (
            <ul className="kitchen-day-evidence-list" data-testid={`${testIdPrefix}-trim-list`}>
              {trimEntries.map((entry) => {
                const comparison = showWasteAnalytics
                  ? compareTrimIngredientToRecipeReference(entry, recipe)
                  : null;
                const actualRemoved =
                  comparison?.actualTrimPercent != null
                    ? `${formatGrams(entry.actualWasteGrams)} (${formatWastePercent(comparison.actualTrimPercent)})`
                    : formatGrams(entry.actualWasteGrams);
                return (
                  <li
                    key={entry.ingredientId}
                    className="kitchen-day-evidence-card"
                    data-testid={`${testIdPrefix}-trim-${entry.ingredientId}`}
                  >
                    <h4 className="kitchen-day-evidence-card__title">{entry.ingredientName}</h4>
                    <dl className="kitchen-day-facts">
                      <Fact label="Starting weight" value={formatGrams(entry.ingredientWeightGrams)} />
                      <Fact label="Technique" value={TRIM_TECHNIQUE_LABELS[entry.trimTechniques]} />
                      <Fact label="Estimated waste" value={formatGrams(entry.estimatedWasteGrams)} />
                      {showWasteAnalytics ? (
                        <Fact
                          label="Actual removed"
                          value={actualRemoved}
                          testId={`${testIdPrefix}-actual-removed-${entry.ingredientId}`}
                        />
                      ) : (
                        <Fact label="Actual waste" value={formatGrams(entry.actualWasteGrams)} />
                      )}
                      {showWasteAnalytics ? (
                        <Fact
                          label="JAMIX reference"
                          stacked
                          value={
                            comparison?.status === 'available'
                              ? `${formatWastePercent(comparison.referenceWastePercent)} (~${formatGrams(comparison.referenceRemovedGrams)} for this starting amount)`
                              : 'Reference unavailable'
                          }
                          testId={`${testIdPrefix}-jamix-reference-${entry.ingredientId}`}
                        />
                      ) : null}
                      <Fact label="Duration" value={formatDurationFromMinutes(entry.durationMinutes)} />
                    </dl>
                    {showWasteAnalytics && comparison?.status === 'available' ? (
                      <p
                        className="kitchen-day-evidence-note"
                        data-testid={`${testIdPrefix}-reference-delta-${entry.ingredientId}`}
                      >
                        {formatDeltaPercentagePoints(comparison.deltaPercentagePoints)}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          {reviews.trimSmart ? (
            <ModuleReviewReadback review={reviews.trimSmart} testIdPrefix={testIdPrefix} module="trimSmart" />
          ) : null}
        </EvidenceSection>
      ) : null}

      {visible.has('rescueAndReuse') ? (
        <EvidenceSection collapsible={collapsible} title="Rescue & Reuse" testId={`${testIdPrefix}-rescue-section`}>
          {rescueEntries.length === 0 ? (
            <p className="chef-results-empty">No reuse suggestions yet.</p>
          ) : (
            <ul className="kitchen-day-evidence-list" data-testid={`${testIdPrefix}-rescue-list`}>
              {rescueEntries.map((entry) => {
                const trim = rescueTrimLookup.find((item) => item.ingredientId === entry.ingredientId);
                const discarded = trim
                  ? discardedWasteGrams(trim.actualWasteGrams, entry.reusableWasteGrams)
                  : null;
                return (
                  <li
                    key={entry.ingredientId}
                    className="kitchen-day-evidence-card"
                    data-testid={`${testIdPrefix}-rescue-${entry.ingredientId}`}
                  >
                    <h4 className="kitchen-day-evidence-card__title">
                      {trim?.ingredientName ?? entry.ingredientId}
                    </h4>
                    <dl className="kitchen-day-facts">
                      <Fact label="Reusable" value={formatGrams(entry.reusableWasteGrams)} />
                      <Fact label="Destination" value={entry.reuseDestination} />
                      {discarded != null ? <Fact label="Discarded" value={formatGrams(discarded)} /> : null}
                    </dl>
                  </li>
                );
              })}
            </ul>
          )}
          {reviews.rescueAndReuse ? (
            <ModuleReviewReadback
              review={reviews.rescueAndReuse}
              testIdPrefix={testIdPrefix}
              module="rescueAndReuse"
            />
          ) : null}
        </EvidenceSection>
      ) : null}

      {visible.has('portionPrecision') ? (
        <EvidenceSection collapsible={collapsible} title="Portion Precision" testId={`${testIdPrefix}-portion-section`}>
          {portionEntries.length === 0 ? (
            <p className="chef-results-empty">No recipes recorded yet.</p>
          ) : (
            <ul className="kitchen-day-evidence-list" data-testid={`${testIdPrefix}-portion-list`}>
              {portionEntries.map((entry) => {
                const recipe = getRecipeReference(entry.recipeId);
                const metrics = buildPortionRecipeMetrics(entry, recipe);
                return (
                  <li
                    key={`${entry.recipeId}-${entry.submittedAt}`}
                    className="kitchen-day-evidence-card"
                    data-testid={`${testIdPrefix}-portion-${entry.recipeId}`}
                  >
                    <h4 className="kitchen-day-evidence-card__title">{entry.recipeName}</h4>
                    <dl className="kitchen-day-facts">
                      <Fact
                        label="Ingredient accuracy"
                        value={formatMetricPercent(metrics.recipeIngredientAccuracyPercent)}
                        testId={`${testIdPrefix}-portion-accuracy-${entry.recipeId}`}
                      />
                      <Fact
                        label="Ingredient error"
                        value={formatMetricPercent(metrics.recipeIngredientErrorPercent)}
                      />
                      <Fact
                        label="Expected final weight"
                        value={
                          metrics.expectedFinalWeightGrams == null
                            ? '—'
                            : formatGrams(metrics.expectedFinalWeightGrams)
                        }
                        testId={`${testIdPrefix}-portion-expected-final-${entry.recipeId}`}
                      />
                      <Fact
                        label="Recorded final weight"
                        value={formatGrams(metrics.recordedFinalWeightGrams)}
                      />
                      <Fact
                        label="Final-weight deviation"
                        value={formatMetricPercent(metrics.finalWeightDeviationPercent)}
                        testId={`${testIdPrefix}-portion-final-deviation-${entry.recipeId}`}
                      />
                    </dl>
                    {metrics.expectedFinalWeightGrams != null ? (
                      <p className="kitchen-day-evidence-note">
                        Difference{' '}
                        {formatFinalWeightDifference(
                          metrics.recordedFinalWeightGrams,
                          metrics.expectedFinalWeightGrams,
                        )}
                      </p>
                    ) : null}
                    {entry.recipeComposition.length > 0 ? (
                      collapsePortionTable ? (
                        <details
                          className="kitchen-day-portion-details"
                          data-testid={`${testIdPrefix}-portion-details-${entry.recipeId}`}
                        >
                          <summary>View recipe details</summary>
                          <PortionCompositionTable
                            entry={entry}
                            recipe={recipe}
                            testIdPrefix={testIdPrefix}
                          />
                        </details>
                      ) : (
                        <PortionCompositionTable
                          entry={entry}
                          recipe={recipe}
                          testIdPrefix={testIdPrefix}
                        />
                      )
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          {reviews.portionPrecision ? (
            <ModuleReviewReadback
              review={reviews.portionPrecision}
              testIdPrefix={testIdPrefix}
              module="portionPrecision"
            />
          ) : null}
        </EvidenceSection>
      ) : null}
    </div>
  );
}
