/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getGameBusInputCollections,
  getGameBusMenuItem,
  getGameBusTask,
  getIframeReadyAttemptCountForTests,
  isGameBusPageHandshakeComplete,
  resetGameBusBridgeForTests,
  startGameBusHandshake,
} from '@/platform/gamebus/bridge';
import { platformTaskFixture } from '@/platform/gamebus/testFixtures';

const taskFixture = platformTaskFixture();
const HANDSHAKE_RETRY_MS = 875;

function setHash(hash: string) {
  window.location.hash = hash;
}

function dispatchParentMessage(data: unknown, source: Window | null = window.parent as Window) {
  window.dispatchEvent(
    new MessageEvent('message', {
      data,
      source,
    }),
  );
}

describe('GameBus handshake', () => {
  let parentPostMessage: ReturnType<typeof vi.fn>;
  let originalParent: Window;

  beforeEach(() => {
    resetGameBusBridgeForTests();
    vi.useFakeTimers();
    parentPostMessage = vi.fn();
    originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: parentPostMessage },
    });
    setHash('');
  });

  afterEach(() => {
    resetGameBusBridgeForTests();
    vi.useRealTimers();
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });
    setHash('');
  });

  it('does not send iframe messages in standalone mode', () => {
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: window,
    });
    const cleanup = startGameBusHandshake();
    expect(parentPostMessage).not.toHaveBeenCalled();
    cleanup();
  });

  it('sends IFRAME_READY repeatedly until TASK is received', () => {
    const cleanup = startGameBusHandshake();
    expect(getIframeReadyAttemptCountForTests()).toBe(1);
    expect(parentPostMessage).toHaveBeenCalledWith({ type: 'IFRAME_READY' }, '*');

    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS);
    expect(getIframeReadyAttemptCountForTests()).toBe(2);
    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS);
    expect(getIframeReadyAttemptCountForTests()).toBe(3);

    dispatchParentMessage({ type: 'TASK', data: taskFixture });

    expect(getGameBusTask()).toEqual(taskFixture);
    const attemptsAfterTask = getIframeReadyAttemptCountForTests();
    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS * 3);
    expect(getIframeReadyAttemptCountForTests()).toBe(attemptsAfterTask);
    cleanup();
  });

  it('stops retry timer on cleanup before TASK', () => {
    const cleanup = startGameBusHandshake();
    expect(getIframeReadyAttemptCountForTests()).toBe(1);
    cleanup();
    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS * 5);
    expect(getIframeReadyAttemptCountForTests()).toBe(1);
  });

  it('ignores duplicate TASK messages', () => {
    const cleanup = startGameBusHandshake();
    const dispatchTask = () =>
      dispatchParentMessage({ type: 'TASK', data: { ...taskFixture, id: 'first' } });

    dispatchTask();
    expect(getGameBusTask()?.id).toBe('first');

    dispatchTask();
    dispatchParentMessage({ type: 'TASK', data: { ...taskFixture, id: 'second' } });
    expect(getGameBusTask()?.id).toBe('first');
    cleanup();
  });

  it('ignores messages not from parent', () => {
    const cleanup = startGameBusHandshake();
    dispatchParentMessage({ type: 'TASK', data: taskFixture }, window);
    expect(getGameBusTask()).toBeNull();
    cleanup();
  });
});

