import { useReducer, useCallback, useMemo, useEffect, useState } from 'react';
import { CANTEEN_CONFIG } from '../config/canteen';
import { resolveMenuForDate } from '../services/menuResolver';
import {
  declarationRepository,
  buildInitialQuantities,
  buildSelections,
  snapshotFromDeclaration,
  getSubmitButtonState,
  createDeclarationFromDraft,
  reconcileDraftWithMenu,
  isDraftDirty,
  type SavedSnapshot,
  type DraftSnapshot,
} from '../utils/declaration';
import { isSubmitDisabled as computeSubmitDisabled } from '../utils/declarationSelection';
import {
  getSubmissionWindowStatus,
  isSubmissionAllowed,
  requiresLateUpdateConfirmation,
  systemClock,
  type Clock,
} from '../services/submissionWindow';
import { getTomorrowIsoDate, formatDisplayDate } from '../utils/dates';
import { formatToastPointsMessage } from '../utils/points';
import type { MenuItem } from '../types/menu';

export interface LunchSelectionState {
  quantities: Record<string, number>;
  noLunch: boolean;
  savedSnapshot: SavedSnapshot | null;
  successMessage: string | null;
  successPointsMessage: string | null;
  menuChanged: boolean;
  showLateConfirm: boolean;
}

type LunchAction =
  | { type: 'SET_QUANTITY'; itemId: string; quantity: number; maxQuantity: number }
  | { type: 'INCREMENT'; itemId: string; maxQuantity: number }
  | { type: 'DECREMENT'; itemId: string; maxQuantity: number }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'SET_NO_LUNCH'; active: boolean; menuItems: MenuItem[] }
  | { type: 'RESET_DRAFT'; menuItems: MenuItem[] }
  | { type: 'SUBMIT_SUCCESS'; savedSnapshot: SavedSnapshot; message: string; pointsMessage: string }
  | { type: 'RESTORE'; savedSnapshot: SavedSnapshot; draft: DraftSnapshot; menuChanged: boolean }
  | { type: 'CLEAR_SUCCESS' }
  | { type: 'SHOW_LATE_CONFIRM' }
  | { type: 'HIDE_LATE_CONFIRM' };

function clampQuantity(quantity: number, maxQuantity: number): number {
  return Math.max(0, Math.min(quantity, maxQuantity));
}

function createEmptyDraft(menuItems: MenuItem[]): LunchSelectionState {
  return {
    quantities: buildInitialQuantities(menuItems),
    noLunch: false,
    savedSnapshot: null,
    successMessage: null,
    successPointsMessage: null,
    menuChanged: false,
    showLateConfirm: false,
  };
}

function lunchReducer(state: LunchSelectionState, action: LunchAction): LunchSelectionState {
  switch (action.type) {
    case 'SET_QUANTITY': {
      const quantity = clampQuantity(action.quantity, action.maxQuantity);
      return {
        ...state,
        quantities: { ...state.quantities, [action.itemId]: quantity },
        noLunch: quantity > 0 ? false : state.noLunch,
        successMessage: null,
        successPointsMessage: null,
      };
    }
    case 'INCREMENT': {
      const current = state.quantities[action.itemId] ?? 0;
      const quantity = clampQuantity(current + 1, action.maxQuantity);
      return {
        ...state,
        quantities: { ...state.quantities, [action.itemId]: quantity },
        noLunch: false,
        successMessage: null,
        successPointsMessage: null,
      };
    }
    case 'DECREMENT': {
      const current = state.quantities[action.itemId] ?? 0;
      const quantity = clampQuantity(current - 1, action.maxQuantity);
      return {
        ...state,
        quantities: { ...state.quantities, [action.itemId]: quantity },
        successMessage: null,
        successPointsMessage: null,
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        quantities: { ...state.quantities, [action.itemId]: 0 },
        successMessage: null,
        successPointsMessage: null,
      };
    case 'SET_NO_LUNCH':
      if (action.active) {
        return {
          ...state,
          noLunch: true,
          quantities: buildInitialQuantities(action.menuItems),
          successMessage: null,
          successPointsMessage: null,
        };
      }
      return { ...state, noLunch: false, successMessage: null, successPointsMessage: null };
    case 'RESET_DRAFT':
      return {
        ...state,
        quantities: buildInitialQuantities(action.menuItems),
        noLunch: false,
        successMessage: null,
        successPointsMessage: null,
        showLateConfirm: false,
      };
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        quantities: { ...action.savedSnapshot.quantities },
        noLunch: action.savedSnapshot.noLunch,
        savedSnapshot: action.savedSnapshot,
        successMessage: action.message,
        successPointsMessage: action.pointsMessage,
        menuChanged: false,
        showLateConfirm: false,
      };
    case 'RESTORE':
      return {
        quantities: { ...action.draft.quantities },
        noLunch: action.draft.noLunch,
        savedSnapshot: action.savedSnapshot,
        successMessage: null,
        successPointsMessage: null,
        menuChanged: action.menuChanged,
        showLateConfirm: false,
      };
    case 'CLEAR_SUCCESS':
      return { ...state, successMessage: null, successPointsMessage: null };
    case 'SHOW_LATE_CONFIRM':
      return { ...state, showLateConfirm: true };
    case 'HIDE_LATE_CONFIRM':
      return { ...state, showLateConfirm: false };
    default:
      return state;
  }
}

