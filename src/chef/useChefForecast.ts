import { useReducer, useCallback, useMemo, useEffect, useState } from 'react';
import { resolveMenuForDate } from '../services/menuResolver';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import {
  resolveChefForecastServiceDate,
  OperationalCalendarError,
} from '../services/operationalServiceCalendar';
import { isGameBusEmbed, tryPostChefActivity, useGameBusEmbed } from '../gamebus';
import { gamebusDevLog } from '../gamebus/devLog';
import {
  getChefSubmissionWindowStatus,
  isChefSubmissionAllowed,
  createChefForecastSubmission,
} from './chefSubmissionWindow';
import { isAllZeroForecast } from './chefSummary';
import {
  createEmptyChefDraft,
  isChefForecastComplete,
  type ChefForecastDraft,
} from './types';
import {
  systemClock,
  type Clock,
} from '../services/submissionWindow';

type FieldKey = 'expectedCustomers' | 'main' | 'vegetarian' | 'soup' | 'dessert';

export interface ChefForecastState {
  draft: ChefForecastDraft;
  fieldErrors: Partial<Record<FieldKey, string>>;
  customersError: string | null;
  notesError: string | null;
  zeroConfirmOpen: boolean;
  submitted: boolean;
  submitError: string | null;
}

type ChefAction =
  | { type: 'SET_EXPECTED_CUSTOMERS'; value: number | null }
  | { type: 'SET_MAIN'; value: number | null }
  | { type: 'SET_VEGETARIAN'; value: number | null }
  | { type: 'SET_SOUP'; value: number | null }
  | { type: 'SET_DESSERT'; value: number | null }
  | { type: 'SET_CONFIDENCE'; value: number | null }
  | { type: 'SET_NOTES'; value: string }
  | { type: 'SET_FIELD_ERROR'; field: FieldKey; error: string | null }
  | { type: 'SET_CUSTOMERS_ERROR'; error: string | null }
  | { type: 'SET_NOTES_ERROR'; error: string | null }
  | { type: 'SHOW_ZERO_CONFIRM' }
  | { type: 'HIDE_ZERO_CONFIRM' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string };

function createInitialState(): ChefForecastState {
  return {
    draft: createEmptyChefDraft(),
    fieldErrors: {},
    customersError: null,
    notesError: null,
    zeroConfirmOpen: false,
    submitted: false,
    submitError: null,
  };
}

function chefReducer(state: ChefForecastState, action: ChefAction): ChefForecastState {
  switch (action.type) {
    case 'SET_EXPECTED_CUSTOMERS':
      return {
        ...state,
        draft: { ...state.draft, expectedCustomers: action.value },
        submitError: null,
      };
    case 'SET_MAIN':
      return { ...state, draft: { ...state.draft, mainQuantity: action.value }, submitError: null };
    case 'SET_VEGETARIAN':
      return {
        ...state,
        draft: { ...state.draft, vegetarianQuantity: action.value },
        submitError: null,
      };
    case 'SET_SOUP':
      return { ...state, draft: { ...state.draft, soupQuantity: action.value }, submitError: null };
    case 'SET_DESSERT':
      return {
        ...state,
        draft: { ...state.draft, dessertQuantity: action.value },
        submitError: null,
      };
    case 'SET_CONFIDENCE':
      return {
        ...state,
        draft: { ...state.draft, confidence: action.value },
        submitError: null,
      };
    case 'SET_NOTES':
      return {
        ...state,
        draft: { ...state.draft, notes: action.value },
        submitError: null,
      };
    case 'SET_FIELD_ERROR':
      return {
        ...state,
        fieldErrors: { ...state.fieldErrors, [action.field]: action.error ?? undefined },
      };
    case 'SET_CUSTOMERS_ERROR':
      return { ...state, customersError: action.error };
    case 'SET_NOTES_ERROR':
      return { ...state, notesError: action.error };
    case 'SHOW_ZERO_CONFIRM':
      return { ...state, zeroConfirmOpen: true };
    case 'HIDE_ZERO_CONFIRM':
      return { ...state, zeroConfirmOpen: false };
    case 'SUBMIT_SUCCESS':
      return { ...state, submitted: true, submitError: null, zeroConfirmOpen: false };
    case 'SUBMIT_ERROR':
      return { ...state, submitError: action.error, zeroConfirmOpen: false };
    default:
      return state;
  }
}

