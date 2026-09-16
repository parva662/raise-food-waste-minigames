import { useReducer, useCallback, useMemo, useEffect, useState } from 'react';
import { CANTEEN_CONFIG } from '../config/canteen';
import { resolveMenuForDate } from '../services/menuResolver';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import {
  declarationRepository,
  createEmptyDraft,
  snapshotFromDeclaration,
  createDeclarationFromDraft,
  type SavedSnapshot,
  type DraftSnapshot,
} from '../utils/declaration';
import { canSubmitMealDraft } from '../utils/declarationSelection';
import { buildSelectionsFromMealDraft, buildMealSummary } from '../utils/mealChoice';
import {
  applyPortionAdjustment,
  draftForMealChoice,
  type PortionField,
} from '../utils/mealDraftActions';
import {
  getSubmissionWindowStatus,
  isSubmissionAllowed,
  systemClock,
  type Clock,
} from '../services/submissionWindow';
import { formatDisplayDate, formatSubmissionTime } from '../utils/dates';
import { tryResolveStudentLunchServiceDate } from '../services/studentLunchServiceDate';
import type { MealChoice } from '../types/mealChoice';
import type { SelectionEntry } from '../types/menu';
import type { MealSummaryLine } from '../utils/mealChoice';
import { isGameBusEmbed, tryPostActivity, useGameBusEmbed } from '../gamebus';
import { gamebusDevLog } from '../gamebus/devLog';
import { logStudentTryPostActivityResult } from '../gamebus/debug/studentGameBusSubmissionDebug';

export type LunchUiStep = 'edit' | 'review';
export type LunchSubmitStatus = 'idle' | 'sending' | 'failed' | 'success';

export interface LunchSelectionState {
  draft: DraftSnapshot;
  savedSnapshot: SavedSnapshot | null;
  successMessage: string | null;
  uiStep: LunchUiStep;
  submitStatus: LunchSubmitStatus;
  submitError: string | null;
}

type LunchAction =
  | { type: 'ACTIVATE_MEAL_CHOICE'; choice: MealChoice }
  | { type: 'ADJUST_PORTION'; field: PortionField; delta: number; maxQuantity: number }
  | { type: 'RESET_DRAFT' }
  | { type: 'ENTER_REVIEW' }
  | { type: 'EXIT_REVIEW' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_FAILURE'; message: string }
  | { type: 'SUBMIT_SUCCESS'; savedSnapshot: SavedSnapshot; message: string }
  | { type: 'RESTORE'; savedSnapshot: SavedSnapshot; draft: DraftSnapshot }
  | { type: 'CLEAR_SUCCESS' };

function createInitialState(): LunchSelectionState {
  return {
    draft: createEmptyDraft(),
    savedSnapshot: null,
    successMessage: null,
    uiStep: 'edit',
    submitStatus: 'idle',
    submitError: null,
  };
}

function lunchReducer(state: LunchSelectionState, action: LunchAction): LunchSelectionState {
  switch (action.type) {
    case 'ACTIVATE_MEAL_CHOICE': {
      const draft = draftForMealChoice(state.draft, action.choice);
      if (draft === state.draft) return state;
      return {
        ...state,
        draft,
        successMessage: null,
        submitError: null,
        submitStatus: state.submitStatus === 'failed' ? 'idle' : state.submitStatus,
        uiStep: 'edit',
      };
    }
    case 'ADJUST_PORTION': {
      const draft = applyPortionAdjustment(
        state.draft,
        action.field,
        action.delta,
        action.maxQuantity,
      );
      if (draft === state.draft) return state;
      return {
        ...state,
        draft,
        successMessage: null,
        submitError: null,
        submitStatus: state.submitStatus === 'failed' ? 'idle' : state.submitStatus,
        uiStep: 'edit',
      };
    }
    case 'RESET_DRAFT':
      return {
        ...state,
        draft: createEmptyDraft(),
        successMessage: null,
        submitError: null,
        submitStatus: 'idle',
        uiStep: 'edit',
      };
    case 'ENTER_REVIEW':
      return { ...state, uiStep: 'review', submitError: null };
    case 'EXIT_REVIEW':
      return { ...state, uiStep: 'edit', submitError: null };
    case 'SUBMIT_START':
      return { ...state, submitStatus: 'sending', submitError: null, successMessage: null };
    case 'SUBMIT_FAILURE':
      return {
        ...state,
        submitStatus: 'failed',
        submitError: action.message,
        successMessage: null,
      };
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        draft: {
          mealChoice: action.savedSnapshot.mealChoice,
          mainQuantity: action.savedSnapshot.mainQuantity,
          vegetarianQuantity: action.savedSnapshot.vegetarianQuantity,
          soupQuantity: action.savedSnapshot.soupQuantity,
          dessertQuantity: action.savedSnapshot.dessertQuantity,
        },
        savedSnapshot: action.savedSnapshot,
        successMessage: action.message,
        submitStatus: 'success',
        submitError: null,
        uiStep: 'review',
      };
    case 'RESTORE':
      return {
        draft: { ...action.draft },
        savedSnapshot: action.savedSnapshot,
        successMessage: null,
        uiStep: 'review',
        submitStatus: 'success',
        submitError: null,
      };
    case 'CLEAR_SUCCESS':
      return { ...state, successMessage: null };
    default:
      return state;
  }
}