describe('GameBus Custom Page handshake', () => {
  let parentPostMessage: ReturnType<typeof vi.fn>;
  let originalParent: Window;

  beforeEach(() => {
    resetGameBusBridgeForTests();
    vi.useFakeTimers();
    parentPostMessage = vi.fn();
    originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: parentPostMessage },
    });
  });

  afterEach(() => {
    resetGameBusBridgeForTests();
    vi.useRealTimers();
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });
    setHash('');
  });

  const customPageHashes = [
    '#/chef-results',
    '#/chef-results?gamebusDebug=1',
    '#/chef-results-admin',
    '#/kitchen-day-progress',
  ] as const;

  for (const hash of customPageHashes) {
    it(`stops IFRAME_READY retries after INPUT_COLLECTIONS on ${hash}`, () => {
      setHash(hash);
      const cleanup = startGameBusHandshake();
      expect(getIframeReadyAttemptCountForTests()).toBe(1);
      expect(parentPostMessage).toHaveBeenCalledWith({ type: 'IFRAME_READY' }, '*');

      dispatchParentMessage({
        type: 'INPUT_COLLECTIONS',
        data: { kitchenGroupInput: { activities: [] } },
      });

      expect(getGameBusInputCollections()).not.toBeNull();
      expect(isGameBusPageHandshakeComplete()).toBe(true);
      const attemptsAfterInit = getIframeReadyAttemptCountForTests();

      vi.advanceTimersByTime(HANDSHAKE_RETRY_MS * 20);
      expect(getIframeReadyAttemptCountForTests()).toBe(attemptsAfterInit);
      cleanup();
    });
  }

  it('stops IFRAME_READY retries after MENU_ITEM on Custom Page', () => {
    setHash('#/chef-results');
    const cleanup = startGameBusHandshake();
    expect(getIframeReadyAttemptCountForTests()).toBe(1);

    dispatchParentMessage({
      type: 'MENU_ITEM',
      data: { id: 'forecast-results', title: 'Forecast Results' },
    });

    expect(getGameBusMenuItem()?.id).toBe('forecast-results');
    expect(isGameBusPageHandshakeComplete()).toBe(true);
    const attemptsAfterInit = getIframeReadyAttemptCountForTests();

    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS * 20);
    expect(getIframeReadyAttemptCountForTests()).toBe(attemptsAfterInit);
    cleanup();
  });

  it('preserves later INPUT_COLLECTIONS updates after page initialization', () => {
    setHash('#/chef-results');
    const cleanup = startGameBusHandshake();

    dispatchParentMessage({
      type: 'INPUT_COLLECTIONS',
      data: { first: { value: 1 } },
    });
    expect(getGameBusInputCollections()).toEqual({ first: { value: 1 } });
    expect(isGameBusPageHandshakeComplete()).toBe(true);

    dispatchParentMessage({
      type: 'INPUT_COLLECTIONS',
      data: { second: { value: 2 } },
    });
    expect(getGameBusInputCollections()).toEqual({ second: { value: 2 } });
    expect(isGameBusPageHandshakeComplete()).toBe(true);

    const attempts = getIframeReadyAttemptCountForTests();
    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS * 5);
    expect(getIframeReadyAttemptCountForTests()).toBe(attempts);
    cleanup();
  });

  it('does not complete Custom Page handshake from a non-parent source', () => {
    setHash('#/chef-results');
    const cleanup = startGameBusHandshake();

    dispatchParentMessage(
      { type: 'INPUT_COLLECTIONS', data: { kitchenGroupInput: {} } },
      window,
    );

    expect(getGameBusInputCollections()).toBeNull();
    expect(isGameBusPageHandshakeComplete()).toBe(false);
    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS);
    expect(getIframeReadyAttemptCountForTests()).toBe(2);
    cleanup();
  });

  it('does not restart retries after successful page init when another subscriber mounts', () => {
    setHash('#/chef-results');
    const first = startGameBusHandshake();
    dispatchParentMessage({
      type: 'INPUT_COLLECTIONS',
      data: { kitchenGroupInput: { activities: [] } },
    });
    expect(isGameBusPageHandshakeComplete()).toBe(true);
    const attemptsAfterInit = getIframeReadyAttemptCountForTests();

    const second = startGameBusHandshake();
    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS * 10);
    expect(getIframeReadyAttemptCountForTests()).toBe(attemptsAfterInit);

    first();
    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS * 5);
    expect(getIframeReadyAttemptCountForTests()).toBe(attemptsAfterInit);

    second();
  });

  it('keeps a single retry interval across multiple concurrent subscribers', () => {
    setHash('#/chef-results');
    const first = startGameBusHandshake();
    const second = startGameBusHandshake();

    expect(getIframeReadyAttemptCountForTests()).toBe(1);
    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS);
    expect(getIframeReadyAttemptCountForTests()).toBe(2);

    first();
    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS);
    expect(getIframeReadyAttemptCountForTests()).toBe(3);

    second();
    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS * 5);
    expect(getIframeReadyAttemptCountForTests()).toBe(3);
  });
});

describe('GameBus Custom Task handshake with INPUT_COLLECTIONS', () => {
  let parentPostMessage: ReturnType<typeof vi.fn>;
  let originalParent: Window;

  beforeEach(() => {
    resetGameBusBridgeForTests();
    vi.useFakeTimers();
    parentPostMessage = vi.fn();
    originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: parentPostMessage },
    });
    setHash('#/chef');
  });

  afterEach(() => {
    resetGameBusBridgeForTests();
    vi.useRealTimers();
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });
    setHash('');
  });

  it('continues retries when INPUT_COLLECTIONS arrives before TASK', () => {
    const cleanup = startGameBusHandshake();
    expect(getIframeReadyAttemptCountForTests()).toBe(1);

    dispatchParentMessage({
      type: 'INPUT_COLLECTIONS',
      data: { kitchenGroupInput: { activities: [] } },
    });

    expect(getGameBusInputCollections()).not.toBeNull();
    expect(isGameBusPageHandshakeComplete()).toBe(false);
    expect(getGameBusTask()).toBeNull();

    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS);
    expect(getIframeReadyAttemptCountForTests()).toBe(2);
    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS);
    expect(getIframeReadyAttemptCountForTests()).toBe(3);

    dispatchParentMessage({ type: 'TASK', data: taskFixture });
    expect(getGameBusTask()).toEqual(taskFixture);
    const attemptsAfterTask = getIframeReadyAttemptCountForTests();
    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS * 5);
    expect(getIframeReadyAttemptCountForTests()).toBe(attemptsAfterTask);
    cleanup();
  });

  it('does not stop Custom Task retries on MENU_ITEM alone', () => {
    const cleanup = startGameBusHandshake();
    dispatchParentMessage({
      type: 'MENU_ITEM',
      data: { id: 'unexpected-on-task' },
    });
    expect(getGameBusMenuItem()?.id).toBe('unexpected-on-task');
    expect(isGameBusPageHandshakeComplete()).toBe(false);

    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS);
    expect(getIframeReadyAttemptCountForTests()).toBe(2);
    cleanup();
  });

  it('keeps task handshake for Kitchen Skills review even when expectedActivity is null', () => {
    setHash('#/kitchen-day/review');
    const cleanup = startGameBusHandshake();

    dispatchParentMessage({
      type: 'INPUT_COLLECTIONS',
      data: { kitchenGroupInputSelf: { activities: [] } },
    });

    expect(getGameBusInputCollections()).not.toBeNull();
    expect(isGameBusPageHandshakeComplete()).toBe(false);
    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS);
    expect(getIframeReadyAttemptCountForTests()).toBe(2);

    dispatchParentMessage({ type: 'TASK', data: taskFixture });
    expect(getGameBusTask()).toEqual(taskFixture);
    const attemptsAfterTask = getIframeReadyAttemptCountForTests();
    vi.advanceTimersByTime(HANDSHAKE_RETRY_MS * 5);
    expect(getIframeReadyAttemptCountForTests()).toBe(attemptsAfterTask);
    cleanup();
  });
});
