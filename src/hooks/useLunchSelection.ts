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
import { getTomorrowIsoDate, formatDisplayDate } from '../utils/dates';
import { formatToastPointsMessage } from '../utils/points';
import type { MealChoice } from '../types/mealChoice';
import type { SelectionEntry } from '../types/menu';
import type { MealSummaryLine } from '../utils/mealChoice';

export interface LunchSelectionState {
  draft: DraftSnapshot;
  savedSnapshot: SavedSnapshot | null;
  successMessage: string | null;
  successPointsMessage: string | null;
}

type LunchAction =
  | { type: 'ACTIVATE_MEAL_CHOICE'; choice: MealChoice }
  | { type: 'ADJUST_PORTION'; field: PortionField; delta: number; maxQuantity: number }
  | { type: 'RESET_DRAFT' }
  | { type: 'SUBMIT_SUCCESS'; savedSnapshot: SavedSnapshot; message: string; pointsMessage: string }
  | { type: 'RESTORE'; savedSnapshot: SavedSnapshot; draft: DraftSnapshot }
  | { type: 'CLEAR_SUCCESS' };

function createInitialState(): LunchSelectionState {
  return {
    draft: createEmptyDraft(),
    savedSnapshot: null,
    successMessage: null,
    successPointsMessage: null,
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
        successPointsMessage: null,
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
        successPointsMessage: null,
      };
    }
    case 'RESET_DRAFT':
      return {
        ...state,
        draft: createEmptyDraft(),
        successMessage: null,
        successPointsMessage: null,
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
        successPointsMessage: action.pointsMessage,
      };
    case 'RESTORE':
      return {
        draft: { ...action.draft },
        savedSnapshot: action.savedSnapshot,
        successMessage: null,
        successPointsMessage: null,
      };
    case 'CLEAR_SUCCESS':
      return { ...state, successMessage: null, successPointsMessage: null };
    default:
      return state;
  }
}

export function useLunchSelection(clock: Clock = systemClock) {
  const lunchDate = getTomorrowIsoDate();
  const menuAvailability = useMemo(() => resolveMenuForDate(lunchDate), [lunchDate]);
  const mealSlots = useMemo(() => resolveMealSlotsForDate(lunchDate), [lunchDate]);
  const menuCycleWeek =
    menuAvailability.status === 'available' ? menuAvailability.menuCycleWeek : 0;
  const menuVersion =
    menuAvailability.status === 'available' ? menuAvailability.menuVersion : '';

  const [state, dispatch] = useReducer(lunchReducer, undefined, createInitialState);
  const [initialized, setInitialized] = useState(false);
  const [now, setNow] = useState(() => clock());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(clock()), 30_000);
    return () => window.clearInterval(interval);
  }, [clock]);

  useEffect(() => {
    if (menuAvailability.status !== 'available' || !mealSlots) {
      setInitialized(true);
      return;
    }

    const saved = declarationRepository.getDeclaration(CANTEEN_CONFIG.studentId, lunchDate);
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
  }, [lunchDate, menuAvailability.status, mealSlots]);

  const submissionWindow = useMemo(
    () => getSubmissionWindowStatus(now, lunchDate),
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

  const hasSavedDeclaration = state.savedSnapshot !== null;
  const canSubmitContent = canSubmitMealDraft(state.draft);
  const submissionOpen = isSubmissionAllowed(now, lunchDate);
  const menuInteractive =
    menuAvailability.status === 'available' &&
    submissionOpen &&
    !hasSavedDeclaration &&
    mealSlots !== null;

  const isSubmitDisabled =
    !submissionOpen ||
    hasSavedDeclaration ||
    !canSubmitContent ||
    mealSlots === null ||
    menuAvailability.status !== 'available';

  const savedScoring = useMemo(() => {
    if (!state.savedSnapshot) return null;
    return {
      basePoints: state.savedSnapshot.basePoints,
      timingAdjustment: state.savedSnapshot.timingAdjustment,
      totalPoints: state.savedSnapshot.totalPoints,
      timingStatus: state.savedSnapshot.timingStatus,
    };
  }, [state.savedSnapshot]);

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

  const submit = useCallback(() => {
    if (isSubmitDisabled || !mealSlots) return;

    const declaration = createDeclarationFromDraft(
      state.draft,
      mealSlots,
      lunchDate,
      menuCycleWeek,
      menuVersion,
      clock,
    );
    if (!declaration) return;

    declarationRepository.upsertDeclaration(declaration);
    const savedSnapshot = snapshotFromDeclaration(declaration, mealSlots);
    dispatch({
      type: 'SUBMIT_SUCCESS',
      savedSnapshot,
      message: `Your lunch declaration for ${formatDisplayDate(lunchDate)} is final.`,
      pointsMessage: formatToastPointsMessage({
        basePoints: declaration.basePoints,
        timingAdjustment: declaration.timingAdjustment,
        totalPoints: declaration.totalPoints,
        timingStatus: declaration.timingStatus,
      }),
    });
  }, [
    isSubmitDisabled,
    mealSlots,
    state.draft,
    lunchDate,
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
    isSubmitDisabled,
    savedScoring,
    initialized,
    lunchDate,
    menuAvailability,
    mealSlots,
    submissionWindow,
    menuInteractive,
    activateMealChoice,
    adjustPortion,
    resetDraft,
    submit,
    clearSuccess,
    now,
  };
}
