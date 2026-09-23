import { useMemo, useState } from 'react';
import { useReadyKitchenDaySession } from '../KitchenDaySessionContext';
import { formatPortionDeviation } from './copy';
import { evaluatePortionLine } from './deviations';
import { getRecipeReference, listRecipeReferences } from './recipes';
import {
  buildRecipeComposition,
  canSubmitPortion,
  parseActualAmount,
  parseFinalRecipeWeightGrams,
} from './validation';

export function KitchenDayPortionView() {
  const { session, commitPortionEntry } = useReadyKitchenDaySession();
  const recipes = listRecipeReferences();
  const [recipeId, setRecipeId] = useState('');
  const [actuals, setActuals] = useState<Record<string, string>>({});
  const [finalWeightRaw, setFinalWeightRaw] = useState('');
  const [savedName, setSavedName] = useState<string | null>(null);

  const recipe = useMemo(() => (recipeId ? getRecipeReference(recipeId) : null), [recipeId]);
  const composition = recipe ? buildRecipeComposition(recipe, actuals) : null;
  const finalWeight = parseFinalRecipeWeightGrams(finalWeightRaw);

  function submit() {
    if (!recipe || !composition || !finalWeight.ok) return;
    const entry = {
      sessionId: session.sessionId,
      sessionDate: session.sessionDate,
      submittedAt: new Date().toISOString(),
      recipeId: recipe.recipeId,
      recipeName: recipe.recipeName,
      recipeComposition: composition,
      finalRecipeWeightGrams: finalWeight.value,
    };
    const result = commitPortionEntry({ ...entry, source: 'local' });
    if (!result.ok) return;
    if (result.mode !== 'local') return;
    setSavedName(recipe.recipeName);
    setRecipeId('');
    setActuals({});
    setFinalWeightRaw('');
  }

  return (
    <section className="kitchen-day-card" data-testid="kitchen-day-portion">
      <h2 className="kitchen-day-card__title">Portion Precision</h2>
      <label className="kitchen-day-field">
        <span>Recipe</span>
        <select
          className="kitchen-day-input"
          data-testid="kitchen-day-recipe-select"
          value={recipeId}
          onChange={(event) => {
            setRecipeId(event.target.value);
            setActuals({});
            setFinalWeightRaw('');
            setSavedName(null);
          }}
        >
          <option value="">Select a recipe</option>
          {recipes.map((item) => (
            <option key={item.recipeId} value={item.recipeId}>
              {item.recipeName}
            </option>
          ))}
        </select>
      </label>

      {recipe ? (
        <div data-testid={`kitchen-day-recipe-${recipe.recipeId}`}>
          <ul className="kitchen-day-session-list">
            {recipe.lines.map((line) => {
              const actual = parseActualAmount(actuals[line.ingredientId] ?? '');
              const outcome =
                actual.ok
                  ? evaluatePortionLine(line, {
                      ingredientId: line.ingredientId,
                      ingredientName: line.ingredientName,
                      actualAmount: actual.value,
                      unit: line.unit,
                    })
                  : null;
              const copy =
                actual.ok
                  ? formatPortionDeviation(line, {
                      ingredientId: line.ingredientId,
                      ingredientName: line.ingredientName,
                      actualAmount: actual.value,
                      unit: line.unit,
                    })
                  : null;
              return (
                <li
                  key={line.ingredientId}
                  className="kitchen-day-recipe-line"
                  data-testid={`kitchen-day-recipe-line-${line.ingredientId}`}
                >
                  <div className="kitchen-day-recipe-line__name">{line.ingredientName}</div>
                  <p data-testid={`kitchen-day-required-${line.ingredientId}`}>
                    Target: {line.requiredAmount} {line.unit}
                  </p>
                  <label className="kitchen-day-field">
                    <span>Actual</span>
                    <div className="kitchen-day-input-row">
                      <input
                        className="kitchen-day-input kitchen-day-input--numeric"
                        inputMode="decimal"
                        data-testid={`kitchen-day-actual-${line.ingredientId}`}
                        value={actuals[line.ingredientId] ?? ''}
                        onChange={(event) =>
                          setActuals((current) => ({
                            ...current,
                            [line.ingredientId]: event.target.value,
                          }))
                        }
                      />
                      <span className="kitchen-day-unit">{line.unit}</span>
                    </div>
                  </label>
                  {copy ? (
                    <p data-testid={`kitchen-day-deviation-${line.ingredientId}`} data-outcome={outcome ?? ''}>
                      {copy}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <p data-testid="kitchen-day-expected-final-weight">
            Expected final weight: {recipe.expectedFinalWeightGrams} g
          </p>

          <label className="kitchen-day-field">
            <span>Final recipe weight</span>
            <div className="kitchen-day-input-row">
              <input
                className="kitchen-day-input kitchen-day-input--numeric"
                inputMode="decimal"
                data-testid="kitchen-day-final-recipe-weight"
                value={finalWeightRaw}
                onChange={(event) => setFinalWeightRaw(event.target.value)}
              />
              <span className="kitchen-day-unit">g</span>
            </div>
          </label>

          <button
            type="button"
            className="kitchen-day-button kitchen-day-button--primary"
            data-testid="kitchen-day-submit-portion"
            disabled={
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
      ) : null}

      {savedName ? (
        <p className="kitchen-day-success" data-testid="kitchen-day-portion-saved">
          {savedName} recorded for this kitchen day.
        </p>
      ) : null}
    </section>
  );
}
