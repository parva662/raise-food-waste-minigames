import { TrimSmartHeader } from './components/TrimSmartHeader';
import { TrimSmartIngredientRecorded } from './components/TrimSmartIngredientRecorded';
import { TrimSmartIngredientStep } from './components/TrimSmartIngredientStep';
import { TrimSmartMeasureStep } from './components/TrimSmartMeasureStep';
import { TrimSmartPracticeStep } from './components/TrimSmartPracticeStep';
import { TrimSmartSessionComplete } from './components/TrimSmartSessionComplete';
import { TrimSmartSessionProgress } from './components/TrimSmartSessionProgress';
import { TrimSmartStepper } from './components/TrimSmartStepper';
import { useTrimSmart } from './useTrimSmart';
import { parseParticipantWasteGrams } from './validation';

function wasteErrorMessage(
  wasteParsed: ReturnType<typeof parseParticipantWasteGrams>,
  wasteInput: string,
): string | null {
  if (wasteInput.trim() === '') return null;
  if (wasteParsed.ok) return null;
  if (wasteParsed.issue === 'blank') return 'Enter your preparation waste in grams.';
  return 'Enter a valid weight of zero or more grams.';
}

export function TrimSmartApp() {
  const {
    embedded,
    task,
    screen,
    step,
    stepHeadingRef,
    completedIngredients,
    currentIngredientOrdinal,
    ingredientCategory,
    setIngredientCategory,
    ingredientName,
    setIngredientName,
    startingWeightGrams,
    setStartingWeightGrams,
    ingredientIssues,
    canStartChallenge,
    lockedAttempt,
    practice,
    setPractice,
    wasteInput,
    setWasteInput,
    submissionState,
    submissionError,
    lastRecorded,
    canContinuePractice,
    canSubmit,
    goToStep,
    startChallenge,
    submit,
    addAnotherIngredient,
    finishSession,
    startNewDemoSession,
  } = useTrimSmart();

  const wasteParsed = parseParticipantWasteGrams(wasteInput);
  const wasteError = wasteErrorMessage(wasteParsed, wasteInput);

  return (
    <div className="trim-smart-page" data-testid="trim-smart-page">
      <TrimSmartHeader recordedCount={completedIngredients.length} />

      {import.meta.env.DEV && embedded ? (
        <details className="trim-smart-dev-details" data-testid="trim-smart-dev-details">
          <summary>Developer</summary>
          <p className="trim-smart-helper">
            GameBus task id: {task?.id ?? '(none)'}
          </p>
        </details>
      ) : null}

      {completedIngredients.length > 0 && screen === 'flow' ? (
        <TrimSmartSessionProgress completed={completedIngredients} />
      ) : null}

      {screen === 'session-complete' ? (
        <TrimSmartSessionComplete
          completed={completedIngredients}
          showStartNewDemo={!embedded}
          onStartNewDemo={startNewDemoSession}
        />
      ) : screen === 'ingredient-recorded' && lastRecorded ? (
        <>
          <TrimSmartSessionProgress completed={completedIngredients} />
          <TrimSmartIngredientRecorded
            submission={lastRecorded}
            onAddAnother={addAnotherIngredient}
            onFinishSession={finishSession}
          />
        </>
      ) : (
        <>
          <TrimSmartStepper activeStep={step} />
          {step === 'ingredient' ? (
            <TrimSmartIngredientStep
              headingRef={stepHeadingRef}
              ingredientOrdinal={currentIngredientOrdinal}
              isFollowUpIngredient={completedIngredients.length > 0}
              ingredientCategory={ingredientCategory}
              ingredientName={ingredientName}
              startingWeightGrams={startingWeightGrams}
              ingredientIssues={ingredientIssues}
              canStartChallenge={canStartChallenge}
              onCategoryChange={setIngredientCategory}
              onNameChange={setIngredientName}
              onWeightChange={setStartingWeightGrams}
              onStart={startChallenge}
            />
          ) : null}
          {step === 'practice' && lockedAttempt ? (
            <TrimSmartPracticeStep
              attempt={lockedAttempt}
              headingRef={stepHeadingRef}
              selectedPractice={practice}
              onSelectPractice={setPractice}
              onBack={() => goToStep('ingredient')}
              onContinue={() => {
                if (canContinuePractice) goToStep('measure');
              }}
            />
          ) : null}
          {step === 'measure' && lockedAttempt && practice ? (
            <TrimSmartMeasureStep
              attempt={lockedAttempt}
              practice={practice}
              wasteInput={wasteInput}
              wasteError={wasteError}
              headingRef={stepHeadingRef}
              onWasteChange={setWasteInput}
              onBack={() => goToStep('practice')}
              onSubmit={submit}
              canSubmit={canSubmit}
              isSubmitting={submissionState === 'submitting'}
              submitError={submissionError}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
