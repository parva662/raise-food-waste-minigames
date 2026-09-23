import { useMemo, useState } from 'react';
import { useKitchenDaySession } from '../KitchenDaySessionContext';
import { tryPostKitchenDayPortion } from '../postKitchenDayActivity';
import { evaluatePortionLine } from './deviations';
import { getRecipeReference, listRecipeReferences } from './recipes';
import {
  buildRecipeComposition,
  canSubmitPortion,
  parseActualAmount,
  parseFinalRecipeWeightGrams,
} from './validation';

export function KitchenDayPortionView() {
  const { session, addPortionEntry } = useKitchenDaySession();
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
    addPortionEntry(entry);
    tryPostKitchenDayPortion(entry);
    setSavedName(recipe.recipeName);
    setRecipeId('');
    setActuals({});
    setFinalWeightRaw('');
  }

  return (
    <section className="kd-card kd-card--portion" data-testid="kitchen-day-portion">
      <h2 className="kd-card__title">Portion Precision</h2>
      <label className="kd-field">
        <span>Recipe</span>
        <select
          className="kd-input"
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
          <ul className="kd-recipe-lines">
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
              return (
                <li key={line.ingredientId} data-testid={`kitchen-day-recipe-line-${line.ingredientId}`}>
                  <div className="kd-recipe-line__required">
                    <strong>{line.ingredientName}</strong>
                    <span data-testid={`kitchen-day-required-${line.ingredientId}`}>
                      Required {line.requiredAmount} {line.unit}
                    </span>
                  </div>
                  <label className="kd-field">
                    <span>Actual amount</span>
                    <div className="kd-input-row">
                      <input
                        className="kd-input kd-input--numeric"
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
                      <span className="kd-unit">{line.unit}</span>
                    </div>
                  </label>
                  {outcome ? (
                    <p data-testid={`kitchen-day-deviation-${line.ingredientId}`}>{outcome}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <label className="kd-field">
            <span>Final recipe weight</span>
            <div className="kd-input-row">
              <input
                className="kd-input kd-input--numeric"
                inputMode="decimal"
                data-testid="kitchen-day-final-recipe-weight"
                value={finalWeightRaw}
                onChange={(event) => setFinalWeightRaw(event.target.value)}
              />
              <span className="kd-unit">g</span>
            </div>
          </label>

          <button
            type="button"
            className="kd-button kd-button--primary"
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
        <p data-testid="kitchen-day-portion-saved">{savedName} recorded for this kitchen day.</p>
      ) : null}
    </section>
  );
}