export function useChefForecast(clock: Clock = systemClock) {
  const [state, dispatch] = useReducer(chefReducer, undefined, createInitialState);
  const [now, setNow] = useState(() => clock());
  const serviceDateResolution = useMemo(() => {
    try {
      return {
        status: 'resolved' as const,
        serviceDate: resolveChefForecastServiceDate(now),
      };
    } catch (error) {
      return {
        status: 'calendar_error' as const,
        message:
          error instanceof OperationalCalendarError
            ? error.message
            : 'Could not resolve the next service date.',
      };
    }
  }, [now]);

  const serviceDate =
    serviceDateResolution.status === 'resolved' ? serviceDateResolution.serviceDate : '';
  const menuAvailability = useMemo(
    () =>
      serviceDateResolution.status === 'resolved'
        ? resolveMenuForDate(serviceDate)
        : { status: 'unavailable' as const },
    [serviceDate, serviceDateResolution.status],
  );
  const mealSlots = useMemo(
    () => (serviceDateResolution.status === 'resolved' ? resolveMealSlotsForDate(serviceDate) : null),
    [serviceDate, serviceDateResolution.status],
  );
  const embedded = isGameBusEmbed();
  const { taskReady, hasPosted: gameBusPosted } = useGameBusEmbed();

  useEffect(() => {
    const interval = window.setInterval(() => setNow(clock()), 30_000);
    return () => window.clearInterval(interval);
  }, [clock]);

  const submissionWindow = useMemo(
    () => getChefSubmissionWindowStatus(now, serviceDate),
    [now, serviceDate],
  );

  const formComplete = isChefForecastComplete(state.draft);

  const hasValidationErrors =
    state.customersError !== null ||
    state.notesError !== null ||
    Object.values(state.fieldErrors).some((e) => e !== null && e !== undefined);

  const submissionOpen = isChefSubmissionAllowed(now, serviceDate);
  const hasSubmitted = state.submitted || gameBusPosted;

  const formInteractive =
    menuAvailability.status === 'available' &&
    submissionOpen &&
    !hasSubmitted &&
    mealSlots !== null;

  const isSubmitDisabled =
    !submissionOpen ||
    hasSubmitted ||
    mealSlots === null ||
    menuAvailability.status !== 'available' ||
    !formComplete ||
    hasValidationErrors ||
    (embedded && !taskReady);

  const setExpectedCustomers = useCallback((value: number | null) => {
    dispatch({ type: 'SET_EXPECTED_CUSTOMERS', value });
  }, []);

  const setMainQuantity = useCallback((value: number | null) => {
    dispatch({ type: 'SET_MAIN', value });
  }, []);

  const setVegetarianQuantity = useCallback((value: number | null) => {
    dispatch({ type: 'SET_VEGETARIAN', value });
  }, []);

  const setSoupQuantity = useCallback((value: number | null) => {
    dispatch({ type: 'SET_SOUP', value });
  }, []);

  const setDessertQuantity = useCallback((value: number | null) => {
    dispatch({ type: 'SET_DESSERT', value });
  }, []);

  const setConfidence = useCallback((value: number | null) => {
    dispatch({ type: 'SET_CONFIDENCE', value });
  }, []);

  const setNotes = useCallback((value: string) => {
    dispatch({ type: 'SET_NOTES', value });
  }, []);

  const setNotesError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_NOTES_ERROR', error });
  }, []);

  const setFieldError = useCallback((field: FieldKey, error: string | null) => {
    dispatch({ type: 'SET_FIELD_ERROR', field, error });
  }, []);

  const setCustomersError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_CUSTOMERS_ERROR', error });
  }, []);

  const performSubmit = useCallback(() => {
    if (!mealSlots || !isChefForecastComplete(state.draft)) return false;

    const submission = createChefForecastSubmission(serviceDate, clock);
    if (!submission) return false;

    if (embedded) {
      const result = tryPostChefActivity(submission, state.draft, mealSlots);
      if (!result.ok) {
        gamebusDevLog('ACTIVITY not sent', { reason: result.reason });
        dispatch({
          type: 'SUBMIT_ERROR',
          error: result.reason === 'no_task' ? 'Waiting for GameBus task…' : 'Submission failed.',
        });
        return false;
      }
      dispatch({ type: 'SUBMIT_SUCCESS' });
      return true;
    }

    dispatch({ type: 'SUBMIT_SUCCESS' });
    return true;
  }, [mealSlots, serviceDate, clock, embedded, state.draft]);

  const submit = useCallback(() => {
    if (isSubmitDisabled || !mealSlots || !isChefForecastComplete(state.draft)) return;

    if (isAllZeroForecast(state.draft)) {
      dispatch({ type: 'SHOW_ZERO_CONFIRM' });
      return;
    }

    performSubmit();
  }, [isSubmitDisabled, mealSlots, state.draft, performSubmit]);

  const confirmZeroSubmit = useCallback(() => {
    if (!isChefForecastComplete(state.draft) || !mealSlots) return;
    performSubmit();
  }, [mealSlots, state.draft, performSubmit]);

  const cancelZeroSubmit = useCallback(() => {
    dispatch({ type: 'HIDE_ZERO_CONFIRM' });
  }, []);

  return {
    state,
    draft: state.draft,
    initialized: true,
    serviceDate,
    calendarError:
      serviceDateResolution.status === 'calendar_error' ? serviceDateResolution.message : null,
    menuAvailability,
    mealSlots,
    submissionWindow,
    formInteractive,
    formComplete,
    isSubmitDisabled,
    hasSubmitted,
    setExpectedCustomers,
    setMainQuantity,
    setVegetarianQuantity,
    setSoupQuantity,
    setDessertQuantity,
    setFieldError,
    setCustomersError,
    setConfidence,
    setNotes,
    setNotesError,
    submit,
    confirmZeroSubmit,
    cancelZeroSubmit,
    now,
  };
}
