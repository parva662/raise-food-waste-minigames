import { extractGroupActivities, getRawKitchenGroupActivitiesInput } from '../gamebus/groupActivities';
import { getGameBusInputCollections } from '../gamebus/bridge';
import { discardedWasteGrams, wastePercentage } from './trim/derived';
import { INGREDIENT_CATEGORY_LABELS } from './trim/categories';
import { TRIM_TECHNIQUE_LABELS } from './trim/techniques';
import { compareToKitchenReference } from './trim/reference';
import { historicalTrimSamplesFromGroupActivities } from './read/selectKitchenDayActivities';
import { evaluatePortionLine } from './portion/deviations';
import { getRecipeReference } from './portion/recipes';
import type {
  KitchenDayPortionEntry,
  KitchenDayRescueEntry,
  KitchenDayTrimEntry,
} from './types';

export function SessionEvidence({
  trimEntries,
  rescueEntries,
  portionEntries,
  testIdPrefix = 'kitchen-day',
}: {
  trimEntries: readonly KitchenDayTrimEntry[];
  rescueEntries: readonly KitchenDayRescueEntry[];
  portionEntries: readonly KitchenDayPortionEntry[];
  testIdPrefix?: string;
}) {
  const historicalSamples = historicalTrimSamplesFromGroupActivities(
    extractGroupActivities(getRawKitchenGroupActivitiesInput(getGameBusInputCollections())),
  );

  return (
    <div className="kd-evidence" data-testid={`${testIdPrefix}-evidence`} data-readonly="true">
      <h3 className="kd-subtitle">Trim Smart</h3>
      {trimEntries.length === 0 ? (
        <p className="kd-helper">No completed preparation entries.</p>
      ) : (
        <ul className="kd-list" data-testid={`${testIdPrefix}-trim-list`}>
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
                <span>Category {INGREDIENT_CATEGORY_LABELS[entry.ingredientCategory]}</span>
                <span>Starting weight {entry.ingredientWeightGrams} g</span>
                <span>Technique {TRIM_TECHNIQUE_LABELS[entry.trimTechniques]}</span>
                <span>Estimated waste {entry.estimatedWasteGrams} g</span>
                <span>Actual waste {entry.actualWasteGrams} g</span>
                <span data-testid={`${testIdPrefix}-waste-percent-${entry.ingredientId}`}>
                  Waste {percent}%
                </span>
                <span>Duration {entry.durationMinutes} minutes</span>
                {comparison ? (
                  <span data-testid={`${testIdPrefix}-reference-${entry.ingredientId}`}>
                    {comparison.performedBetterThanReference
                      ? 'Better than the kitchen reference'
                      : 'Higher than the kitchen reference'}{' '}
                    ({comparison.source === 'historical' ? 'historical average' : 'chef-seeded reference'}{' '}
                    {comparison.referenceWastePercent}%)
                  </span>
                ) : (
                  <span>No kitchen reference for this ingredient yet.</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <h3 className="kd-subtitle">Rescue &amp; Reuse</h3>
      {rescueEntries.length === 0 ? (
        <p className="kd-helper">No reuse suggestions recorded.</p>
      ) : (
        <ul className="kd-list" data-testid={`${testIdPrefix}-rescue-list`}>
          {rescueEntries.map((entry) => {
            const trim = trimEntries.find((item) => item.ingredientId === entry.ingredientId);
            const discarded = trim
              ? discardedWasteGrams(trim.actualWasteGrams, entry.reusableWasteGrams)
              : null;
            return (
              <li key={entry.ingredientId} data-testid={`${testIdPrefix}-rescue-${entry.ingredientId}`}>
                <strong>{entry.ingredientId}</strong>
                <span>Reusable waste {entry.reusableWasteGrams} g</span>
                <span>Reuse destination {entry.reuseDestination}</span>
                {discarded != null ? <span>Discarded {discarded} g</span> : null}
              </li>
            );
          })}
        </ul>
      )}

      <h3 className="kd-subtitle">Portion Precision</h3>
      {portionEntries.length === 0 ? (
        <p className="kd-helper">No recipes recorded yet.</p>
      ) : (
        <ul className="kd-list" data-testid={`${testIdPrefix}-portion-list`}>
          {portionEntries.map((entry) => {
            const recipe = getRecipeReference(entry.recipeId);
            return (
              <li
                key={`${entry.recipeId}-${entry.submittedAt}`}
                data-testid={`${testIdPrefix}-portion-${entry.recipeId}`}
              >
                <strong>{entry.recipeName}</strong>
                <ul className="kd-recipe-lines">
                  {entry.recipeComposition.map((line) => {
                    const required = recipe?.lines.find((item) => item.ingredientId === line.ingredientId);
                    const outcome = required ? evaluatePortionLine(required, line) : null;
                    return (
                      <li key={line.ingredientId}>
                        {line.ingredientName}: target {required ? `${required.requiredAmount} ${required.unit}` : '—'}{' '}
                        vs actual {line.actualAmount} {line.unit}
                        {outcome ? (
                          <span data-testid={`${testIdPrefix}-deviation-${entry.recipeId}-${line.ingredientId}`}>
                            {' '}
                            {outcome}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                <span>Final recipe weight {entry.finalRecipeWeightGrams} g</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
