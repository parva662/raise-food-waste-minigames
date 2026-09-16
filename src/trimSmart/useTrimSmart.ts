import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { isGameBusEmbed } from '../gamebus/detectEmbed';
import { tryPostTrimSmartActivity } from '../gamebus/bridge';
import { useGameBusEmbed } from '../gamebus/useGameBusEmbed';
import { buildTrimSmartSubmission } from './buildSubmission';
import { ensureTrimSmartLockedSession } from './sessionLock';
import type {
  TrimSmartIngredientCategory,
  TrimSmartLockedAttempt,
  TrimSmartLockedSession,
  TrimSmartPractice,
  TrimSmartScreen,
  TrimSmartStep,
  TrimSmartSubmission,
  TrimSmartSubmissionState,
} from './types';
import {
  parseParticipantWasteGrams,
  parseStartingWeightGrams,
  validateIngredientStepInput,
} from './validation';

function attemptMatchesDraft(
  locked: TrimSmartLockedAttempt,
  draft: {
    ingredientCategory: string;
    ingredientName: string;
    startingWeightGrams: string;
  },
): boolean {
  const weight = parseStartingWeightGrams(draft.startingWeightGrams);
  if (!weight.ok) return false;
  return (
    locked.ingredientCategory === draft.ingredientCategory &&
    locked.ingredientName === draft.ingredientName.trim() &&
    locked.ingredientWeightGrams === weight.value
  );
}

function resetCurrentIngredientAttemptState(setters: {
  setLockedAttempt: (value: TrimSmartLockedAttempt | null) => void;
  setPractice: (value: TrimSmartPractice | null) => void;
  setWasteInput: (value: string) => void;
  setSubmissionState: (value: TrimSmartSubmissionState) => void;
  setSubmissionError: (value: string | null) => void;
  setAttemptPostKey: (value: string | null) => void;
}) {
  setters.setLockedAttempt(null);
  setters.setPractice(null);
  setters.setWasteInput('');
  setters.setSubmissionState('idle');
  setters.setSubmissionError(null);
  setters.setAttemptPostKey(null);
}

