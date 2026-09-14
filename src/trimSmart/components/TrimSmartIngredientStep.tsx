import type { RefObject } from 'react';
import { formatIngredientCategoryLabel } from '../categoryLabels';
import { TRIM_SMART_INGREDIENT_CATEGORIES } from '../types';

interface TrimSmartIngredientStepProps {
  headingRef: RefObject<HTMLHeadingElement | null>;
  ingredientOrdinal?: number;
  isFollowUpIngredient?: boolean;
  ingredientCategory: string;
  ingredientName: string;
  startingWeightGrams: string;
  ingredientIssues: string[];
  canStartChallenge: boolean;
  onCategoryChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onStart: () => void;
}

function fieldError(issues: string[], key: string): string | null {
  if (!issues.includes(key)) return null;
  if (key === 'ingredientCategory') return 'Choose an ingredient category.';
  if (key === 'ingredientName') return 'Enter the ingredient name.';
  if (key === 'startingWeightGrams') return 'Enter a starting weight greater than zero.';
  return null;
}

export function TrimSmartIngredientStep({
  headingRef,
  ingredientOrdinal,
  isFollowUpIngredient = false,
  ingredientCategory,
  ingredientName,
  startingWeightGrams,
  ingredientIssues,
  canStartChallenge,
  onCategoryChange,
  onNameChange,
  onWeightChange,
  onStart,
}: TrimSmartIngredientStepProps) {
  const showErrors = ingredientIssues.length > 0;
  const categoryError = showErrors ? fieldError(ingredientIssues, 'ingredientCategory') : null;
  const nameError = showErrors ? fieldError(ingredientIssues, 'ingredientName') : null;
  const weightError = showErrors ? fieldError(ingredientIssues, 'startingWeightGrams') : null;
  const touchedCategory = ingredientCategory !== '';
  const touchedName = ingredientName.trim() !== '';
  const touchedWeight = startingWeightGrams.trim() !== '';

  return (
    <section className="trim-smart-card" data-testid="trim-smart-step-ingredient">
      <h2 className="trim-smart-card__title" tabIndex={-1} ref={headingRef}>
        {isFollowUpIngredient ? 'Add another ingredient' : 'Set up your ingredient'}
      </h2>
      {ingredientOrdinal && ingredientOrdinal > 1 ? (
        <p className="trim-smart-card__eyebrow" data-testid="trim-smart-ingredient-ordinal">
          Ingredient {ingredientOrdinal}
        </p>
      ) : null}
      <p className="trim-smart-card__copy">
        Choose the ingredient you are preparing and weigh it before you start.
      </p>

      <div className="trim-smart-ingredient-form">
        <label className="trim-smart-field" htmlFor="trim-smart-category">
          Ingredient category
          <select
            id="trim-smart-category"
            className="trim-smart-field__control"
            value={ingredientCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
            aria-invalid={touchedCategory && categoryError ? true : undefined}
            data-testid="trim-smart-category-select"
          >
            <option value="" disabled>
              Select category
            </option>
            {TRIM_SMART_INGREDIENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {formatIngredientCategoryLabel(category)}
              </option>
            ))}
          </select>
          {touchedCategory && categoryError ? (
            <span className="trim-smart-error" role="alert">{categoryError}</span>
          ) : null}
        </label>

        <label className="trim-smart-field" htmlFor="trim-smart-ingredient-name">
          Ingredient name
          <input
            id="trim-smart-ingredient-name"
            className="trim-smart-field__control"
            type="text"
            autoComplete="off"
            placeholder="Carrot"
            value={ingredientName}
            onChange={(event) => onNameChange(event.target.value)}
            aria-invalid={touchedName && nameError ? true : undefined}
            data-testid="trim-smart-ingredient-name"
          />
          {touchedName && nameError ? (
            <span className="trim-smart-error" role="alert">{nameError}</span>
          ) : null}
        </label>

        <div className="trim-smart-waste-input-wrap">
          <label className="trim-smart-waste-label" htmlFor="trim-smart-starting-weight">
            Starting weight
          </label>
          <div className="trim-smart-waste-input-row">
            <input
              id="trim-smart-starting-weight"
              className="trim-smart-waste-input"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={startingWeightGrams}
              onChange={(event) => onWeightChange(event.target.value)}
              aria-invalid={touchedWeight && weightError ? true : undefined}
              data-testid="trim-smart-starting-weight"
            />
            <span className="trim-smart-waste-unit" aria-hidden="true">g</span>
          </div>
          <p className="trim-smart-helper">Weigh the ingredient before preparation.</p>
          {touchedWeight && weightError ? (
            <p className="trim-smart-error" role="alert">{weightError}</p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        className="trim-smart-button trim-smart-button--primary"
        disabled={!canStartChallenge}
        onClick={onStart}
        data-testid="trim-smart-start-challenge"
      >
        Start challenge
      </button>
    </section>
  );
}
