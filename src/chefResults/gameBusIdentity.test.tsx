// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ChefResultsParticipantApp } from './ChefResultsParticipantApp';
import { DEFAULT_FIXTURE_CURRENT_USER_ID, getFixtureCurrentUserId } from './currentUserContext';
import * as detectEmbedModule from '../gamebus/detectEmbed';
import * as operationalCalendarModule from '../services/operationalServiceCalendar';
import {
  ingestInputCollectionsForTests,
  resetGameBusBridgeForTests,
} from '../gamebus/bridge';
import {
  INPUT_COLLECTION_PARI_KEY,
  INPUT_COLLECTION_PARI_ME_REQUEST_KEY,
} from '../gamebus/inputCollections';

function realMePayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 'real-user-abc',
    firstName: 'Test',
    lastName: 'Account',
    email: 'hidden@example.com',
    roles: ['chef'],
    ...overrides,
  };
}

function expectNoParticipantDebugUi() {
  expect(screen.queryByText('GameBus debug')).not.toBeInTheDocument();
  expect(screen.queryByTestId('chef-results-debug-panel')).not.toBeInTheDocument();
  expect(screen.queryByTestId('gamebus-user-diagnostic')).not.toBeInTheDocument();
  expect(screen.queryByTestId('gamebus-user-id')).not.toBeInTheDocument();
  expect(screen.queryByTestId('gamebus-user-name')).not.toBeInTheDocument();
  expect(screen.queryByTestId('debug-input-collections')).not.toBeInTheDocument();
  expect(screen.queryByTestId('debug-frontend-build')).not.toBeInTheDocument();
  expect(screen.queryByText('hidden@example.com')).not.toBeInTheDocument();
}

describe('GameBus authenticated user on chef results', () => {
  let originalParent: Window;

  beforeEach(() => {
    resetGameBusBridgeForTests();
    vi.spyOn(detectEmbedModule, 'isGameBusEmbed').mockReturnValue(true);
    vi.spyOn(operationalCalendarModule, 'resolveChefResultsServiceDate').mockReturnValue('2026-09-07');
    window.sessionStorage.clear();
    window.location.hash = '#/chef-results?gamebusDebug=1';
    originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: vi.fn() },
    });
  });

  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    window.sessionStorage.clear();
    window.location.hash = '';
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('does not render participant debug UI when gamebusDebug=1', () => {
    vi.stubEnv('DEV', false);
    ingestInputCollectionsForTests({
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: realMePayload({
          id: 'deployed-user',
          firstName: 'Deployed',
          lastName: 'Account',
        }),
      },
    });

    render(<ChefResultsParticipantApp />);

    expectNoParticipantDebugUi();
    expect(screen.getByTestId('chef-results-participant-page')).toBeInTheDocument();
  });

  it('does not render participant debug UI without gamebusDebug=1', () => {
    vi.stubEnv('DEV', false);
    window.location.hash = '#/chef-results';
    ingestInputCollectionsForTests({
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: realMePayload(),
      },
    });

    render(<ChefResultsParticipantApp />);

    expectNoParticipantDebugUi();
  });

  it('does not render the raw INPUT_COLLECTIONS debug panel', () => {
    ingestInputCollectionsForTests({
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: realMePayload(),
      },
    });

    render(<ChefResultsParticipantApp />);

    expectNoParticipantDebugUi();
  });

  it('does not map the real GameBus user to fixture calculation identity', () => {
    ingestInputCollectionsForTests({
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: realMePayload(),
      },
    });

    render(<ChefResultsParticipantApp />);

    expect(getFixtureCurrentUserId()).toBe(DEFAULT_FIXTURE_CURRENT_USER_ID);
    expect(screen.queryByTestId('fixture-current-user-selector')).not.toBeInTheDocument();
    expect(screen.getByTestId('participant-results-unavailable-closeout')).toBeInTheDocument();
    expectNoParticipantDebugUi();
  });

  it('logs authenticated user when gamebusDebug=1', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    ingestInputCollectionsForTests({
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: realMePayload({
          id: 'logged-user',
          firstName: 'Logged',
          lastName: 'User',
        }),
      },
    });

    render(<ChefResultsParticipantApp />);

    expect(infoSpy).toHaveBeenCalledWith('[gamebus] authenticated user', {
      id: 'logged-user',
      name: 'Logged User',
    });
    expectNoParticipantDebugUi();
  });
});
