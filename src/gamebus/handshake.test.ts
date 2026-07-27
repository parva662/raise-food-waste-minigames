/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getGameBusTask,
  getIframeReadyAttemptCountForTests,
  resetGameBusBridgeForTests,
  startGameBusHandshake,
} from './bridge';
import type { TaskData } from './types';
import { pariStudentLunchTaskFixture } from './taskFixtures';

const taskFixture: TaskData = pariStudentLunchTaskFixture;

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
  });

  afterEach(() => {
    resetGameBusBridgeForTests();
    vi.useRealTimers();
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });
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

    vi.advanceTimersByTime(875);
    expect(getIframeReadyAttemptCountForTests()).toBe(2);
    vi.advanceTimersByTime(875);
    expect(getIframeReadyAttemptCountForTests()).toBe(3);

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'TASK', data: taskFixture },
        source: window.parent as Window,
      }),
    );

    expect(getGameBusTask()).toEqual(taskFixture);
    const attemptsAfterTask = getIframeReadyAttemptCountForTests();
    vi.advanceTimersByTime(875 * 3);
    expect(getIframeReadyAttemptCountForTests()).toBe(attemptsAfterTask);
    cleanup();
  });

  it('stops retry timer on cleanup before TASK', () => {
    const cleanup = startGameBusHandshake();
    expect(getIframeReadyAttemptCountForTests()).toBe(1);
    cleanup();
    vi.advanceTimersByTime(875 * 5);
    expect(getIframeReadyAttemptCountForTests()).toBe(1);
  });

  it('ignores duplicate TASK messages', () => {
    const cleanup = startGameBusHandshake();
    const dispatchTask = () =>
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'TASK', data: { ...taskFixture, id: 'first' } },
          source: window.parent as Window,
        }),
      );

    dispatchTask();
    expect(getGameBusTask()?.id).toBe('first');

    dispatchTask();
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'TASK', data: { ...taskFixture, id: 'second' } },
        source: window.parent as Window,
      }),
    );
    expect(getGameBusTask()?.id).toBe('first');
    cleanup();
  });

  it('ignores messages not from parent', () => {
    const cleanup = startGameBusHandshake();
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'TASK', data: taskFixture },
        source: window,
      }),
    );
    expect(getGameBusTask()).toBeNull();
    cleanup();
  });
});
