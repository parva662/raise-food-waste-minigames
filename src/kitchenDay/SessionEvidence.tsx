import { extractGroupActivities, getRawKitchenGroupActivitiesInput } from '../gamebus/groupActivities';
import { getGameBusInputCollections } from '../gamebus/bridge';
import { discardedWasteGrams, wastePercentage } from './trim/derived';
import { TRIM_TECHNIQUE_LABELS } from './trim/techniques';
import { compareToKitchenReference } from './trim/reference';
import { historicalTrimSamplesFromGroupActivities } from './read/selectKitchenDayActivities';
import { formatPortionDeviation } from './portion/copy';
import { getRecipeReference } from './portion/recipes';
import {
  formatDurationFromMinutes,
  formatGrams,
  formatReferenceDelta,
  formatScore,
  formatWastePercent,
} from './format';
import type {
  KitchenDayPortionEntry,
  KitchenDayRescueEntry,
  KitchenDayReviewEntry,
  KitchenDayTrimEntry,
} from './types';

function Fact({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="kitchen-day-fact">
      <dt>{label}</dt>
      <dd data-testid={testId}>{value}</dd>
    </div>
  );
}

export function SessionEvidence({
  trimEntries,
  rescueEntries,
  portionEntries,
  review,
  testIdPrefix = 'kitchen-day',
}: {
  trimEntries: readonly KitchenDayTrimEntry[];
  rescueEntries: readonly KitchenDayRescueEntry[];
  portionEntries: readonly KitchenDayPortionEntry[];
  review?: KitchenDayReviewEntry | null;
  testIdPrefix?: string;
}) {
  const historicalSamples = historicalTrimSamplesFromGroupActivities(
    extractGroupActivities(getRawKitchenGroupActivitiesInput(getGameBusInputCollections())),
  );

  return (
    <div className="kitchen-day-evidence" data-testid={`${testIdPrefix}-evidence`} data-readonly="true">
      <section className="kitchen-day-evidence-section" data-testid={`${testIdPrefix}-trim-section`}>
        <h3 className="kitchen-day-evidence-section__title">Trim Smart</h3>
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
      </section>

      <section className="kitchen-day-evidence-section" data-testid={`${testIdPrefix}-rescue-section`}>
        <h3 className="kitchen-day-evidence-section__title">Rescue &amp; Reuse</h3>
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
      </section>

      <section className="kitchen-day-evidence-section" data-testid={`${testIdPrefix}-portion-section`}>
        <h3 className="kitchen-day-evidence-section__title">Portion Precision</h3>
        {portionEntries.length === 0 ? (
          <p className="chef-results-empty">No recipes recorded yet.</p>
        ) : (
          <ul className="kitchen-day-evidence-list" data-testid={`${testIdPrefix}-portion-list`}>
            {portionEntries.map((entry) => {
              const recipe = getRecipeReference(entry.recipeId);
              return (
                <li
                  key={`${entry.recipeId}-${entry.submittedAt}`}
                  className="kitchen-day-evidence-card"
                  data-testid={`${testIdPrefix}-portion-${entry.recipeId}`}
                >
                  <h4 className="kitchen-day-evidence-card__title">{entry.recipeName}</h4>
                  <div className="kitchen-day-portion-table-wrap">
                    <table className="kitchen-day-portion-table">
                      <thead>
                        <tr>
                          <th scope="col">Ingredient</th>
                          <th scope="col">Target</th>
                          <th scope="col">Actual</th>
                          <th scope="col">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.recipeComposition.map((line) => {
                          const required = recipe?.lines.find(
                            (item) => item.ingredientId === line.ingredientId,
                          );
                          const copy = required ? formatPortionDeviation(required, line) : '—';
                          return (
                            <tr key={line.ingredientId}>
                              <th scope="row">{line.ingredientName}</th>
                              <td data-testid={`${testIdPrefix}-portion-target-${entry.recipeId}-${line.ingredientId}`}>
                                {required ? `${required.requiredAmount} ${required.unit}` : '—'}
                              </td>
                              <td data-testid={`${testIdPrefix}-portion-actual-${entry.recipeId}-${line.ingredientId}`}>
                                {line.actualAmount} {line.unit}
                              </td>
                              <td data-testid={`${testIdPrefix}-deviation-${entry.recipeId}-${line.ingredientId}`}>
                                {copy}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="kitchen-day-evidence-note">
                    Final recipe weight: {formatGrams(entry.finalRecipeWeightGrams)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

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
