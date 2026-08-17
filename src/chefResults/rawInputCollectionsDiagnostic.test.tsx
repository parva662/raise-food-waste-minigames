// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { ChefResultsParticipantApp } from './ChefResultsParticipantApp';
import {
  extractInputCollectionsData,
  isParentInputCollectionsMessage,
  startRawInputCollectionsCapture,
} from './rawInputCollectionsDiagnostic';

describe('raw INPUT_COLLECTIONS diagnostic helpers', () => {
  let originalParent: Window;

  beforeEach(() => {
    originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: vi.fn() },
    });
    window.location.hash = '#/chef-results?gamebusDebug=1';
  });

  afterEach(() => {
    window.location.hash = '';
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });
    vi.restoreAllMocks();
  });

  it('captures parent INPUT_COLLECTIONS messages only', () => {
    const onCapture = vi.fn();
    const stop = startRawInputCollectionsCapture(onCapture);

    const payload = {
      inputCollectionPari: { me: { id: 'user-1', name: 'Test' } },
      serviceCloseoutInput: { chefForecasts: [{ id: 'forecast-1' }] },
    };

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'INPUT_COLLECTIONS', data: payload },
        source: window.parent as Window,
      }),
    );

    expect(onCapture).toHaveBeenCalledWith(payload);
    stop();
  });

  it('ignores unrelated parent messages', () => {
    const onCapture = vi.fn();
    const stop = startRawInputCollectionsCapture(onCapture);

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'TASK', data: { id: 'task-1' } },
        source: window.parent as Window,
      }),
    );

    expect(onCapture).not.toHaveBeenCalled();
    stop();
  });

  it('ignores messages not from window.parent', () => {
    const onCapture = vi.fn();
    const stop = startRawInputCollectionsCapture(onCapture);

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'INPUT_COLLECTIONS', data: { nested: true } },
        source: window,
      }),
    );

    expect(onCapture).not.toHaveBeenCalled();
    stop();
  });

  it('preserves nested keys in event.data.data', () => {
    const event = new MessageEvent('message', {
      data: {
        type: 'INPUT_COLLECTIONS',
        data: {
          inputCollectionPari: { me: { id: 'abc', name: 'Me User' } },
          serviceCloseoutInputs: { chefForecasts: [] },
        },
      },
      source: window.parent as Window,
    });

    expect(isParentInputCollectionsMessage(event)).toBe(true);
    expect(extractInputCollectionsData(event)).toEqual({
      inputCollectionPari: { me: { id: 'abc', name: 'Me User' } },
      serviceCloseoutInputs: { chefForecasts: [] },
    });
  });
});

describe('raw INPUT_COLLECTIONS debug panel', () => {
  let originalParent: Window;

  beforeEach(() => {
    originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: vi.fn() },
    });
  });

  afterEach(() => {
    cleanup();
    window.location.hash = '';
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('renders event.data.data with nested keys when gamebusDebug=1', async () => {
    vi.stubEnv('DEV', false);
    window.location.hash = '#/chef-results?gamebusDebug=1';

    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('raw-input-collections-debug')).toBeInTheDocument();
    expect(screen.getByText('Waiting for INPUT_COLLECTIONS from GameBus...')).toBeInTheDocument();

    const payload = {
      inputCollectionPari: { me: { id: 'raw-user', name: 'Raw User' } },
      serviceCloseoutInput: { chefForecasts: { docs: [{ id: 'f-1' }] } },
    };

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'INPUT_COLLECTIONS', data: payload },
        source: window.parent as Window,
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('raw-input-collections-json')).toHaveTextContent(
        '"inputCollectionPari"',
      );
    });
    expect(screen.getByTestId('raw-input-collections-json')).toHaveTextContent('"raw-user"');
    expect(screen.getByTestId('raw-input-collections-json')).toHaveTextContent(
      '"serviceCloseoutInput"',
    );
  });

  it('is absent without gamebusDebug=1', () => {
    vi.stubEnv('DEV', false);
    window.location.hash = '#/chef-results';

    render(<ChefResultsParticipantApp />);

    expect(screen.queryByTestId('raw-input-collections-debug')).not.toBeInTheDocument();
  });
});
