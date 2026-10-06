import { useMemo, useState } from 'react';
import { goToKitchenDaySection } from '@/app/routes';
import { useReadyKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { formatPortionDeviation } from '@/products/kitchen-skills-challenge/domain/portion/copy';
import { evaluatePortionLine } from '@/products/kitchen-skills-challenge/domain/portion/deviations';
import { getRecipeReference, listRecipeReferences } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import { KitchenSkillsRecipeCombobox } from '@/products/kitchen-skills-challenge/surfaces/challenge/KitchenSkillsRecipeCombobox';
import { KitchenSkillsGramsInput } from '@/products/kitchen-skills-challenge/surfaces/shared/KitchenSkillsGramsInput';
import {
  buildRecipeComposition,
  canSubmitPortion,
  parseActualAmount,
  parseFinalRecipeWeightGrams,
} from '@/products/kitchen-skills-challenge/domain/portion/validation';

export function KitchenSkillsPortionView() {
  const { session, portionEntries, commitPortionEntry } = useReadyKitchenSkillsSession();
  const recipes = listRecipeReferences();
  const recorded = portionEntries[0] ?? null;
  const [recipeId, setRecipeId] = useState('');
  const [actuals, setActuals] = useState<Record<string, string>>({});
  const [finalWeightRaw, setFinalWeightRaw] = useState('');
  const [saving, setSaving] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);
  const recipeOptions = useMemo(
    () => recipes.map((item) => ({ id: item.recipeId, label: item.recipeName })),
    [recipes],
  );

  const recipe = useMemo(() => (recipeId ? getRecipeReference(recipeId) : null), [recipeId]);
  const composition = recipe ? buildRecipeComposition(recipe, actuals) : null;
  const finalWeight = parseFinalRecipeWeightGrams(finalWeightRaw);

  function submit() {
    if (!recipe || !composition || !finalWeight.ok || saving || recorded) return;
    setSaving(true);
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
    if (!result.ok) {
      setSaving(false);
      return;
    }
    setPickerKey((current) => current + 1);
    goToKitchenDaySection('trim');
  }

  function handleRecipeChange(nextRecipeId: string) {
    setRecipeId(nextRecipeId);
    setActuals({});
    setFinalWeightRaw('');
  }

  if (recorded) {
    return (
      <section className="kitchen-day-card" data-testid="kitchen-day-portion">
        <h2 className="kitchen-day-card__title">Portion Precision</h2>
        <p className="kitchen-day-success" data-testid="kitchen-day-portion-saved">
          {recorded.recipeName} recorded for this kitchen day.
        </p>
        <a className="kitchen-day-button kitchen-day-button--primary" href="#/kitchen-day/trim">
          Continue to Trim Smart
        </a>
      </section>
    );
  }

  return (
    <section className="kitchen-day-card" data-testid="kitchen-day-portion">
      <h2 className="kitchen-day-card__title">Portion Precision</h2>
      <label className="kitchen-day-field">
        <span>Recipe</span>
        <KitchenSkillsRecipeCombobox
          key={pickerKey}
          options={recipeOptions}
          value={recipeId}
          onChange={handleRecipeChange}
        />
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
                  const inputId = `kitchen-day-actual-input-${line.ingredientId}`;
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
                        {line.requiredAmount} {line.unit}
                      </td>
                      <td className="kitchen-day-portion-entry__actual">
                        <label className="kitchen-day-sr-only" htmlFor={inputId}>
                          Actual {line.ingredientName}
                        </label>
                        <div className="kitchen-day-input-row kitchen-day-input-row--grams">
                          <KitchenSkillsGramsInput
                            id={inputId}
                            testId={`kitchen-day-actual-${line.ingredientId}`}
                            value={actuals[line.ingredientId] ?? ''}
                            onChange={(next) =>
                              setActuals((current) => ({
                                ...current,
                                [line.ingredientId]: next,
                              }))
                            }
                          />
                          <span className="kitchen-day-unit">{line.unit}</span>
                        </div>
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
              Expected final weight: {recipe.expectedFinalWeightGrams} g
            </p>

            <label className="kitchen-day-field kitchen-day-field--compact">
              <span>Final recipe weight</span>
              <div className="kitchen-day-input-row kitchen-day-input-row--grams">
                <KitchenSkillsGramsInput
                  testId="kitchen-day-final-recipe-weight"
                  ariaLabel="Final recipe weight"
                  value={finalWeightRaw}
                  onChange={setFinalWeightRaw}
                />
                <span className="kitchen-day-unit">g</span>
              </div>
            </label>

            <div className="kitchen-day-form-actions kitchen-day-form-actions--sticky">
              <button
                type="button"
                className="kitchen-day-button kitchen-day-button--primary"
                data-testid="kitchen-day-submit-portion"
                disabled={
                  saving ||
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
    </section>
  );
}
