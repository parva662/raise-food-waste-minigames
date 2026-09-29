import type { ReactNode } from 'react';
import { extractGroupActivities, getRawKitchenGroupActivitiesInput } from '@/platform/gamebus/groupActivities';
import { getGameBusInputCollections } from '@/platform/gamebus/bridge';
import { discardedWasteGrams, wastePercentage } from '@/products/kitchen-skills-challenge/domain/trim/derived';
import { TRIM_TECHNIQUE_LABELS } from '@/products/kitchen-skills-challenge/domain/trim/techniques';
import { compareToKitchenReference } from '@/products/kitchen-skills-challenge/domain/trim/reference';
import { historicalTrimSamplesFromGroupActivities } from '@/products/kitchen-skills-challenge/read/selectKitchenSkillsActivities';
import {
  formatFinalWeightDifference,
  formatMetricPercent,
  formatPortionDeviation,
  formatPortionDifference,
} from '@/products/kitchen-skills-challenge/domain/portion/copy';
import { buildPortionRecipeMetrics } from '@/products/kitchen-skills-challenge/domain/portion/metrics';
import { getRecipeReference, type RecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import {
  formatDurationFromMinutes,
  formatGrams,
  formatReferenceDelta,
  formatScore,
  formatWastePercent,
} from '@/products/kitchen-skills-challenge/format';
import type {
  KitchenSkillsPortionEntry,
  KitchenSkillsRescueEntry,
  KitchenSkillsReviewEntry,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';

function Fact({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="kitchen-day-fact">
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

export function SessionEvidence({
  trimEntries,
  rescueEntries,
  portionEntries,
  review,
  testIdPrefix = 'kitchen-day',
  collapsible = false,
  collapsePortionTable = false,
}: {
  trimEntries: readonly KitchenSkillsTrimEntry[];
  rescueEntries: readonly KitchenSkillsRescueEntry[];
  portionEntries: readonly KitchenSkillsPortionEntry[];
  review?: KitchenSkillsReviewEntry | null;
  testIdPrefix?: string;
  collapsible?: boolean;
  collapsePortionTable?: boolean;
}) {
  const historicalSamples = historicalTrimSamplesFromGroupActivities(
    extractGroupActivities(getRawKitchenGroupActivitiesInput(getGameBusInputCollections())),
  );

  return (
    <div className="kitchen-day-evidence" data-testid={`${testIdPrefix}-evidence`} data-readonly="true">
      <EvidenceSection collapsible={collapsible} title="Trim Smart" testId={`${testIdPrefix}-trim-section`}>
        {trimEntries.length === 0 ? (
          <p className="chef-results-empty">No completed preparation yet.</p>
        ) : (
          <ul className="kitchen-day-evidence-list" data-testid={`${testIdPrefix}-trim-list`}>
            {trimEntries.map((entry) => {
              const percent = wastePercentage(entry.actualWasteGrams, entry.ingredientWeightGrams);
              const comparison = compareToKitchenReference({
                ingredientId: entry.ingredientId,
                studentWastePercent: percent,
                historicalSamples,
              });
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
                    <Fact label="Actual waste" value={formatGrams(entry.actualWasteGrams)} />
                    <Fact
                      label="Waste rate"
                      value={formatWastePercent(percent)}
                      testId={`${testIdPrefix}-waste-percent-${entry.ingredientId}`}
                    />
                    {comparison ? (
                      <Fact
                        label="Kitchen reference"
                        value={formatWastePercent(comparison.referenceWastePercent)}
                        testId={`${testIdPrefix}-reference-${entry.ingredientId}`}
                      />
                    ) : null}
                    <Fact label="Duration" value={formatDurationFromMinutes(entry.durationMinutes)} />
                  </dl>
                  {comparison ? (
                    <p className="kitchen-day-evidence-note">
                      {formatReferenceDelta(percent, comparison.referenceWastePercent)}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </EvidenceSection>

      <EvidenceSection collapsible={collapsible} title="Rescue & Reuse" testId={`${testIdPrefix}-rescue-section`}>
        {rescueEntries.length === 0 ? (
          <p className="chef-results-empty">No reuse suggestions yet.</p>
        ) : (
          <ul className="kitchen-day-evidence-list" data-testid={`${testIdPrefix}-rescue-list`}>
            {rescueEntries.map((entry) => {
              const trim = trimEntries.find((item) => item.ingredientId === entry.ingredientId);
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
      </EvidenceSection>

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
                      Difference {formatFinalWeightDifference(metrics.recordedFinalWeightGrams, metrics.expectedFinalWeightGrams)}
                    </p>
                  ) : null}
                  {collapsePortionTable ? (
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
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </EvidenceSection>

      {review ? (
        <section
          className="kitchen-day-evidence-section kitchen-day-evidence-section--assessment"
          data-testid={`${testIdPrefix}-tutor-review`}
        >
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
      ) : null}
    </div>
  );
}
