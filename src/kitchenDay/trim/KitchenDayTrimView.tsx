import { useMemo, useState } from 'react';
import { getGameBusInputCollections } from '../../gamebus/bridge';
import { extractGroupActivities, getRawKitchenGroupActivitiesInput } from '../../gamebus/groupActivities';
import { normalizeIngredientId } from '../../trimSmart/ingredientId';
import { kitchenDayIngredientIdFromName, useReadyKitchenDaySession } from '../KitchenDaySessionContext';
import { isIngredientAlreadyRecorded } from '../session/ingredientUniqueness';
import { historicalTrimSamplesFromGroupActivities } from '../read/selectKitchenDayActivities';
import { TRIM_TECHNIQUES, type KitchenDayIngredientCategory, type TrimTechnique } from '../types';
import { ingredientCategoryOptions } from './categories';
import { wastePercentage } from './derived';
import { compareToKitchenReference } from './reference';
import { TRIM_TECHNIQUE_LABELS } from './techniques';
import {
  createIdleTimer,
  finishPreparationTimer,
  startPreparationTimer,
  type PreparationTimerState,
} from './timer';
import {
  canContinueToEstimate,
  parseActualWasteGrams,
  parseEstimatedWasteGrams,
  parseStartingWeightGrams,
  validateIngredientSetup,
} from './validation';

type TrimStep =
  | 'category'
  | 'ingredient'
  | 'weight'
  | 'technique'
  | 'estimate'
  | 'timer'
  | 'actual'
  | 'result';

const STEP_ORDER: TrimStep[] = [
  'category',
  'ingredient',
  'weight',
  'technique',
  'estimate',
  'timer',
  'actual',
  'result',
];

function stepLabel(step: TrimStep): string {
  const labels: Record<TrimStep, string> = {
    category: 'Category',
    ingredient: 'Ingredient',
    weight: 'Starting weight',
    technique: 'Technique',
    estimate: 'Estimate',
    timer: 'Prepare',
    actual: 'Actual waste',
    result: 'Result',
  };
  return labels[step];
}

