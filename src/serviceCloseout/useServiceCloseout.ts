import { useReducer, useCallback, useMemo, useEffect } from 'react';
import { isGameBusEmbed, tryPostCloseoutActivity, useGameBusEmbed } from '../gamebus';
import { gamebusDevLog } from '../gamebus/devLog';
import { resolveMenuForDate } from '../services/menuResolver';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import type { CloseoutAccessPolicy } from './accessPolicy';
import { developmentCloseoutAccessPolicy } from './accessPolicyDevelopment';
import { getHeadChefOptionsForDate } from './fixtures/staffRotation';
import { resolveCloseoutServiceDate } from './closeoutServiceDate';
import { normalizeServiceCloseout } from './normalize';
import { normalizeCloseoutKg, type NormalizedServiceCloseout } from './operationalRecord';
import { developmentPortionWeightProvider } from './portionWeight';
import {
  CLOSEOUT_CATEGORY_KEYS,
  createEmptyCloseoutDraft,
  isCloseoutDraftComplete,
  type CloseoutCategoryKey,
  type CloseoutFormStatus,
  type ServiceCloseout,
  type ServiceCloseoutDraft,
} from './types';
import {
  validateOverproductionAgainstPrepared,
  validateCloseoutQuantity,
} from './validation';
import { getPortionWeightGrams } from './portionWeight';

export type Clock = () => Date;

type CategoryFieldErrors = {
  prepared: string | null;
  waste: string | null;
};

export interface ServiceCloseoutState {
  draft: ServiceCloseoutDraft;
  customersError: string | null;
  categoryErrors: Record<CloseoutCategoryKey, CategoryFieldErrors>;
  status: CloseoutFormStatus;
  finalizedCloseout: ServiceCloseout | null;
  finalizedNormalizedCloseout: NormalizedServiceCloseout | null;
  finalizeError: string | null;
}

type CategoryErrorField = 'prepared' | 'waste';

type CloseoutAction =
  | { type: 'SET_ACTUAL_CUSTOMERS'; value: number | null }
  | { type: 'SET_HEAD_CHEF'; value: string | null }
  | { type: 'SET_PREPARED'; category: CloseoutCategoryKey; value: number | null }
  | { type: 'SET_WASTE'; category: CloseoutCategoryKey; value: number | null }
  | { type: 'SET_CUSTOMERS_ERROR'; error: string | null }
  | { type: 'SET_CATEGORY_ERROR'; category: CloseoutCategoryKey; field: CategoryErrorField; error: string | null }
  | { type: 'FINALIZE_SUCCESS'; closeout: ServiceCloseout; normalizedCloseout: NormalizedServiceCloseout }
  | { type: 'FINALIZE_ERROR'; error: string };

function createInitialState(): ServiceCloseoutState {
  const emptyErrors = (): CategoryFieldErrors => ({ prepared: null, waste: null });
  return {
    draft: createEmptyCloseoutDraft(),
    customersError: null,
    categoryErrors: {
      main: emptyErrors(),
      vegetarian: emptyErrors(),
      soup: emptyErrors(),
      dessert: emptyErrors(),
    },
    status: 'draft',
    finalizedCloseout: null,
    finalizedNormalizedCloseout: null,
    finalizeError: null,
  };
}

