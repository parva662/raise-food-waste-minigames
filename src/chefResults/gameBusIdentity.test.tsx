// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ChefResultsParticipantApp } from './ChefResultsParticipantApp';
import { DEFAULT_FIXTURE_CURRENT_USER_ID, getFixtureCurrentUserId } from './currentUserContext';
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

describe('GameBus authenticated user on chef results', () => {
  let originalParent: Window;

  beforeEach(() => {
    resetGameBusBridgeForTests();
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

  it('shows parsed firstName + lastName in the GameBus diagnostic', () => {
    ingestInputCollectionsForTests({
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: realMePayload(),
      },
    });

    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('gamebus-user-diagnostic')).toBeInTheDocument();
    expect(screen.getByTestId('gamebus-user-name')).toHaveTextContent('Test Account');
    expect(screen.getByTestId('gamebus-user-id')).toHaveTextContent('real-user-abc');
    expect(screen.queryByText('hidden@example.com')).not.toBeInTheDocument();
  });

  it('shows diagnostic on deployed build when gamebusDebug=1', () => {
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

    expect(screen.getByTestId('gamebus-user-diagnostic')).toBeInTheDocument();
    expect(screen.getByTestId('gamebus-user-id')).toHaveTextContent('deployed-user');
    expect(screen.getByTestId('gamebus-user-name')).toHaveTextContent('Deployed Account');
  });

  it('hides diagnostic without gamebusDebug=1', () => {
    vi.stubEnv('DEV', false);
    window.location.hash = '#/chef-results';
    ingestInputCollectionsForTests({
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: realMePayload(),
      },
    });

    render(<ChefResultsParticipantApp />);

    expect(screen.queryByTestId('gamebus-user-diagnostic')).not.toBeInTheDocument();
  });

  it('does not render the raw INPUT_COLLECTIONS debug panel', () => {
    ingestInputCollectionsForTests({
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: realMePayload(),
      },
    });

    render(<ChefResultsParticipantApp />);

    expect(screen.queryByTestId('raw-input-collections-debug')).not.toBeInTheDocument();
  });

  it('updates displayed id/name when the GameBus user payload changes', () => {
    ingestInputCollectionsForTests({
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: realMePayload({
          id: 'user-one',
          firstName: 'First',
          lastName: 'Account',
        }),
      },
    });

    const { unmount } = render(<ChefResultsParticipantApp />);
    expect(screen.getByTestId('gamebus-user-id')).toHaveTextContent('user-one');

    unmount();
    resetGameBusBridgeForTests();
    ingestInputCollectionsForTests({
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: realMePayload({
          id: 'user-two',
          firstName: 'Second',
          lastName: 'Account',
        }),
      },
    });

    render(<ChefResultsParticipantApp />);
    expect(screen.getByTestId('gamebus-user-id')).toHaveTextContent('user-two');
    expect(screen.getByTestId('gamebus-user-name')).toHaveTextContent('Second Account');
  });

  it('does not map the real GameBus user to fixture calculation identity', () => {
    ingestInputCollectionsForTests({
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: realMePayload(),
      },
    });

    render(<ChefResultsParticipantApp />);

    expect(getFixtureCurrentUserId()).toBe(DEFAULT_FIXTURE_CURRENT_USER_ID);
    expect(screen.getByTestId('gamebus-user-id')).not.toHaveTextContent(
      DEFAULT_FIXTURE_CURRENT_USER_ID,
    );
    expect(screen.getByTestId('participant-summary-cards')).toBeInTheDocument();
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
  });
});
