import { extractGroupActivities, getRawKitchenGroupActivitiesInput } from '../gamebus/groupActivities';
import { getGameBusInputCollections } from '../gamebus/bridge';
import { discardedWasteGrams, wastePercentage } from './trim/derived';
import { INGREDIENT_CATEGORY_LABELS } from './trim/categories';
import { TRIM_TECHNIQUE_LABELS } from './trim/techniques';
import { compareToKitchenReference } from './trim/reference';
import { historicalTrimSamplesFromGroupActivities } from './read/selectKitchenDayActivities';
import { formatPortionDeviation } from './portion/copy';
import { getRecipeReference } from './portion/recipes';
import { formatDurationFromMinutes, formatGrams, formatWastePercent } from './format';
import type {
  KitchenDayPortionEntry,
  KitchenDayRescueEntry,
  KitchenDayReviewEntry,
  KitchenDayTrimEntry,
} from './types';

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
    <div className="chef-results-metrics" data-testid={`${testIdPrefix}-evidence`} data-readonly="true">
      <section className="chef-results-panel">
        <h3 className="chef-results-panel__title">Trim Smart</h3>
        {trimEntries.length === 0 ? (
          <p className="chef-results-empty">No completed preparation yet.</p>
        ) : (
          <ul className="kitchen-day-session-list" data-testid={`${testIdPrefix}-trim-list`}>
            {trimEntries.map((entry) => {
              const percent = wastePercentage(entry.actualWasteGrams, entry.ingredientWeightGrams);
              const comparison = compareToKitchenReference({
                ingredientId: entry.ingredientId,
                studentWastePercent: percent,
                historicalSamples,
              });
              return (
                <li key={entry.ingredientId} data-testid={`${testIdPrefix}-trim-${entry.ingredientId}`}>
                  <strong>{entry.ingredientName}</strong>
                  <span>{INGREDIENT_CATEGORY_LABELS[entry.ingredientCategory]}</span>
                  <span>Starting {formatGrams(entry.ingredientWeightGrams)}</span>
                  <span>{TRIM_TECHNIQUE_LABELS[entry.trimTechniques]}</span>
                  <span>Estimated {formatGrams(entry.estimatedWasteGrams)}</span>
                  <span>Actual {formatGrams(entry.actualWasteGrams)}</span>
                  <span data-testid={`${testIdPrefix}-waste-percent-${entry.ingredientId}`}>
                    {formatWastePercent(percent)}
                  </span>
                  <span>{formatDurationFromMinutes(entry.durationMinutes)}</span>
                  {comparison ? (
                    <span data-testid={`${testIdPrefix}-reference-${entry.ingredientId}`}>
                      Reference {formatWastePercent(comparison.referenceWastePercent)}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="chef-results-panel">
        <h3 className="chef-results-panel__title">Rescue &amp; Reuse</h3>
        {rescueEntries.length === 0 ? (
          <p className="chef-results-empty">No reuse suggestions yet.</p>
        ) : (
          <ul className="kitchen-day-session-list" data-testid={`${testIdPrefix}-rescue-list`}>
            {rescueEntries.map((entry) => {
              const trim = trimEntries.find((item) => item.ingredientId === entry.ingredientId);
              const discarded = trim
                ? discardedWasteGrams(trim.actualWasteGrams, entry.reusableWasteGrams)
                : null;
              return (
                <li key={entry.ingredientId} data-testid={`${testIdPrefix}-rescue-${entry.ingredientId}`}>
                  <strong>{trim?.ingredientName ?? entry.ingredientId}</strong>
                  <span>Reusable {formatGrams(entry.reusableWasteGrams)}</span>
                  <span>{entry.reuseDestination}</span>
                  {discarded != null ? <span>Discarded {formatGrams(discarded)}</span> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="chef-results-panel">
        <h3 className="chef-results-panel__title">Portion Precision</h3>
        {portionEntries.length === 0 ? (
          <p className="chef-results-empty">No recipes recorded yet.</p>
        ) : (
          <ul className="kitchen-day-session-list" data-testid={`${testIdPrefix}-portion-list`}>
            {portionEntries.map((entry) => {
              const recipe = getRecipeReference(entry.recipeId);
              return (
                <li
                  key={`${entry.recipeId}-${entry.submittedAt}`}
                  data-testid={`${testIdPrefix}-portion-${entry.recipeId}`}
                >
                  <strong>{entry.recipeName}</strong>
                  {entry.recipeComposition.map((line) => {
                    const required = recipe?.lines.find((item) => item.ingredientId === line.ingredientId);
                    const copy = required ? formatPortionDeviation(required, line) : null;
                    return (
                      <p key={line.ingredientId}>
                        {line.ingredientName}: target {required ? `${required.requiredAmount} ${required.unit}` : '—'} vs
                        actual {line.actualAmount} {line.unit}
                        {copy ? (
                          <span data-testid={`${testIdPrefix}-deviation-${entry.recipeId}-${line.ingredientId}`}>
                            {' '}
                            {copy}
                          </span>
                        ) : null}
                      </p>
                    );
                  })}
                  <span>Final {formatGrams(entry.finalRecipeWeightGrams)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {review ? (
        <section className="chef-results-panel" data-testid={`${testIdPrefix}-tutor-review`}>
          <h3 className="chef-results-panel__title">Tutor assessment</h3>
          <dl className="chef-results-metrics chef-results-metrics--compact">
            <div>
              <dt>Time efficiency</dt>
              <dd>{review.timeEfficiencyScore}</dd>
            </div>
            <div>
              <dt>Preparation quality</dt>
              <dd>{review.preparationQualityScore}</dd>
            </div>
          </dl>
          {review.chefFeedback ? <p>{review.chefFeedback}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