function closeoutReducer(state: ServiceCloseoutState, action: CloseoutAction): ServiceCloseoutState {
  switch (action.type) {
    case 'SET_ACTUAL_CUSTOMERS':
      return {
        ...state,
        draft: { ...state.draft, actualCustomers: action.value },
        finalizeError: null,
      };
    case 'SET_HEAD_CHEF':
      return {
        ...state,
        draft: { ...state.draft, headChefUserId: action.value },
        finalizeError: null,
      };
    case 'SET_PREPARED':
      return {
        ...state,
        draft: {
          ...state.draft,
          [action.category]: {
            ...state.draft[action.category],
            preparedQuantity: action.value,
          },
        },
        finalizeError: null,
      };
    case 'SET_WASTE':
      return {
        ...state,
        draft: {
          ...state.draft,
          [action.category]: {
            ...state.draft[action.category],
            overproductionGrams: action.value,
          },
        },
        finalizeError: null,
      };
    case 'SET_CUSTOMERS_ERROR':
      return { ...state, customersError: action.error };
    case 'SET_CATEGORY_ERROR':
      return {
        ...state,
        categoryErrors: {
          ...state.categoryErrors,
          [action.category]: {
            ...state.categoryErrors[action.category],
            [action.field]: action.error,
          },
        },
      };
    case 'FINALIZE_SUCCESS':
      return {
        ...state,
        status: 'finalized',
        finalizedCloseout: action.closeout,
        finalizedNormalizedCloseout: action.normalizedCloseout,
        finalizeError: null,
      };
    case 'FINALIZE_ERROR':
      return { ...state, finalizeError: action.error };
    default:
      return state;
  }
}

function deriveFormStatus(
  state: ServiceCloseoutState,
  formComplete: boolean,
  hasValidationErrors: boolean,
): CloseoutFormStatus {
  if (state.status === 'finalized') return 'finalized';
  if (formComplete && !hasValidationErrors) return 'ready';
  return 'draft';
}

export interface UseServiceCloseoutOptions {
  clock?: Clock;
  accessPolicy?: CloseoutAccessPolicy;
  serviceDate?: string;
}