export function KitchenDayTrimView() {
  const { session, recordedIngredientIds, commitTrimEntry } = useReadyKitchenDaySession();
  const [step, setStep] = useState<TrimStep>('category');
  const [category, setCategory] = useState<KitchenDayIngredientCategory | ''>('');
  const [ingredientName, setIngredientName] = useState('');
  const [weightRaw, setWeightRaw] = useState('');
  const [technique, setTechnique] = useState<TrimTechnique | null>(null);
  const [estimateRaw, setEstimateRaw] = useState('');
  const [actualRaw, setActualRaw] = useState('');
  const [timer, setTimer] = useState<PreparationTimerState>(createIdleTimer());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ingredientId = kitchenDayIngredientIdFromName(ingredientName);
  const weight = parseStartingWeightGrams(weightRaw);
  const estimate = weight.ok ? parseEstimatedWasteGrams(estimateRaw, weight.value) : { ok: false as const, issue: 'invalid' as const };
  const actual = weight.ok ? parseActualWasteGrams(actualRaw, weight.value) : { ok: false as const, issue: 'invalid' as const };
  const setupIssues = validateIngredientSetup({
    ingredientCategory: category,
    ingredientName,
    startingWeightGrams: weightRaw,
  });
  const duplicate =
    ingredientId !== null && isIngredientAlreadyRecorded(recordedIngredientIds, ingredientId);

  const historicalSamples = useMemo(() => {
    const raw = getRawKitchenGroupActivitiesInput(getGameBusInputCollections());
    return historicalTrimSamplesFromGroupActivities(extractGroupActivities(raw));
  }, []);

  function goNext() {
    const index = STEP_ORDER.indexOf(step);
    setStep(STEP_ORDER[index + 1] ?? step);
  }

  function resetForAnother() {
    setStep('category');
    setCategory('');
    setIngredientName('');
    setWeightRaw('');
    setTechnique(null);
    setEstimateRaw('');
    setActualRaw('');
    setTimer(createIdleTimer());
    setSubmitError(null);
  }

  function submitEntry() {
    if (!category || !ingredientId || !weight.ok || !technique || !estimate.ok || !actual.ok) return;
    if (timer.status !== 'finished' || submitting || duplicate) return;
    setSubmitting(true);
    const entry = {
      sessionId: session.sessionId,
      sessionDate: session.sessionDate,
      submittedAt: new Date().toISOString(),
      ingredientId,
      ingredientName: ingredientName.trim(),
      ingredientCategory: category,
      ingredientWeightGrams: weight.value,
      trimTechniques: technique,
      estimatedWasteGrams: estimate.value,
      actualWasteGrams: actual.value,
      durationMinutes: timer.durationMinutes,
      preparationStartedAt: timer.startedAt,
      preparationEndedAt: timer.endedAt,
    };
    const saved = commitTrimEntry({ ...entry, source: 'local' });
    if (!saved.ok) {
      setSubmitError(
        saved.reason === 'duplicate_ingredient'
          ? 'This ingredient is already recorded today.'
          : saved.reason,
      );
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    if (saved.mode === 'local') {
      setStep('result');
    }
  }

  const resultPercent =
    weight.ok && actual.ok ? wastePercentage(actual.value, weight.value) : null;
  const comparison =
    resultPercent != null && ingredientId
      ? compareToKitchenReference({
          ingredientId,
          studentWastePercent: resultPercent,
          historicalSamples,
        })
      : null;

  return (
    <section className="kd-card kd-card--trim" data-testid="kitchen-day-trim">
      <p className="kd-progress" data-testid="kitchen-day-trim-progress">
        Step {STEP_ORDER.indexOf(step) + 1} of {STEP_ORDER.length}: {stepLabel(step)}
      </p>

      {step === 'category' ? (
        <div data-testid="kitchen-day-trim-step-category">
          <h2 className="kd-card__title">Ingredient category</h2>
          <div className="kd-chip-grid" data-testid="kitchen-day-category-list">
            {ingredientCategoryOptions().map((option) => (
              <button
                key={option.value}
                type="button"
                className={category === option.value ? 'kd-chip kd-chip--active' : 'kd-chip'}
                data-testid={`kitchen-day-category-${option.value}`}
                onClick={() => {
                  setCategory(option.value);
                  setStep('ingredient');
                }}
              >
                {option.label}
                <span className="kd-chip__value">{option.value}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 'ingredient' ? (
        <div data-testid="kitchen-day-trim-step-ingredient">
          <h2 className="kd-card__title">Ingredient</h2>
          <label className="kd-field">
            <span>Name</span>
            <input
              className="kd-input"
              data-testid="kitchen-day-ingredient-name"
              value={ingredientName}
              onChange={(event) => setIngredientName(event.target.value)}
              autoComplete="off"
            />
          </label>
          {duplicate ? (
            <p className="kd-error" data-testid="kitchen-day-duplicate-ingredient">
              This ingredient is already recorded in this session.
            </p>
          ) : null}
          <button
            type="button"
            className="kd-button kd-button--primary"
            disabled={!ingredientName.trim() || !normalizeIngredientId(ingredientName) || duplicate}
            onClick={goNext}
          >
            Continue
          </button>
        </div>
      ) : null}

      {step === 'weight' ? (
        <div data-testid="kitchen-day-trim-step-weight">
          <h2 className="kd-card__title">Starting weight</h2>
          <label className="kd-field">
            <span>Weight</span>
            <div className="kd-input-row">
              <input
                className="kd-input kd-input--numeric"
                inputMode="decimal"
                data-testid="kitchen-day-starting-weight"
                value={weightRaw}
                onChange={(event) => setWeightRaw(event.target.value)}
              />
              <span className="kd-unit">g</span>
            </div>
          </label>
          {!weight.ok && weightRaw !== '' ? (
            <p className="kd-error" data-testid="kitchen-day-starting-weight-error">
              Enter a starting weight greater than 0 grams.
            </p>
          ) : null}
          <button
            type="button"
            className="kd-button kd-button--primary"
            data-testid="kitchen-day-weight-continue"
            disabled={!weight.ok || setupIssues.length > 0}
            onClick={goNext}
          >
            Continue
          </button>
        </div>
      ) : null}

      {step === 'technique' ? (
        <div data-testid="kitchen-day-trim-step-technique">
          <h2 className="kd-card__title">Trimming technique</h2>
          <div className="kd-chip-grid">
            {TRIM_TECHNIQUES.map((value) => (
              <button
                key={value}
                type="button"
                className={technique === value ? 'kd-chip kd-chip--active' : 'kd-chip'}
                data-testid={`kitchen-day-technique-${value}`}
                onClick={() => setTechnique(value)}
              >
                {TRIM_TECHNIQUE_LABELS[value]}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="kd-button kd-button--primary"
            data-testid="kitchen-day-technique-continue"
            disabled={!canContinueToEstimate(technique)}
            onClick={goNext}
          >
            Continue
          </button>
        </div>
      ) : null}

      {step === 'estimate' ? (
        <div data-testid="kitchen-day-trim-step-estimate">
          <h2 className="kd-card__title">Estimated waste</h2>
          <label className="kd-field">
            <span>Estimate</span>
            <div className="kd-input-row">
              <input
                className="kd-input kd-input--numeric"
                inputMode="decimal"
                data-testid="kitchen-day-estimated-waste"
                value={estimateRaw}
                onChange={(event) => setEstimateRaw(event.target.value)}
              />
              <span className="kd-unit">g</span>
            </div>
          </label>
          {!estimate.ok && estimateRaw !== '' ? (
            <p className="kd-error" data-testid="kitchen-day-estimate-error">
              Estimate must be 0 g up to the starting weight.
            </p>
          ) : null}
          <button
            type="button"
            className="kd-button kd-button--primary"
            data-testid="kitchen-day-estimate-continue"
            disabled={!estimate.ok}
            onClick={goNext}
          >
            Continue
          </button>
        </div>
      ) : null}

      {step === 'timer' ? (
        <div data-testid="kitchen-day-trim-step-timer">
          <h2 className="kd-card__title">Timed preparation</h2>
          <p className="kd-card__copy">Start when you begin physical work. Duration is recorded automatically.</p>
          <p data-testid="kitchen-day-timer-status">{timer.status}</p>
          {timer.status === 'idle' ? (
            <button
              type="button"
              className="kd-button kd-button--primary"
              data-testid="kitchen-day-start-preparation"
              onClick={() => setTimer((current) => startPreparationTimer(current, new Date()))}
            >
              Start preparation
            </button>
          ) : null}
          {timer.status === 'running' ? (
            <button
              type="button"
              className="kd-button kd-button--primary"
              data-testid="kitchen-day-finish-preparation"
              onClick={() => setTimer((current) => finishPreparationTimer(current, new Date()))}
            >
              Finish preparation
            </button>
          ) : null}
          {timer.status === 'finished' ? (
            <button
              type="button"
              className="kd-button kd-button--primary"
              data-testid="kitchen-day-timer-continue"
              onClick={goNext}
            >
              Continue
            </button>
          ) : null}
        </div>
      ) : null}

      {step === 'actual' ? (
        <div data-testid="kitchen-day-trim-step-actual">
          <h2 className="kd-card__title">Actual waste</h2>
          <label className="kd-field">
            <span>Measured waste</span>
            <div className="kd-input-row">
              <input
                className="kd-input kd-input--numeric"
                inputMode="decimal"
                data-testid="kitchen-day-actual-waste"
                value={actualRaw}
                onChange={(event) => setActualRaw(event.target.value)}
              />
              <span className="kd-unit">g</span>
            </div>
          </label>
          {!actual.ok && actualRaw !== '' ? (
            <p className="kd-error" data-testid="kitchen-day-actual-error">
              Actual waste must be 0 g up to the starting weight.
            </p>
          ) : null}
          {submitError ? <p className="kd-error">{submitError}</p> : null}
          <button
            type="button"
            className="kd-button kd-button--primary"
            data-testid="kitchen-day-submit-trim"
            disabled={!actual.ok || submitting}
            onClick={submitEntry}
          >
            Save ingredient
          </button>
        </div>
      ) : null}

      {step === 'result' && resultPercent != null ? (
        <div data-testid="kitchen-day-trim-step-result">
          <h2 className="kd-card__title">Preparation result</h2>
          <p data-testid="kitchen-day-waste-percent">Waste {resultPercent}%</p>
          {comparison ? (
            <p data-testid="kitchen-day-reference-comparison">
              {comparison.performedBetterThanReference
                ? 'Better than the kitchen reference'
                : 'At or above the kitchen reference'}{' '}
              ({comparison.source === 'historical' ? 'historical average' : 'chef-seeded reference'}{' '}
              {comparison.referenceWastePercent}%)
            </p>
          ) : (
            <p data-testid="kitchen-day-reference-comparison">No kitchen reference for this ingredient yet.</p>
          )}
          <p className="kd-helper" data-testid="kitchen-day-no-percentile">
            Comparison is not a chef score and is not stored.
          </p>
          <div className="kd-actions">
            <button
              type="button"
              className="kd-button kd-button--primary"
              data-testid="kitchen-day-add-another-ingredient"
              onClick={resetForAnother}
            >
              Another ingredient
            </button>
            <a className="kd-button kd-button--secondary" href="#/kitchen-day/reuse">
              Record reuse
            </a>
          </div>
        </div>
      ) : null}
    </section>
  );
}
