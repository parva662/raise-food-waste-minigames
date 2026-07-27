// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { cleanup, renderHook, act, waitFor } from '@testing-library/react';
import { useLunchSelection } from './useLunchSelection';
import { CANTEEN_CONFIG } from '../config/canteen';
import { FIXTURE_LUNCH_DATE, SUBMISSION_TIMES } from '../test/fixtures/dates';
import {
  clearLocalStorageMock,
  installLocalStorageMock,
} from '../test/fixtures/storage';
import { createFixtureDeclaration } from '../test/fixtures/declarations';

vi.mock('../utils/dates', () => ({
  getTomorrowIsoDate: () => '2026-01-07',
  formatDisplayDate: (isoDate: string) => isoDate,
  formatSubmissionTime: () => '13:19',
}));

describe('useLunchSelection', () => {
  let storage: Map<string, string>;

  beforeEach(() => {
    storage = installLocalStorageMock();
  });

  afterEach(() => {
    clearLocalStorageMock(storage);
    cleanup();
    vi.clearAllMocks();
  });

  it('activates regular and sets main quantity on plus without prior section click', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    act(() => result.current.adjustPortion('main', 1));
    expect(result.current.draft.mealChoice).toBe('regular');
    expect(result.current.draft.mainQuantity).toBe(1);
    expect(result.current.isSubmitDisabled).toBe(false);
  });

  it('increments main quantity up to max', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    act(() => result.current.adjustPortion('main', 1));
    act(() => result.current.adjustPortion('main', 1));
    expect(result.current.draft.mainQuantity).toBe(2);
  });

  it('clears regular quantities when switching to soup via dessert plus', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    act(() => result.current.adjustPortion('main', 1));
    act(() => result.current.adjustPortion('dessert', 1));
    expect(result.current.draft.mealChoice).toBe('soup');
    expect(result.current.draft.mainQuantity).toBe(0);
    expect(result.current.draft.dessertQuantity).toBe(1);
  });

  it('submits final declaration with quantity in selections', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    act(() => result.current.adjustPortion('main', 1));
    act(() => result.current.adjustPortion('main', 1));
    act(() => result.current.submit());
    expect(result.current.hasSavedDeclaration).toBe(true);
    expect(result.current.selections[0]?.quantity).toBe(2);
  });

  it('locks UI when a declaration already exists', async () => {
    storage.set(
      `lunch-declaration-${CANTEEN_CONFIG.studentId}-${FIXTURE_LUNCH_DATE}`,
      JSON.stringify(createFixtureDeclaration()),
    );
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    expect(result.current.isSubmitDisabled).toBe(true);
    expect(result.current.menuInteractive).toBe(false);
  });
});
