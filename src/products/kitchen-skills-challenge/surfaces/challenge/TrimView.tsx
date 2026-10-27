import { useEffect, useState } from 'react';
import { formatDurationFromMinutes, formatGrams } from '@/products/kitchen-skills-challenge/format';
import { useReadyKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { isIngredientAlreadyRecorded } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
import {
  formatCanonicalGramsText,
  portionCompositionMassGrams,
} from '@/products/kitchen-skills-challenge/domain/session/portionCompositionMass';
import {
  remainingRecipeIngredientsForTrim,
  sessionRecipeReference,
  trimIngredientAvailability,
} from '@/products/kitchen-skills-challenge/domain/session/sessionRecipe';
import { TRIM_TECHNIQUES, type TrimTechnique } from '@/products/kitchen-skills-challenge/domain/types';
import { TRIM_TECHNIQUE_LABELS } from '@/products/kitchen-skills-challenge/domain/trim/techniques';
import {
  createIdleTimer,
  finishPreparationTimer,
  startPreparationTimer,
  type PreparationTimerState,
} from '@/products/kitchen-skills-challenge/domain/trim/timer';
import { preferredMassInputUnit } from '@/products/kitchen-skills-challenge/domain/mass';
import { KitchenSkillsMassInput } from '@/products/kitchen-skills-challenge/surfaces/shared/KitchenSkillsMassInput';
import { TrimSummaryList } from '@/products/kitchen-skills-challenge/surfaces/shared/AttemptModuleLists';
import { KitchenSkillsRecipeCombobox } from '@/products/kitchen-skills-challenge/surfaces/challenge/KitchenSkillsRecipeCombobox';
import {
  canContinueToEstimate,
  parseActualWasteGrams,
  parseEstimatedWasteGrams,
  parseStartingWeightGrams,
  validateIngredientSetup,
} from '@/products/kitchen-skills-challenge/domain/trim/validation';

type TrimStep =
  | 'ingredient'
  | 'weight'
  | 'technique'
  | 'estimate'
  | 'timer'
  | 'actual'
  | 'result';

const STEP_ORDER: TrimStep[] = [
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

function TrimStepActions({
  onBack,
  continueLabel = 'Continue',
  continueTestId,
  continueDisabled,
  onContinue,
}: {
  onBack?: () => void;
  continueLabel?: string;
  continueTestId?: string;
  continueDisabled?: boolean;
  onContinue?: () => void;
}) {
  return (
    <div className="kitchen-day-form-actions kitchen-day-form-actions--sticky">
      {onBack ? (
        <button
          type="button"
          className="kitchen-day-button kitchen-day-button--secondary"
          data-testid="kitchen-day-trim-back"
          onClick={onBack}
        >
          Back
        </button>
      ) : null}
      {onContinue ? (
        <button
          type="button"
          className="kitchen-day-button kitchen-day-button--primary"
          data-testid={continueTestId}
          disabled={continueDisabled}
          onClick={onContinue}
        >
          {continueLabel}
        </button>
      ) : null}
    </div>
  );
}

export function KitchenSkillsTrimView() {
  const {
    session,
    portionEntries,
    trimEntries,
    activeRecipeId,
    activePortionEntry,
    recordedIngredientIds,
    commitTrimEntry,
    setTrimInProgress,
    enterReuse,
    taskProgress,
  } = useReadyKitchenSkillsSession();
  const recipe = sessionRecipeReference(portionEntries, activeRecipeId);
  const remainingIngredients = recipe
    ? remainingRecipeIngredientsForTrim(recipe, recordedIngredientIds)
    : [];
  const availability = recipe
    ? trimIngredientAvailability(recipe, recordedIngredientIds)
    : 'none-eligible';
  const canRecordReuse = taskProgress.remainingRescueIngredientIds.length > 0;
  const [step, setStep] = useState<TrimStep>('ingredient');
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [weightRaw, setWeightRaw] = useState('');
  /** True when Portion supplied a valid mass and the dedicated weight step was skipped. */
  const [weightFromPortion, setWeightFromPortion] = useState(false);
  const [technique, setTechnique] = useState<TrimTechnique | null>(null);
  const [estimateRaw, setEstimateRaw] = useState('');
  const [actualRaw, setActualRaw] = useState('');
  const [timer, setTimer] = useState<PreparationTimerState>(createIdleTimer());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedLine =
    remainingIngredients.find((line) => line.ingredientId === selectedIngredientId) ??
    recipe?.lines.find((line) => line.ingredientId === selectedIngredientId) ??
    null;
  const ingredientId = selectedLine?.ingredientId ?? null;
  const ingredientName = selectedLine?.ingredientName ?? '';
  const weight = parseStartingWeightGrams(weightRaw);
  const estimate = weight.ok
    ? parseEstimatedWasteGrams(estimateRaw, weight.value)
    : { ok: false as const, issue: 'invalid' as const };
  const actual = weight.ok
    ? parseActualWasteGrams(actualRaw, weight.value)
    : { ok: false as const, issue: 'invalid' as const };
  const setupIssues = validateIngredientSetup({
    ingredientName,
    startingWeightGrams: weightRaw,
  });
  const duplicate =
    ingredientId !== null &&
    step !== 'result' &&
    isIngredientAlreadyRecorded(recordedIngredientIds, ingredientId);

  useEffect(() => {
    // Empty ingredient picker is not draft work — resume must still allow Record reuse / Reuse nav
    // for the active recipe's already-saved waste.
    const drafting = step !== 'result' && (step !== 'ingredient' || Boolean(selectedIngredientId));
    setTrimInProgress(drafting);
    return () => setTrimInProgress(false);
  }, [selectedIngredientId, setTrimInProgress, step]);

  function applyPortionStartingWeight(nextIngredientId: string): boolean {
    const composition = activePortionEntry?.recipeComposition ?? [];
    const portionGrams = portionCompositionMassGrams(composition, nextIngredientId);
    if (portionGrams == null) {
      setWeightRaw('');
      setWeightFromPortion(false);
      return false;
    }
    setWeightRaw(formatCanonicalGramsText(portionGrams));
    setWeightFromPortion(true);
    return true;
  }

  function goNext() {
    if (step === 'ingredient') {
      if (!selectedIngredientId || duplicate) return;
      if (applyPortionStartingWeight(selectedIngredientId)) {
        setStep('technique');
        return;
      }
      setStep('weight');
      return;
    }
    if (step === 'weight') {
      setWeightFromPortion(false);
      setStep('technique');
      return;
    }
    const index = STEP_ORDER.indexOf(step);
    setStep(STEP_ORDER[index + 1] ?? step);
  }

  function goBack() {
    if (step === 'technique' && weightFromPortion) {
      setStep('ingredient');
      return;
    }
    const index = STEP_ORDER.indexOf(step);
    setStep(STEP_ORDER[index - 1] ?? step);
  }

  function resetForAnother() {
    setStep('ingredient');
    setSelectedIngredientId('');
    setWeightRaw('');
    setWeightFromPortion(false);
    setTechnique(null);
    setEstimateRaw('');
    setActualRaw('');
    setTimer(createIdleTimer());
    setSubmitError(null);
    setSubmitting(false);
  }

  function submitEntry() {
    if (!ingredientId || !weight.ok || !technique || !estimate.ok || !actual.ok) return;
    if (!activeRecipeId || timer.status !== 'finished' || submitting || duplicate) return;
    setSubmitting(true);
    const entry = {
      sessionId: session.sessionId,
      sessionDate: session.sessionDate,
      submittedAt: new Date().toISOString(),
      recipeId: activeRecipeId,
      ingredientId,
      ingredientName: ingredientName.trim(),
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
          ? 'This ingredient is already recorded in this challenge.'
          : saved.reason === 'attempt_closed'
            ? 'This challenge was finished or restarted in another window.'
            : 'This ingredient could not be saved.',
      );
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setStep('result');
  }

  const ingredientOptions = remainingIngredients.map((line) => ({
    id: line.ingredientId,
    label: line.ingredientName,
  }));

  return (
    <section className="kitchen-day-card" data-testid="kitchen-day-trim">
      {availability !== 'none-eligible' ? (
        <p className="kitchen-day-progress" data-testid="kitchen-day-trim-progress">
          Step {STEP_ORDER.indexOf(step) + 1} of {STEP_ORDER.length}: {stepLabel(step)}
        </p>
      ) : null}
      {recipe ? (
        <p className="kitchen-day-card__copy" data-testid="kitchen-day-trim-recipe">
          Recipe {recipe.recipeName}
        </p>
      ) : null}

      {step === 'ingredient' ? (
        <div data-testid="kitchen-day-trim-step-ingredient">
          <h2 className="kitchen-day-card__title">Ingredient</h2>
          {availability === 'none-eligible' ? (
            <p className="kitchen-day-card__copy" data-testid="kitchen-day-trim-no-eligible">
              No Trim Smart ingredients for this recipe. You can finish the challenge.
            </p>
          ) : availability === 'all-recorded' ? (
            <>
              <p className="kitchen-day-card__copy" data-testid="kitchen-day-trim-no-remaining">
                All Trim Smart ingredients for this recipe are already recorded.
              </p>
              {canRecordReuse ? (
                <TrimStepActions
                  continueLabel="Record reuse"
                  continueTestId="kitchen-day-continue-reuse"
                  onContinue={enterReuse}
                />
              ) : null}
            </>
          ) : (
            <>
              <label className="kitchen-day-field">
                <span>Name</span>
                <KitchenSkillsRecipeCombobox
                  options={ingredientOptions}
                  value={selectedIngredientId}
                  onChange={setSelectedIngredientId}
                  testId="kitchen-day-ingredient-name"
                  listTestId="kitchen-day-ingredient-list"
                  placeholder="Select ingredient…"
                  noMatchLabel="No matching ingredients"
                />
              </label>
              {duplicate ? (
                <p className="kitchen-day-error" data-testid="kitchen-day-duplicate-ingredient">
                  This ingredient is already recorded in this session.
                </p>
              ) : null}
              <TrimStepActions
                continueDisabled={!selectedIngredientId || duplicate}
                onContinue={goNext}
              />
            </>
          )}
        </div>
      ) : null}

      {step === 'weight' ? (
        <div data-testid="kitchen-day-trim-step-weight">
          <h2 className="kitchen-day-card__title">Starting weight</h2>
          <label className="kitchen-day-field">
            <span>Weight</span>
            <KitchenSkillsMassInput
              testId="kitchen-day-starting-weight"
              unitGroupLabel="Starting weight unit"
              defaultUnit={preferredMassInputUnit(weight.ok ? weight.value : null)}
              value={weightRaw}
              onChange={setWeightRaw}
            />
          </label>
          {!weight.ok && weightRaw !== '' ? (
            <p className="kitchen-day-error" data-testid="kitchen-day-starting-weight-error">
              Enter a starting weight greater than 0 grams.
            </p>
          ) : null}
          <TrimStepActions
            onBack={goBack}
            continueTestId="kitchen-day-weight-continue"
            continueDisabled={!weight.ok || setupIssues.length > 0}
            onContinue={goNext}
          />
        </div>
      ) : null}

      {step === 'technique' ? (
        <div data-testid="kitchen-day-trim-step-technique">
          <h2 className="kitchen-day-card__title">Trimming technique</h2>
          {weightFromPortion ? (
            <label className="kitchen-day-field" data-testid="kitchen-day-trim-starting-weight-prefill">
              <span>Starting weight</span>
              <KitchenSkillsMassInput
                key={`trim-start-${ingredientId ?? 'none'}`}
                testId="kitchen-day-starting-weight"
                unitGroupLabel="Starting weight unit"
                defaultUnit={preferredMassInputUnit(weight.ok ? weight.value : null)}
                value={weightRaw}
                onChange={setWeightRaw}
              />
              <span className="kitchen-day-card__copy" data-testid="kitchen-day-starting-weight-source">
                Prefills from Portion Precision; change if the trimmed quantity differs.
              </span>
              {!weight.ok && weightRaw !== '' ? (
                <p className="kitchen-day-error" data-testid="kitchen-day-starting-weight-error">
                  Enter a starting weight greater than 0 grams.
                </p>
              ) : null}
            </label>
          ) : null}
          <div
            className="kitchen-day-chip-grid kitchen-day-chip-grid--techniques"
            data-testid="kitchen-day-technique-list"
          >
            {TRIM_TECHNIQUES.map((value) => (
              <button
                key={value}
                type="button"
                className={
                  technique === value
                    ? 'kitchen-day-chip kitchen-day-chip--compact kitchen-day-chip--active'
                    : 'kitchen-day-chip kitchen-day-chip--compact'
                }
                data-testid={`kitchen-day-technique-${value}`}
                aria-pressed={technique === value}
                onClick={() => setTechnique(value)}
              >
                {TRIM_TECHNIQUE_LABELS[value]}
              </button>
            ))}
          </div>
          <TrimStepActions
            onBack={goBack}
            continueTestId="kitchen-day-technique-continue"
            continueDisabled={
              !canContinueToEstimate(technique) || (weightFromPortion && (!weight.ok || setupIssues.length > 0))
            }
            onContinue={goNext}
          />
        </div>
      ) : null}

      {step === 'estimate' ? (
        <div data-testid="kitchen-day-trim-step-estimate">
          <h2 className="kitchen-day-card__title">Estimated waste</h2>
          <label className="kitchen-day-field">
            <span>Estimate</span>
            <KitchenSkillsMassInput
              testId="kitchen-day-estimated-waste"
              unitGroupLabel="Estimated waste unit"
              value={estimateRaw}
              onChange={setEstimateRaw}
            />
          </label>
          {!estimate.ok && estimateRaw !== '' ? (
            <p className="kitchen-day-error" data-testid="kitchen-day-estimate-error">
              Estimate must be 0 g up to the starting weight.
            </p>
          ) : null}
          <TrimStepActions
            onBack={goBack}
            continueTestId="kitchen-day-estimate-continue"
            continueDisabled={!estimate.ok}
            onContinue={goNext}
          />
        </div>
      ) : null}

      {step === 'timer' ? (
        <div data-testid="kitchen-day-trim-step-timer">
          <h2 className="kitchen-day-card__title">Timed preparation</h2>
          {timer.status === 'idle' ? (
            <>
              <p className="kitchen-day-card__copy" data-testid="kitchen-day-timer-status">
                Start when you begin physical work.
              </p>
              <TrimStepActions
                onBack={goBack}
                continueLabel="Start preparation"
                continueTestId="kitchen-day-start-preparation"
                onContinue={() => setTimer((current) => startPreparationTimer(current, new Date()))}
              />
            </>
          ) : null}
          {timer.status === 'running' ? (
            <>
              <p className="kitchen-day-card__copy" data-testid="kitchen-day-timer-status">
                Preparation in progress
              </p>
              <ElapsedPreparationTime startedAt={timer.startedAt} />
              <TrimStepActions
                onBack={goBack}
                continueLabel="Finish preparation"
                continueTestId="kitchen-day-finish-preparation"
                onContinue={() => setTimer((current) => finishPreparationTimer(current, new Date()))}
              />
            </>
          ) : null}
          {timer.status === 'finished' ? (
            <>
              <p className="kitchen-day-card__copy" data-testid="kitchen-day-timer-status">
                Preparation time {formatDurationFromMinutes(timer.durationMinutes)}
              </p>
              <TrimStepActions
                onBack={goBack}
                continueTestId="kitchen-day-timer-continue"
                onContinue={goNext}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {step === 'actual' ? (
        <div data-testid="kitchen-day-trim-step-actual">
          <h2 className="kitchen-day-card__title">Actual waste</h2>
          <label className="kitchen-day-field">
            <span>Measured waste</span>
            <KitchenSkillsMassInput
              testId="kitchen-day-actual-waste"
              unitGroupLabel="Measured waste unit"
              value={actualRaw}
              onChange={setActualRaw}
            />
          </label>
          {!actual.ok && actualRaw !== '' ? (
            <p className="kitchen-day-error" data-testid="kitchen-day-actual-error">
              Actual waste must be 0 g up to the starting weight.
            </p>
          ) : null}
          {submitError ? <p className="kitchen-day-error">{submitError}</p> : null}
          <TrimStepActions
            onBack={goBack}
            continueLabel="Save ingredient"
            continueTestId="kitchen-day-submit-trim"
            continueDisabled={!actual.ok || submitting}
            onContinue={submitEntry}
          />
        </div>
      ) : null}

      {step === 'result' && actual.ok ? (
        <div data-testid="kitchen-day-trim-step-result">
          <h2 className="kitchen-day-card__title">Preparation result</h2>
          <dl className="kitchen-day-metric-grid">
            <div className="kitchen-day-metric">
              <dt>Actual waste</dt>
              <dd>{formatGrams(actual.value)}</dd>
            </div>
            {weight.ok ? (
              <div className="kitchen-day-metric">
                <dt>Starting weight</dt>
                <dd>{formatGrams(weight.value)}</dd>
              </div>
            ) : null}
            {timer.status === 'finished' ? (
              <div className="kitchen-day-metric">
                <dt>Preparation time</dt>
                <dd data-testid="kitchen-day-trim-result-duration">
                  {formatDurationFromMinutes(timer.durationMinutes)}
                </dd>
              </div>
            ) : null}
          </dl>
          <div className="kitchen-day-actions">
            {remainingIngredients.length > 0 ? (
              <button
                type="button"
                className="kitchen-day-button kitchen-day-button--primary"
                data-testid="kitchen-day-add-another-ingredient"
                onClick={resetForAnother}
              >
                Another ingredient
              </button>
            ) : null}
            {canRecordReuse ? (
              <button
                type="button"
                className="kitchen-day-button kitchen-day-button--secondary"
                data-testid="kitchen-day-continue-reuse"
                onClick={enterReuse}
              >
                Record reuse
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {trimEntries.length > 0 ? (
        <section className="kitchen-day-trim-saved" aria-labelledby="kitchen-day-trim-saved-title">
          <h3 id="kitchen-day-trim-saved-title" className="kitchen-day-trim-saved__title">
            Saved ingredients
          </h3>
          <TrimSummaryList entries={trimEntries} testIdPrefix="kitchen-day-trim" />
        </section>
      ) : null}
    </section>
  );
}

function ElapsedPreparationTime({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const minutes = Math.max(0, (now - new Date(startedAt).getTime()) / 60_000);
  return <p data-testid="kitchen-day-timer-elapsed">{formatDurationFromMinutes(minutes)}</p>;
}