export function useTrimSmart() {
  const embedded = isGameBusEmbed();
  const { task } = useGameBusEmbed();
  const [screen, setScreen] = useState<TrimSmartScreen>('flow');
  const [step, setStep] = useState<TrimSmartStep>('ingredient');
  const [lockedSession, setLockedSession] = useState<TrimSmartLockedSession | null>(null);
  const [completedIngredients, setCompletedIngredients] = useState<TrimSmartSubmission[]>([]);
  const [ingredientCategory, setIngredientCategory] = useState('');
  const [ingredientName, setIngredientName] = useState('');
  const [startingWeightGrams, setStartingWeightGrams] = useState('');
  const [lockedAttempt, setLockedAttempt] = useState<TrimSmartLockedAttempt | null>(null);
  const [practice, setPractice] = useState<TrimSmartPractice | null>(null);
  const [wasteInput, setWasteInput] = useState('');
  const [submissionState, setSubmissionState] = useState<TrimSmartSubmissionState>('idle');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [lastRecorded, setLastRecorded] = useState<TrimSmartSubmission | null>(null);
  const [attemptPostKey, setAttemptPostKey] = useState<string | null>(null);
  const attemptCounterRef = useRef(0);
  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const [stepFocusRequest, setStepFocusRequest] = useState(0);

  const ingredientIssues = validateIngredientStepInput({
    ingredientCategory,
    ingredientName,
    startingWeightGrams,
  });
  const canStartChallenge = ingredientIssues.length === 0;

  const wasteParsed = parseParticipantWasteGrams(wasteInput);
  const canContinuePractice = practice !== null;
  const canSubmit =
    lockedSession !== null &&
    lockedAttempt !== null &&
    practice !== null &&
    wasteParsed.ok &&
    attemptPostKey !== null &&
    submissionState !== 'submitting' &&
    submissionState !== 'submitted';

  const currentIngredientOrdinal = completedIngredients.length + 1;

  const focusStepHeading = useCallback(() => {
    setStepFocusRequest((request) => request + 1);
  }, []);

  // Focus lands with the commit that renders the new step, so nothing can be
  // typed into the new step before focus moves.
  useLayoutEffect(() => {
    if (stepFocusRequest === 0) return;
    stepHeadingRef.current?.focus();
  }, [stepFocusRequest]);

  const goToStep = useCallback(
    (next: TrimSmartStep) => {
      setScreen('flow');
      setStep(next);
      focusStepHeading();
    },
    [focusStepHeading],
  );

  const resetCurrentAttemptOnly = useCallback(() => {
    resetCurrentIngredientAttemptState({
      setLockedAttempt,
      setPractice,
      setWasteInput,
      setSubmissionState,
      setSubmissionError,
      setAttemptPostKey,
    });
  }, []);

  const resetDownstream = useCallback(() => {
    resetCurrentAttemptOnly();
  }, [resetCurrentAttemptOnly]);

  const updateIngredientCategory = useCallback(
    (value: string) => {
      setIngredientCategory(value);
      if (
        lockedAttempt &&
        (practice !== null || wasteInput !== '' || submissionState !== 'idle') &&
        !attemptMatchesDraft(lockedAttempt, {
          ingredientCategory: value,
          ingredientName,
          startingWeightGrams,
        })
      ) {
        resetDownstream();
      }
    },
    [ingredientName, lockedAttempt, practice, resetDownstream, startingWeightGrams, submissionState, wasteInput],
  );

  const updateIngredientName = useCallback(
    (value: string) => {
      setIngredientName(value);
      if (
        lockedAttempt &&
        (practice !== null || wasteInput !== '' || submissionState !== 'idle') &&
        !attemptMatchesDraft(lockedAttempt, {
          ingredientCategory,
          ingredientName: value,
          startingWeightGrams,
        })
      ) {
        resetDownstream();
      }
    },
    [ingredientCategory, lockedAttempt, practice, resetDownstream, startingWeightGrams, submissionState, wasteInput],
  );

  const updateStartingWeightGrams = useCallback(
    (value: string) => {
      setStartingWeightGrams(value);
      if (
        lockedAttempt &&
        (practice !== null || wasteInput !== '' || submissionState !== 'idle') &&
        !attemptMatchesDraft(lockedAttempt, {
          ingredientCategory,
          ingredientName,
          startingWeightGrams: value,
        })
      ) {
        resetDownstream();
      }
    },
    [ingredientCategory, ingredientName, lockedAttempt, practice, resetDownstream, submissionState, wasteInput],
  );

  const startChallenge = useCallback(() => {
    if (!canStartChallenge) return;
    const weight = parseStartingWeightGrams(startingWeightGrams);
    if (!weight.ok) return;

    const session = ensureTrimSmartLockedSession(lockedSession, {
      embedded,
      taskId: task?.id,
    });
    if (!lockedSession) {
      setLockedSession(session);
    }

    attemptCounterRef.current += 1;
    setAttemptPostKey(`trim-smart-attempt-${attemptCounterRef.current}`);

    const attempt: TrimSmartLockedAttempt = {
      ingredientCategory: ingredientCategory as TrimSmartIngredientCategory,
      ingredientName: ingredientName.trim(),
      ingredientWeightGrams: weight.value,
    };
    setLockedAttempt(attempt);
    setScreen('flow');
    goToStep('practice');
  }, [
    canStartChallenge,
    embedded,
    goToStep,
    ingredientCategory,
    ingredientName,
    lockedSession,
    startingWeightGrams,
    task?.id,
  ]);

  const submit = useCallback(() => {
    if (!lockedSession || !lockedAttempt || !practice || !wasteParsed.ok || !attemptPostKey) return;
    if (submissionState === 'submitting' || submissionState === 'submitted') return;

    let submission: TrimSmartSubmission;
    try {
      submission = buildTrimSmartSubmission({
        session: lockedSession,
        attempt: lockedAttempt,
        practice,
        participantWasteGrams: wasteParsed.value,
        submittedAt: new Date().toISOString(),
      });
    } catch (error) {
      setSubmissionState('error');
      setSubmissionError(error instanceof Error ? error.message : 'Unable to build submission');
      return;
    }

    setSubmissionState('submitting');
    setSubmissionError(null);

    if (embedded) {
      const result = tryPostTrimSmartActivity(submission, attemptPostKey);
      if (!result.ok) {
        setSubmissionState('error');
        setSubmissionError(result.reason);
        return;
      }
    }

    setCompletedIngredients((entries) => [...entries, submission]);
    setLastRecorded(submission);
    setSubmissionState('submitted');
    setScreen('ingredient-recorded');
  }, [
    attemptPostKey,
    embedded,
    lockedAttempt,
    lockedSession,
    practice,
    submissionState,
    wasteParsed,
  ]);

  const addAnotherIngredient = useCallback(() => {
    setIngredientCategory('');
    setIngredientName('');
    setStartingWeightGrams('');
    resetCurrentAttemptOnly();
    setScreen('flow');
    setStep('ingredient');
    focusStepHeading();
  }, [focusStepHeading, resetCurrentAttemptOnly]);

  const finishSession = useCallback(() => {
    if (completedIngredients.length === 0) return;
    setScreen('session-complete');
  }, [completedIngredients.length]);

  const startNewDemoSession = useCallback(() => {
    setScreen('flow');
    setStep('ingredient');
    setLockedSession(null);
    setCompletedIngredients([]);
    setIngredientCategory('');
    setIngredientName('');
    setStartingWeightGrams('');
    setLastRecorded(null);
    attemptCounterRef.current = 0;
    resetCurrentAttemptOnly();
  }, [resetCurrentAttemptOnly]);

  return {
    embedded,
    task,
    screen,
    step,
    stepHeadingRef,
    lockedSession,
    completedIngredients,
    currentIngredientOrdinal,
    ingredientCategory,
    setIngredientCategory: updateIngredientCategory,
    ingredientName,
    setIngredientName: updateIngredientName,
    startingWeightGrams,
    setStartingWeightGrams: updateStartingWeightGrams,
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
  };
}
