// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { cleanup, renderHook, act, waitFor } from '@testing-library/react';
import { useLunchSelection } from './useLunchSelection';
import { CANTEEN_CONFIG } from '../config/canteen';
import {
  FIXTURE_LUNCH_DATE,
  SUBMISSION_TIMES,
} from '../test/fixtures/dates';
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

describe('useLunchSelection submit and update flow', () => {
  let storage: Map<string, string>;

  beforeEach(() => {
    storage = installLocalStorageMock();
  });

  afterEach(() => {
    clearLocalStorageMock(storage);
    cleanup();
    vi.clearAllMocks();
  });

  it('disables submit for an empty draft', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    expect(result.current.isSubmitDisabled).toBe(true);
    expect(result.current.submitButtonState).toBe('submit');
  });

  it('enables submit after selecting an item', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    const itemId = result.current.menuItems[0]?.id;
    act(() => result.current.increment(itemId));
    expect(result.current.isSubmitDisabled).toBe(false);
  });

  it('enables submit when no lunch is selected', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    act(() => result.current.setNoLunch(true));
    expect(result.current.isSubmitDisabled).toBe(false);
    expect(result.current.state.noLunch).toBe(true);
    expect(result.current.selections).toHaveLength(0);
  });

  it('clears food quantities when no lunch is selected', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    const itemId = result.current.menuItems[0]?.id;
    act(() => result.current.increment(itemId));
    act(() => result.current.setNoLunch(true));
    expect(result.current.getQuantity(itemId)).toBe(0);
  });

  it('clears noLunch when a food quantity is increased', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    act(() => result.current.setNoLunch(true));
    const itemId = result.current.menuItems[0]?.id;
    act(() => result.current.increment(itemId));
    expect(result.current.state.noLunch).toBe(false);
  });

  it('creates a saved declaration after first submission', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    const itemId = result.current.menuItems[0]?.id;
    act(() => result.current.increment(itemId));
    act(() => result.current.submit());
    expect(result.current.hasSavedDeclaration).toBe(true);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.submitButtonState).toBe('update');
    expect(result.current.savedScoring?.totalPoints).toBe(25);
    expect(result.current.state.successMessage).toContain('has been saved');
    expect(result.current.state.successPointsMessage).toBe('Lunch saved · 25 points');
  });

  it('marks the draft dirty after a change and clears dirty state when restored', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    const itemId = result.current.menuItems[0]?.id;
    act(() => result.current.increment(itemId));
    act(() => result.current.submit());
    act(() => result.current.increment(itemId));
    expect(result.current.isDirty).toBe(true);
    expect(result.current.isSubmitDisabled).toBe(false);
    act(() => result.current.decrement(itemId));
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isSubmitDisabled).toBe(true);
  });

  it('shows late-update confirmation instead of saving immediately', async () => {
    storage.set(
      `lunch-declaration-${CANTEEN_CONFIG.studentId}-${FIXTURE_LUNCH_DATE}`,
      JSON.stringify(createFixtureDeclaration()),
    );
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.lateEvening));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    const itemId = result.current.menuItems[0]?.id;
    act(() => result.current.increment(itemId));
    act(() => result.current.submit());
    expect(result.current.state.showLateConfirm).toBe(true);
    expect(result.current.savedScoring?.totalPoints).toBe(25);
  });

  it('preserves the original declaration when late update is cancelled', async () => {
    storage.set(
      `lunch-declaration-${CANTEEN_CONFIG.studentId}-${FIXTURE_LUNCH_DATE}`,
      JSON.stringify(createFixtureDeclaration()),
    );
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.lateEvening));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    const itemId = result.current.menuItems[0]?.id;
    act(() => result.current.increment(itemId));
    act(() => result.current.submit());
    act(() => result.current.cancelLateUpdate());
    expect(result.current.state.showLateConfirm).toBe(false);
    expect(result.current.savedScoring?.totalPoints).toBe(25);
  });

  it('saves 15 total points after confirming a late update', async () => {
    storage.set(
      `lunch-declaration-${CANTEEN_CONFIG.studentId}-${FIXTURE_LUNCH_DATE}`,
      JSON.stringify(createFixtureDeclaration()),
    );
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.lateEvening));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    const itemId = result.current.menuItems[0]?.id;
    act(() => result.current.increment(itemId));
    act(() => result.current.submit());
    act(() => result.current.confirmLateUpdate());
    expect(result.current.savedScoring?.totalPoints).toBe(15);
    expect(result.current.isDirty).toBe(false);
  });

  it('disables submission when the submission window is closed', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.closedJustAfter));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    const itemId = result.current.menuItems[0]?.id;
    act(() => result.current.increment(itemId));
    expect(result.current.isSubmitDisabled).toBe(true);
    expect(result.current.menuInteractive).toBe(false);
  });
});
