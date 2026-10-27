import { useMemo, useState } from 'react';
import { goToKitchenDaySection } from '@/app/routes';
import { useReadyKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { formatMetricPercent, formatPortionDeviation } from '@/products/kitchen-skills-challenge/domain/portion/copy';
import { evaluatePortionLine } from '@/products/kitchen-skills-challenge/domain/portion/deviations';
import { buildPortionRecipeMetrics } from '@/products/kitchen-skills-challenge/domain/portion/metrics';
import { getRecipeReference, listRecipeReferences } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import { eligibleRecipeIngredientsForTrim } from '@/products/kitchen-skills-challenge/domain/session/sessionRecipe';
import { KitchenSkillsRecipeCombobox } from '@/products/kitchen-skills-challenge/surfaces/challenge/KitchenSkillsRecipeCombobox';
import { preferredMassInputUnit } from '@/products/kitchen-skills-challenge/domain/mass';
import { KitchenSkillsGramsInput } from '@/products/kitchen-skills-challenge/surfaces/shared/KitchenSkillsGramsInput';
import { KitchenSkillsMassInput } from '@/products/kitchen-skills-challenge/surfaces/shared/KitchenSkillsMassInput';
import { formatGrams, formatRecipeAmount } from '@/products/kitchen-skills-challenge/format';
import {
  buildRecipeComposition,
  canSubmitPortion,
  parseActualAmount,
  parseFinalRecipeWeightGrams,
} from '@/products/kitchen-skills-challenge/domain/portion/validation';
import type { KitchenSkillsPortionEntry } from '@/products/kitchen-skills-challenge/domain/types';

function portionErrorMessage(reason: string): string {
  if (reason === 'portion_already_saved') {
    return 'This challenge already has a recipe. Finish the challenge to start a new one.';
  }
  if (reason === 'attempt_closed') {
    return 'This challenge was finished or restarted in another window.';
  }
  return 'This recipe could not be saved.';
}

function SavedPortion({ entry }: { entry: KitchenSkillsPortionEntry }) {
  const recipe = getRecipeReference(entry.recipeId);
  const metrics = buildPortionRecipeMetrics(entry, recipe);
  const hasTrimIngredients = recipe ? eligibleRecipeIngredientsForTrim(recipe).length > 0 : false;
  return (
    <div className="kitchen-day-portion-saved" data-testid="kitchen-day-portion-saved-card">
      <p className="kitchen-day-success" data-testid="kitchen-day-portion-saved">
        {entry.recipeName} saved.
      </p>
      <dl className="kitchen-day-facts">
        <div className="kitchen-day-fact">
          <dt>Ingredient accuracy</dt>
          <dd data-testid="kitchen-day-portion-saved-accuracy">
            {formatMetricPercent(metrics.recipeIngredientAccuracyPercent)}
          </dd>
        </div>
        <div className="kitchen-day-fact">
          <dt>Final weight</dt>
          <dd data-testid="kitchen-day-portion-saved-final-weight">
            {formatGrams(metrics.recordedFinalWeightGrams)}
          </dd>
        </div>
      </dl>
      <p className="kitchen-day-card__copy">
        {hasTrimIngredients
          ? 'Trim Smart and Rescue & Reuse are optional. You can finish the challenge now.'
          : 'This recipe has no Trim Smart ingredients. You can finish the challenge now.'}
      </p>
      {hasTrimIngredients ? (
        <div className="kitchen-day-form-actions">
          <button
            type="button"
            className="kitchen-day-button kitchen-day-button--secondary"
            data-testid="kitchen-day-continue-trim"
            onClick={() => goToKitchenDaySection('trim')}
          >
            Continue to Trim Smart
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function KitchenSkillsPortionView() {
  const { session, activePortionEntry, commitPortionEntry, closedElsewhere } =
    useReadyKitchenSkillsSession();
  const recipes = listRecipeReferences();
  const [recipeId, setRecipeId] = useState('');
  const [actuals, setActuals] = useState<Record<string, string>>({});
  const [finalWeightRaw, setFinalWeightRaw] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const recipeOptions = useMemo(
    () => recipes.map((item) => ({ id: item.recipeId, label: item.recipeName })),
    [recipes],
  );

  const recipe = useMemo(() => (recipeId ? getRecipeReference(recipeId) : null), [recipeId]);
  const composition = recipe ? buildRecipeComposition(recipe, actuals) : null;
  const finalWeight = parseFinalRecipeWeightGrams(finalWeightRaw);

  if (activePortionEntry) {
    return (
      <section className="kitchen-day-card" data-testid="kitchen-day-portion">
        <h2 className="kitchen-day-card__title">Portion Precision</h2>
        <SavedPortion entry={activePortionEntry} />
      </section>
    );
  }

  function submit() {
    if (!recipe || !composition || !finalWeight.ok) return;
    const result = commitPortionEntry({
      sessionId: session.sessionId,
      sessionDate: session.sessionDate,
      submittedAt: new Date().toISOString(),
      recipeId: recipe.recipeId,
      recipeName: recipe.recipeName,
      recipeComposition: composition,
      finalRecipeWeightGrams: finalWeight.value,
      source: 'local',
    });
    if (!result.ok) {
      setSubmitError(portionErrorMessage(result.reason));
      return;
    }
    setSubmitError(null);
    if (eligibleRecipeIngredientsForTrim(recipe).length > 0) {
      goToKitchenDaySection('trim');
    }
  }

  function handleRecipeChange(nextRecipeId: string) {
    setRecipeId(nextRecipeId);
    setActuals({});
    setFinalWeightRaw('');
    setSubmitError(null);
  }

  return (
    <section className="kitchen-day-card" data-testid="kitchen-day-portion">
      <h2 className="kitchen-day-card__title">Portion Precision</h2>
      <label className="kitchen-day-field">
        <span>Recipe</span>
        <KitchenSkillsRecipeCombobox options={recipeOptions} value={recipeId} onChange={handleRecipeChange} />
      </label>

      {recipe ? (
        <div data-testid={`kitchen-day-recipe-${recipe.recipeId}`}>
          <div className="kitchen-day-portion-entry-wrap">
            <table className="kitchen-day-portion-entry" aria-label="Recipe ingredients">
              <thead>
                <tr>
                  <th scope="col">Ingredient</th>
                  <th scope="col">Target</th>
                  <th scope="col">Actual</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                {recipe.lines.map((line) => {
                  const actual = parseActualAmount(actuals[line.ingredientId] ?? '');
                  const actualLine = actual.ok
                    ? {
                        ingredientId: line.ingredientId,
                        ingredientName: line.ingredientName,
                        actualAmount: actual.value,
                        unit: line.unit,
                      }
                    : null;
                  const outcome = actualLine ? evaluatePortionLine(line, actualLine) : null;
                  const copy = actualLine ? formatPortionDeviation(line, actualLine) : null;
                  const inputId = `kitchen-day-actual-input-${line.ingredientId}`;
                  const setActual = (next: string) =>
                    setActuals((current) => ({ ...current, [line.ingredientId]: next }));
                  return (
                    <tr
                      key={line.ingredientId}
                      className="kitchen-day-recipe-line"
                      data-testid={`kitchen-day-recipe-line-${line.ingredientId}`}
                    >
                      <th scope="row" className="kitchen-day-recipe-line__name">
                        {line.ingredientName}
                      </th>
                      <td
                        className="kitchen-day-portion-entry__target"
                        data-testid={`kitchen-day-required-${line.ingredientId}`}
                      >
                        {formatRecipeAmount(line.requiredAmount, line.unit)}
                      </td>
                      <td className="kitchen-day-portion-entry__actual">
                        <label className="kitchen-day-sr-only" htmlFor={inputId}>
                          Actual {line.ingredientName}
                        </label>
                        {line.unit === 'g' ? (
                          <KitchenSkillsMassInput
                            id={inputId}
                            testId={`kitchen-day-actual-${line.ingredientId}`}
                            unitGroupLabel={`Unit for ${line.ingredientName}`}
                            defaultUnit={preferredMassInputUnit(line.requiredAmount)}
                            value={actuals[line.ingredientId] ?? ''}
                            onChange={setActual}
                          />
                        ) : (
                          <div className="kitchen-day-input-row kitchen-day-input-row--grams">
                            <KitchenSkillsGramsInput
                              id={inputId}
                              testId={`kitchen-day-actual-${line.ingredientId}`}
                              value={actuals[line.ingredientId] ?? ''}
                              onChange={setActual}
                            />
                            <span className="kitchen-day-unit">{line.unit}</span>
                          </div>
                        )}
                      </td>
                      <td
                        className="kitchen-day-portion-entry__result"
                        data-testid={`kitchen-day-deviation-${line.ingredientId}`}
                        data-outcome={outcome ?? ''}
                      >
                        {copy ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="kitchen-day-portion-footer">
            <p className="kitchen-day-portion-footer__expected" data-testid="kitchen-day-expected-final-weight">
              Expected final weight: {formatGrams(recipe.expectedFinalWeightGrams)}
            </p>

            <label className="kitchen-day-field kitchen-day-field--compact">
              <span>Final recipe weight</span>
              <KitchenSkillsMassInput
                testId="kitchen-day-final-recipe-weight"
                ariaLabel="Final recipe weight"
                defaultUnit={preferredMassInputUnit(recipe.expectedFinalWeightGrams)}
                value={finalWeightRaw}
                onChange={setFinalWeightRaw}
              />
            </label>

            <div className="kitchen-day-form-actions kitchen-day-form-actions--sticky">
              <button
                type="button"
                className="kitchen-day-button kitchen-day-button--primary"
                data-testid="kitchen-day-submit-portion"
                disabled={
                  closedElsewhere ||
                  !canSubmitPortion({
                    recipe,
                    actualsByIngredientId: actuals,
                    finalWeightRaw,
                  })
                }
                onClick={submit}
              >
                Save recipe
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {submitError ? (
        <p className="kitchen-day-error" data-testid="kitchen-day-portion-error">
          {submitError}
        </p>
      ) : null}
    </section>
  );
}