export function useServiceCloseout(options: UseServiceCloseoutOptions = {}) {
  const clock = options.clock ?? (() => new Date());
  const accessPolicy = options.accessPolicy ?? developmentCloseoutAccessPolicy;
  const serviceDate = resolveCloseoutServiceDate(options.serviceDate);

  const menuAvailability = useMemo(() => resolveMenuForDate(serviceDate), [serviceDate]);
  const mealSlots = useMemo(() => resolveMealSlotsForDate(serviceDate), [serviceDate]);
  const headChefOptions = useMemo(() => getHeadChefOptionsForDate(serviceDate), [serviceDate]);

  const [state, dispatch] = useReducer(closeoutReducer, undefined, createInitialState);
  const embedded = isGameBusEmbed();
  const { taskReady, hasPosted: gameBusPosted } = useGameBusEmbed();

  const formComplete = isCloseoutDraftComplete(state.draft);

  const hasValidationErrors =
    state.customersError !== null ||
    CLOSEOUT_CATEGORY_KEYS.some(
      (key) =>
        state.categoryErrors[key].prepared !== null || state.categoryErrors[key].waste !== null,
    );

  const formStatus = deriveFormStatus(state, formComplete, hasValidationErrors);

  const menuReady = menuAvailability.status === 'available' && mealSlots !== null;
  const canFinalizeByPolicy = accessPolicy.canFinalizeService();
  const hasFinalized = state.status === 'finalized' || gameBusPosted;
  const formInteractive = menuReady && !hasFinalized && canFinalizeByPolicy;

  const isFinalizeDisabled =
    !menuReady ||
    hasFinalized ||
    !formComplete ||
    hasValidationErrors ||
    !canFinalizeByPolicy ||
    (embedded && !taskReady);

  const revalidateWaste = useCallback(
    (category: CloseoutCategoryKey, prepared: number | null, waste: number | null, itemId: string) => {
      if (prepared === null || waste === null) {
        dispatch({ type: 'SET_CATEGORY_ERROR', category, field: 'waste', error: null });
        return;
      }
      const portionWeight = getPortionWeightGrams(itemId, category);
      const result = validateOverproductionAgainstPrepared(prepared, portionWeight, waste);
      dispatch({
        type: 'SET_CATEGORY_ERROR',
        category,
        field: 'waste',
        error: result.ok ? null : result.error,
      });
    },
    [],
  );

  const setActualCustomers = useCallback((value: number | null) => {
    dispatch({ type: 'SET_ACTUAL_CUSTOMERS', value });
  }, []);

  const setCustomersError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_CUSTOMERS_ERROR', error });
  }, []);

  const setHeadChefUserId = useCallback((value: string | null) => {
    dispatch({ type: 'SET_HEAD_CHEF', value });
  }, []);

  const setPreparedQuantity = useCallback((category: CloseoutCategoryKey, value: number | null) => {
    dispatch({ type: 'SET_PREPARED', category, value });
  }, []);

  const setOverproductionGrams = useCallback((category: CloseoutCategoryKey, value: number | null) => {
    dispatch({ type: 'SET_WASTE', category, value });
  }, []);

  useEffect(() => {
    if (!mealSlots) return;
    for (const key of CLOSEOUT_CATEGORY_KEYS) {
      const prepared = state.draft[key].preparedQuantity;
      const waste = state.draft[key].overproductionGrams;
      if (prepared === null || waste === null) {
        continue;
      }
      revalidateWaste(key, prepared, waste, mealSlots[key].id);
    }
  }, [mealSlots, revalidateWaste, state.draft]);

  const setPreparedError = useCallback(
    (category: CloseoutCategoryKey, error: string | null) => {
      dispatch({ type: 'SET_CATEGORY_ERROR', category, field: 'prepared', error });
    },
    [],
  );

  const setWasteError = useCallback(
    (category: CloseoutCategoryKey, error: string | null) => {
      dispatch({ type: 'SET_CATEGORY_ERROR', category, field: 'waste', error });
    },
    [],
  );

  const finalize = useCallback(() => {
    if (isFinalizeDisabled || !mealSlots || hasFinalized) return;

    if (!isCloseoutDraftComplete(state.draft)) {
      dispatch({ type: 'FINALIZE_ERROR', error: 'Form is incomplete.' });
      return;
    }

    for (const key of CLOSEOUT_CATEGORY_KEYS) {
      const prepared = state.draft[key].preparedQuantity as number;
      const waste = state.draft[key].overproductionGrams as number;
      const portionWeight = getPortionWeightGrams(mealSlots[key].id, key);
      const wasteCheck = validateOverproductionAgainstPrepared(prepared, portionWeight, waste);
      if (!wasteCheck.ok) {
        dispatch({ type: 'SET_CATEGORY_ERROR', category: key, field: 'waste', error: wasteCheck.error });
        dispatch({ type: 'FINALIZE_ERROR', error: wasteCheck.error });
        return;
      }
    }

    const customersCheck = validateCloseoutQuantity(
      state.draft.actualCustomers as number,
      'Actual customers',
    );
    if (!customersCheck.ok) {
      dispatch({ type: 'SET_CUSTOMERS_ERROR', error: customersCheck.error });
      return;
    }

    const closeout = normalizeServiceCloseout(
      state.draft,
      serviceDate,
      mealSlots,
      developmentPortionWeightProvider,
      clock().toISOString(),
    );
    const normalizedCloseout = normalizeCloseoutKg(closeout);

    if (embedded) {
      const result = tryPostCloseoutActivity(closeout);
      if (!result.ok) {
        gamebusDevLog('ACTIVITY not sent', { reason: result.reason });
        dispatch({
          type: 'FINALIZE_ERROR',
          error: result.reason === 'no_task' ? 'Waiting for GameBus task…' : 'Submission failed.',
        });
        return;
      }
    }

    dispatch({ type: 'FINALIZE_SUCCESS', closeout, normalizedCloseout });
  }, [clock, embedded, hasFinalized, isFinalizeDisabled, mealSlots, serviceDate, state.draft]);

  return {
    state,
    draft: state.draft,
    serviceDate,
    menuAvailability,
    mealSlots,
    headChefOptions,
    formComplete,
    formStatus,
    hasValidationErrors,
    formInteractive,
    isFinalizeDisabled,
    canFinalizeByPolicy,
    finalizedCloseout: state.finalizedCloseout,
    finalizedNormalizedCloseout: state.finalizedNormalizedCloseout,
    finalizeError: state.finalizeError,
    setActualCustomers,
    setCustomersError,
    setHeadChefUserId,
    setPreparedQuantity,
    setOverproductionGrams,
    setPreparedError,
    setWasteError,
    finalize,
    accessPolicy,
  };
}
