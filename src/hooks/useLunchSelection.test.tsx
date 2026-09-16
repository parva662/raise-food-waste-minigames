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
import { declarationRepository } from '../utils/declaration';
import * as menuResolverModule from '../services/menuResolver';

const { mockServiceDate } = vi.hoisted(() => ({
  mockServiceDate: {
    ok: true as boolean,
    lunchDate: '2026-07-29',
  },
}));

vi.mock('../services/studentLunchServiceDate', () => ({
  tryResolveStudentLunchServiceDate: () =>
    mockServiceDate.ok
      ? { ok: true as const, lunchDate: mockServiceDate.lunchDate }
      : { ok: false as const, reason: 'calendar_unresolved' },
  resolveStudentLunchServiceDate: () => mockServiceDate.lunchDate,
}));

describe('useLunchSelection', () => {
  let storage: Map<string, string>;

  beforeEach(() => {
    storage = installLocalStorageMock();
    mockServiceDate.ok = true;
    mockServiceDate.lunchDate = '2026-07-29';
  });

  afterEach(() => {
    clearLocalStorageMock(storage);
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('activates regular and sets main quantity on plus without prior section click', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    act(() => result.current.adjustPortion('main', 1));
    expect(result.current.draft.mealChoice).toBe('regular');
    expect(result.current.draft.mainQuantity).toBe(1);
    expect(result.current.isReviewDisabled).toBe(false);
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

  it('treats inactive-package zeros as normal and does not block review', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    act(() => result.current.adjustPortion('main', 1));
    expect(result.current.draft.soupQuantity).toBe(0);
    expect(result.current.draft.dessertQuantity).toBe(0);
    expect(result.current.isReviewDisabled).toBe(false);
  });

  it('requires review before confirm submit', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    act(() => result.current.adjustPortion('main', 1));
    act(() => result.current.submit());
    expect(result.current.hasSavedDeclaration).toBe(false);
    act(() => result.current.enterReview());
    expect(result.current.uiStep).toBe('review');
    act(() => result.current.submit());
    expect(result.current.hasSavedDeclaration).toBe(true);
    expect(result.current.selections[0]?.quantity).toBe(1);
  });

  it('preserves draft when returning from review to edit', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    act(() => result.current.adjustPortion('main', 2));
    act(() => result.current.enterReview());
    act(() => result.current.exitReview());
    expect(result.current.uiStep).toBe('edit');
    expect(result.current.draft.mainQuantity).toBe(2);
    expect(result.current.hasSavedDeclaration).toBe(false);
  });

  it('submits no-lunch absence and keeps success confirmation facts', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    act(() => result.current.activateMealChoice('no_lunch'));
    act(() => result.current.enterReview());
    act(() => result.current.submit());
    expect(result.current.hasSavedDeclaration).toBe(true);
    expect(result.current.submitStatus).toBe('success');
    expect(result.current.state.successMessage).toMatch(/Submitted for/);
    expect(result.current.state.successMessage).toMatch(/Helsinki/);
    expect(result.current.state.successMessage).toMatch(/No lunch|will not attend|Absence/i);
  });

  it('includes service date, meal summary, and Helsinki time on attendance success', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    act(() => result.current.adjustPortion('main', 1));
    act(() => result.current.enterReview());
    act(() => result.current.submit());
    expect(result.current.submitStatus).toBe('success');
    const message = result.current.state.successMessage ?? '';
    expect(message).toMatch(/29 July 2026|Wednesday 29/);
    expect(message).toMatch(/Main|Regular/i);
    expect(message).toMatch(/Helsinki/);
  });

  it('does not create a second declaration on repeated confirm', async () => {
    const upsertSpy = vi.spyOn(declarationRepository, 'upsertDeclaration');
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    act(() => result.current.adjustPortion('main', 1));
    act(() => result.current.enterReview());
    act(() => result.current.submit());
    act(() => result.current.submit());
    act(() => result.current.submit());
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    expect(result.current.hasSavedDeclaration).toBe(true);
  });

  it('keeps entered quantities after a failed submit and allows retry', async () => {
    const upsertSpy = vi
      .spyOn(declarationRepository, 'upsertDeclaration')
      .mockImplementationOnce(() => {
        throw new Error('network');
      });
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    act(() => result.current.adjustPortion('main', 2));
    act(() => result.current.enterReview());
    act(() => result.current.submit());
    expect(result.current.submitStatus).toBe('failed');
    expect(result.current.hasSavedDeclaration).toBe(false);
    expect(result.current.draft.mainQuantity).toBe(2);
    expect(result.current.submitError).toMatch(/try again/i);

    act(() => result.current.submit());
    expect(result.current.submitStatus).toBe('success');
    expect(result.current.hasSavedDeclaration).toBe(true);
    expect(upsertSpy).toHaveBeenCalledTimes(2);
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

  it('keeps the resolved service date when menu data cannot be loaded', async () => {
    vi.spyOn(menuResolverModule, 'resolveMenuForDate').mockReturnValue({ status: 'unavailable' });
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    expect(result.current.lunchDate).toBe('2026-07-29');
    expect(result.current.menuAvailability.status).toBe('unavailable');
    expect(result.current.menuInteractive).toBe(false);
    expect(result.current.isReviewDisabled).toBe(true);
  });

  it('marks calendar unavailable when no upcoming service can be resolved', async () => {
    mockServiceDate.ok = false;
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    expect(result.current.calendarUnavailable).toBe(true);
    expect(result.current.lunchDate).toBeNull();
    expect(result.current.menuInteractive).toBe(false);
  });

  it('locks the service date for the page session even if resolution would later change', async () => {
    const { result } = renderHook(() => useLunchSelection(() => SUBMISSION_TIMES.midday));
    await waitFor(() => expect(result.current.initialized).toBe(true));
    expect(result.current.lunchDate).toBe('2026-07-29');
    mockServiceDate.lunchDate = '2026-08-03';
    act(() => result.current.adjustPortion('main', 1));
    expect(result.current.lunchDate).toBe('2026-07-29');
  });
});