export function useLunchSelection(clock: Clock = systemClock) {
  const lunchDate = getTomorrowIsoDate();
  const menuAvailability = useMemo(() => resolveMenuForDate(lunchDate), [lunchDate]);
  const menuItems = menuAvailability.status === 'available' ? menuAvailability.items : [];
  const menuCycleWeek =
    menuAvailability.status === 'available' ? menuAvailability.menuCycleWeek : 0;
  const menuVersion =
    menuAvailability.status === 'available' ? menuAvailability.menuVersion : '';

  const [state, dispatch] = useReducer(
    lunchReducer,
    menuItems,
    (items) => createEmptyDraft(items),
  );
  const [initialized, setInitialized] = useState(false);
  const [now, setNow] = useState(() => clock());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(clock()), 30_000);
    return () => window.clearInterval(interval);
  }, [clock]);

  useEffect(() => {
    if (menuAvailability.status !== 'available') {
      setInitialized(true);
      return;
    }

    const saved = declarationRepository.getDeclaration(CANTEEN_CONFIG.studentId, lunchDate);
    if (saved) {
      const savedSnapshot = snapshotFromDeclaration(saved, menuItems);
      const { draft, menuChanged } = reconcileDraftWithMenu(
        savedSnapshot,
        savedSnapshot,
        menuItems,
        menuVersion,
      );
      dispatch({
        type: 'RESTORE',
        savedSnapshot,
        draft,
        menuChanged,
      });
    }
    setInitialized(true);
  }, [lunchDate, menuAvailability.status, menuItems, menuVersion]);

  const submissionWindow = useMemo(
    () => getSubmissionWindowStatus(now, lunchDate),
    [now, lunchDate],
  );

  const selections = useMemo(
    () => buildSelections(state.quantities, menuItems),
    [state.quantities, menuItems],
  );

  const summary = useMemo(() => {
    const itemCount = selections.length;
    const totalPortions = selections.reduce((sum, selection) => sum + selection.quantity, 0);
    return { itemCount, totalPortions };
  }, [selections]);

  const maxPossiblePortions = useMemo(
    () => menuItems.reduce((sum, item) => sum + item.maxQuantity, 0),
    [menuItems],
  );

  const progressPercent = useMemo(() => {
    if (state.noLunch) return 100;
    if (maxPossiblePortions === 0) return 0;
    return Math.min(100, (summary.totalPortions / maxPossiblePortions) * 100);
  }, [summary.totalPortions, maxPossiblePortions, state.noLunch]);

  const hasSavedDeclaration = state.savedSnapshot !== null;

  const isDirty = useMemo(() => {
    const draft: DraftSnapshot = {
      quantities: state.quantities,
      noLunch: state.noLunch,
    };
    return isDraftDirty(draft, state.savedSnapshot);
  }, [state.quantities, state.noLunch, state.savedSnapshot]);

  const canSubmitContent = state.noLunch || selections.length > 0;
  const submissionOpen = isSubmissionAllowed(now, lunchDate);
  const menuInteractive =
    menuAvailability.status === 'available' && submissionOpen;

  const submitButtonState = getSubmitButtonState(hasSavedDeclaration);
  const isSubmitDisabled = computeSubmitDisabled(
    hasSavedDeclaration,
    isDirty,
    state.menuChanged,
    canSubmitContent,
    menuInteractive,
  );

  const savedScoring = useMemo(() => {
    if (!state.savedSnapshot) return null;
    return {
      basePoints: state.savedSnapshot.basePoints,
      timingAdjustment: state.savedSnapshot.timingAdjustment,
      totalPoints: state.savedSnapshot.totalPoints,
      timingStatus: state.savedSnapshot.timingStatus,
    };
  }, [state.savedSnapshot]);

  const getMaxQuantity = useCallback(
    (itemId: string) => menuItems.find((item) => item.id === itemId)?.maxQuantity ?? 0,
    [menuItems],
  );

  const getQuantity = useCallback(
    (itemId: string) => state.quantities[itemId] ?? 0,
    [state.quantities],
  );

  const increment = useCallback(
    (itemId: string) => {
      dispatch({ type: 'INCREMENT', itemId, maxQuantity: getMaxQuantity(itemId) });
    },
    [getMaxQuantity],
  );

  const decrement = useCallback(
    (itemId: string) => {
      dispatch({ type: 'DECREMENT', itemId, maxQuantity: getMaxQuantity(itemId) });
    },
    [getMaxQuantity],
  );

  const removeItem = useCallback((itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', itemId });
  }, []);

  const setNoLunch = useCallback(
    (active: boolean) => {
      dispatch({ type: 'SET_NO_LUNCH', active, menuItems });
    },
    [menuItems],
  );

  const resetDraft = useCallback(() => {
    dispatch({ type: 'RESET_DRAFT', menuItems });
  }, [menuItems]);

  const performSubmit = useCallback(() => {
    const draft: DraftSnapshot = {
      quantities: state.quantities,
      noLunch: state.noLunch,
    };
    const existing = declarationRepository.getDeclaration(CANTEEN_CONFIG.studentId, lunchDate);
    const declaration = createDeclarationFromDraft(
      draft,
      menuItems,
      lunchDate,
      menuCycleWeek,
      menuVersion,
      existing,
      clock,
    );
    if (!declaration) return;

    declarationRepository.upsertDeclaration(declaration);
    const savedSnapshot = snapshotFromDeclaration(declaration, menuItems);
    dispatch({
      type: 'SUBMIT_SUCCESS',
      savedSnapshot,
      message: `Your active lunch declaration for ${formatDisplayDate(lunchDate)} has been saved.`,
      pointsMessage: formatToastPointsMessage({
        basePoints: declaration.basePoints,
        timingAdjustment: declaration.timingAdjustment,
        totalPoints: declaration.totalPoints,
        timingStatus: declaration.timingStatus,
      }),
    });
  }, [state.quantities, state.noLunch, menuItems, lunchDate, menuCycleWeek, menuVersion, clock]);

  const submit = useCallback(() => {
    if (isSubmitDisabled) return;

    const savedTimingStatus = state.savedSnapshot?.timingStatus;
    if (
      savedTimingStatus !== undefined &&
      requiresLateUpdateConfirmation(savedTimingStatus, now, lunchDate)
    ) {
      dispatch({ type: 'SHOW_LATE_CONFIRM' });
      return;
    }

    performSubmit();
  }, [isSubmitDisabled, state.savedSnapshot?.timingStatus, now, lunchDate, performSubmit]);

  const confirmLateUpdate = useCallback(() => {
    performSubmit();
  }, [performSubmit]);

  const cancelLateUpdate = useCallback(() => {
    dispatch({ type: 'HIDE_LATE_CONFIRM' });
  }, []);

  const clearSuccess = useCallback(() => {
    dispatch({ type: 'CLEAR_SUCCESS' });
  }, []);

  return {
    state,
    selections,
    summary,
    progressPercent,
    hasSavedDeclaration,
    isDirty,
    submitButtonState,
    isSubmitDisabled,
    savedScoring,
    initialized,
    lunchDate,
    menuAvailability,
    menuItems,
    submissionWindow,
    menuInteractive,
    getQuantity,
    increment,
    decrement,
    removeItem,
    setNoLunch,
    resetDraft,
    submit,
    confirmLateUpdate,
    cancelLateUpdate,
    clearSuccess,
    now,
  };
}