function buildSuccessMessage(
  lunchDate: string,
  summaryLines: MealSummaryLine[],
  submittedAt: string,
): string {
  const mealSummary = summaryLines.map((line) => `${line.label}: ${line.detail}`).join('; ');
  return `Submitted for ${formatDisplayDate(lunchDate)}. ${mealSummary}. Time ${formatSubmissionTime(submittedAt)} Helsinki.`;
}

export function useLunchSelection(clock: Clock = systemClock) {
  const [state, dispatch] = useReducer(lunchReducer, undefined, createInitialState);
  const [initialized, setInitialized] = useState(false);
  const [now, setNow] = useState(() => clock());
  /** Locked for the page session — midnight rollover is @pending and must not silently change. */
  const [lunchDate, setLunchDate] = useState<string | null>(null);
  const [calendarUnavailable, setCalendarUnavailable] = useState(false);

  const embedded = isGameBusEmbed();
  const { taskReady, hasPosted: gameBusPosted } = useGameBusEmbed();

  useEffect(() => {
    const interval = window.setInterval(() => setNow(clock()), 1_000);
    return () => window.clearInterval(interval);
  }, [clock]);

  useEffect(() => {
    if (lunchDate !== null || calendarUnavailable) {
      return;
    }
    const resolved = tryResolveStudentLunchServiceDate(clock());
    if (resolved.ok) {
      setLunchDate(resolved.lunchDate);
    } else {
      setCalendarUnavailable(true);
    }
  }, [lunchDate, calendarUnavailable, clock, now]);

  const menuAvailability = useMemo(
    () => (lunchDate ? resolveMenuForDate(lunchDate) : { status: 'unavailable' as const }),
    [lunchDate],
  );
  const mealSlots = useMemo(
    () => (lunchDate ? resolveMealSlotsForDate(lunchDate) : null),
    [lunchDate],
  );
  const menuCycleWeek =
    menuAvailability.status === 'available' ? menuAvailability.menuCycleWeek : 0;
  const menuVersion =
    menuAvailability.status === 'available' ? menuAvailability.menuVersion : '';

  useEffect(() => {
    if (!lunchDate || menuAvailability.status !== 'available' || !mealSlots) {
      setInitialized(true);
      return;
    }

    const saved = embedded
      ? null
      : declarationRepository.getDeclaration(CANTEEN_CONFIG.studentId, lunchDate);
    if (saved) {
      const savedSnapshot = snapshotFromDeclaration(saved, mealSlots);
      dispatch({
        type: 'RESTORE',
        savedSnapshot,
        draft: {
          mealChoice: savedSnapshot.mealChoice,
          mainQuantity: savedSnapshot.mainQuantity,
          vegetarianQuantity: savedSnapshot.vegetarianQuantity,
          soupQuantity: savedSnapshot.soupQuantity,
          dessertQuantity: savedSnapshot.dessertQuantity,
        },
      });
    }
    setInitialized(true);
  }, [lunchDate, menuAvailability.status, mealSlots, embedded]);

  const submissionWindow = useMemo(
    () =>
      lunchDate
        ? getSubmissionWindowStatus(now, lunchDate)
        : {
            phase: 'closed' as const,
            countdownTargetIso: null,
            message: 'Submission closed',
            detailLines: ['Lunch selection is unavailable.'],
          },
    [now, lunchDate],
  );

  const selections: SelectionEntry[] = useMemo(() => {
    if (!mealSlots || state.draft.mealChoice === null || state.draft.mealChoice === 'no_lunch') {
      return [];
    }
    return buildSelectionsFromMealDraft(state.draft, mealSlots);
  }, [state.draft, mealSlots]);

  const summaryLines: MealSummaryLine[] = useMemo(() => {
    if (!mealSlots) return [];
    return buildMealSummary(state.draft, mealSlots);
  }, [state.draft, mealSlots]);

  const hasSavedDeclaration = state.savedSnapshot !== null || gameBusPosted;
  const canSubmitContent = canSubmitMealDraft(state.draft);
  const submissionOpen = lunchDate ? isSubmissionAllowed(now, lunchDate) : false;
  const menuInteractive =
    Boolean(lunchDate) &&
    menuAvailability.status === 'available' &&
    submissionOpen &&
    !hasSavedDeclaration &&
    mealSlots !== null &&
    state.submitStatus !== 'sending' &&
    state.uiStep === 'edit';

  const isReviewDisabled =
    !submissionOpen ||
    hasSavedDeclaration ||
    !canSubmitContent ||
    mealSlots === null ||
    menuAvailability.status !== 'available' ||
    (embedded && !taskReady) ||
    state.submitStatus === 'sending';

  const isConfirmDisabled =
    isReviewDisabled || state.uiStep !== 'review' || state.submitStatus === 'sending';

  const activateMealChoice = useCallback((choice: MealChoice) => {
    dispatch({ type: 'ACTIVATE_MEAL_CHOICE', choice });
  }, []);

  const adjustPortion = useCallback(
    (field: PortionField, delta: number) => {
      if (!mealSlots) return;
      const maxByField: Record<PortionField, number> = {
        main: mealSlots.main.maxQuantity,
        vegetarian: mealSlots.vegetarian.maxQuantity,
        soup: mealSlots.soup.maxQuantity,
        dessert: mealSlots.dessert.maxQuantity,
      };
      dispatch({
        type: 'ADJUST_PORTION',
        field,
        delta,
        maxQuantity: maxByField[field],
      });
    },
    [mealSlots],
  );

  const resetDraft = useCallback(() => {
    dispatch({ type: 'RESET_DRAFT' });
  }, []);

  const enterReview = useCallback(() => {
    if (isReviewDisabled) return;
    dispatch({ type: 'ENTER_REVIEW' });
  }, [isReviewDisabled]);

  const exitReview = useCallback(() => {
    if (hasSavedDeclaration || state.submitStatus === 'sending') return;
    dispatch({ type: 'EXIT_REVIEW' });
  }, [hasSavedDeclaration, state.submitStatus]);

  const submit = useCallback(() => {
    if (!lunchDate || !mealSlots) return;
    if (
      hasSavedDeclaration ||
      !canSubmitContent ||
      menuAvailability.status !== 'available' ||
      (embedded && !taskReady) ||
      state.submitStatus === 'sending' ||
      state.uiStep !== 'review'
    ) {
      return;
    }

    if (!isSubmissionAllowed(clock(), lunchDate)) {
      dispatch({
        type: 'SUBMIT_FAILURE',
        message: 'Submission closed at 23:59 Helsinki time.',
      });
      return;
    }

    dispatch({ type: 'SUBMIT_START' });

    const declaration = createDeclarationFromDraft(
      state.draft,
      mealSlots,
      lunchDate,
      menuCycleWeek,
      menuVersion,
      clock,
    );
    if (!declaration) {
      dispatch({
        type: 'SUBMIT_FAILURE',
        message: 'Submission could not be created. Check the deadline and try again.',
      });
      return;
    }

    const successMessage = buildSuccessMessage(
      lunchDate,
      buildMealSummary(state.draft, mealSlots),
      declaration.submittedAt,
    );

    if (embedded) {
      const result = tryPostActivity(declaration, state.draft, mealSlots);
      logStudentTryPostActivityResult(result);
      if (!result.ok) {
        gamebusDevLog('ACTIVITY not sent', { reason: result.reason });
        dispatch({
          type: 'SUBMIT_FAILURE',
          message:
            result.reason === 'duplicate'
              ? 'This declaration was already submitted.'
              : 'Could not record the declaration. Your choices are still here — try again.',
        });
        return;
      }
      const savedSnapshot = snapshotFromDeclaration(declaration, mealSlots);
      dispatch({
        type: 'SUBMIT_SUCCESS',
        savedSnapshot,
        message: successMessage,
      });
      return;
    }

    try {
      declarationRepository.upsertDeclaration(declaration);
    } catch {
      dispatch({
        type: 'SUBMIT_FAILURE',
        message: 'Could not record the declaration. Your choices are still here — try again.',
      });
      return;
    }

    const savedSnapshot = snapshotFromDeclaration(declaration, mealSlots);
    dispatch({
      type: 'SUBMIT_SUCCESS',
      savedSnapshot,
      message: successMessage,
    });
  }, [
    lunchDate,
    mealSlots,
    submissionOpen,
    hasSavedDeclaration,
    canSubmitContent,
    menuAvailability.status,
    embedded,
    taskReady,
    state.submitStatus,
    state.uiStep,
    state.draft,
    menuCycleWeek,
    menuVersion,
    clock,
  ]);

  const clearSuccess = useCallback(() => {
    dispatch({ type: 'CLEAR_SUCCESS' });
  }, []);

  return {
    state,
    draft: state.draft,
    selections,
    summaryLines,
    hasSavedDeclaration,
    isSubmitDisabled: isConfirmDisabled,
    isReviewDisabled,
    initialized,
    lunchDate,
    calendarUnavailable,
    menuAvailability,
    mealSlots,
    submissionWindow,
    menuInteractive,
    uiStep: state.uiStep,
    submitStatus: state.submitStatus,
    submitError: state.submitError,
    activateMealChoice,
    adjustPortion,
    resetDraft,
    enterReview,
    exitReview,
    submit,
    clearSuccess,
    now,
  };
}