describe('useLunchSelection cutoff with controllable clock', () => {
  let storage: Map<string, string>;
  let nowMs: number;

  beforeEach(() => {
    storage = installLocalStorageMock();
    mockServiceDate.ok = true;
    mockServiceDate.lunchDate = '2026-07-29';
    nowMs = SUBMISSION_TIMES.lateBeforeDeadline.getTime();
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  });

  afterEach(() => {
    clearLocalStorageMock(storage);
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('becomes non-editable when Helsinki time reaches 23:59:00 on an open page', async () => {
    const clock = () => new Date(nowMs);
    const { result } = renderHook(() => useLunchSelection(clock));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.initialized).toBe(true);
    act(() => result.current.adjustPortion('main', 1));
    expect(result.current.submissionWindow.phase).toBe('open');

    nowMs = SUBMISSION_TIMES.lateExact.getTime();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.submissionWindow.phase).toBe('closed');
    expect(result.current.menuInteractive).toBe(false);
    expect(result.current.isReviewDisabled).toBe(true);
  });

  it('rejects confirm when cutoff is reached on the review step', async () => {
    const clock = () => new Date(nowMs);
    const { result } = renderHook(() => useLunchSelection(clock));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.initialized).toBe(true);
    act(() => result.current.adjustPortion('main', 1));
    act(() => result.current.enterReview());
    expect(result.current.uiStep).toBe('review');

    nowMs = SUBMISSION_TIMES.lateExact.getTime();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.submissionWindow.phase).toBe('closed');
    act(() => result.current.submit());
    expect(result.current.hasSavedDeclaration).toBe(false);
    expect(result.current.submitStatus).toBe('failed');
  });
});
