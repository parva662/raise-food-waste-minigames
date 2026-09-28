/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getGameBusInputCollections,
  getGameBusTask,
  ingestInputCollectionsForTests,
  ingestTaskForTests,
  resetGameBusBridgeForTests,
  startGameBusHandshake,
} from '@/platform/gamebus/bridge';
import {
  getAuthenticatedGameBusUser,
  getInputCollectionKeys,
  getRawAuthenticatedMeInput,
  getRawChefForecastsInput,
  INPUT_COLLECTION_PARI_KEY,
  INPUT_COLLECTION_PARI_ME_REQUEST_KEY,
  SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY,
  SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY,
  SERVICE_CLOSEOUT_INPUTS_COLLECTION_KEY_LEGACY,
} from '@/platform/gamebus/inputCollections';
import { platformTaskFixture } from '@/platform/gamebus/testFixtures';
import type { GameBusInputCollectionsPayload } from '@/platform/gamebus/types';

const taskFixture = platformTaskFixture();

const rawChefForecastsFixture = {
  docs: [{ id: 'forecast-1', template: 'chefForecast' }],
  totalDocs: 1,
};

const nestedInputCollections: GameBusInputCollectionsPayload = {
  [SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY]: {
    [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: rawChefForecastsFixture,
  },
};

describe('GameBus INPUT_COLLECTIONS', () => {
  let originalParent: Window;

  beforeEach(() => {
    resetGameBusBridgeForTests();
    originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: vi.fn() },
    });
  });

  afterEach(() => {
    resetGameBusBridgeForTests();
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });
  });

  it('accepts INPUT_COLLECTIONS from parent and preserves raw payload', () => {
    const cleanup = startGameBusHandshake();

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'INPUT_COLLECTIONS', data: nestedInputCollections },
        source: window.parent as Window,
      }),
    );

    expect(getGameBusInputCollections()).toEqual(nestedInputCollections);
    expect(getInputCollectionKeys(getGameBusInputCollections())).toEqual([
      SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY,
    ]);
    expect(getRawChefForecastsInput(getGameBusInputCollections())).toEqual(
      rawChefForecastsFixture,
    );
    cleanup();
  });

  it('defaults missing data to an empty object', () => {
    const cleanup = startGameBusHandshake();

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'INPUT_COLLECTIONS' },
        source: window.parent as Window,
      }),
    );

    expect(getGameBusInputCollections()).toEqual({});
    cleanup();
  });

  it('replaces prior INPUT_COLLECTIONS on each message', () => {
    const cleanup = startGameBusHandshake();
    ingestInputCollectionsForTests(nestedInputCollections);

    const replacement: GameBusInputCollectionsPayload = {
      [SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY]: {
        [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: { docs: [], totalDocs: 0 },
      },
    };

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'INPUT_COLLECTIONS', data: replacement },
        source: window.parent as Window,
      }),
    );

    expect(getGameBusInputCollections()).toEqual(replacement);
    expect(getRawChefForecastsInput(getGameBusInputCollections())).toEqual({
      docs: [],
      totalDocs: 0,
    });
    cleanup();
  });

  it('still accepts TASK after INPUT_COLLECTIONS', () => {
    const cleanup = startGameBusHandshake();

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'INPUT_COLLECTIONS', data: nestedInputCollections },
        source: window.parent as Window,
      }),
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'TASK', data: taskFixture },
        source: window.parent as Window,
      }),
    );

    expect(getGameBusInputCollections()).toEqual(nestedInputCollections);
    expect(getGameBusTask()).toEqual(taskFixture);
    cleanup();
  });

  it('does not clear TASK when INPUT_COLLECTIONS arrives later', () => {
    const cleanup = startGameBusHandshake();
    ingestTaskForTests(taskFixture);

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'INPUT_COLLECTIONS', data: nestedInputCollections },
        source: window.parent as Window,
      }),
    );

    expect(getGameBusTask()).toEqual(taskFixture);
    expect(getGameBusInputCollections()).toEqual(nestedInputCollections);
    cleanup();
  });

  it('ignores INPUT_COLLECTIONS messages not from parent', () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'INPUT_COLLECTIONS', data: nestedInputCollections },
        source: window,
      }),
    );

    expect(getGameBusInputCollections()).toBeNull();
  });
});

describe('inputCollections accessors', () => {
  it('returns empty keys for null payload', () => {
    expect(getInputCollectionKeys(null)).toEqual([]);
    expect(getRawChefForecastsInput(null)).toBeUndefined();
  });

  it('reads canonical serviceCloseoutInput.chefForecasts', () => {
    const payload: GameBusInputCollectionsPayload = {
      [SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY]: {
        [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: rawChefForecastsFixture,
      },
    };
    expect(getRawChefForecastsInput(payload)).toEqual(rawChefForecastsFixture);
  });

  it('reads legacy serviceCloseoutInputs.chefForecasts for backwards compatibility', () => {
    const payload: GameBusInputCollectionsPayload = {
      [SERVICE_CLOSEOUT_INPUTS_COLLECTION_KEY_LEGACY]: {
        [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: rawChefForecastsFixture,
      },
    };
    expect(getRawChefForecastsInput(payload)).toEqual(rawChefForecastsFixture);
  });

  it('prefers canonical serviceCloseoutInput when both nested keys are present', () => {
    const canonical = { docs: [{ id: 'canonical' }], totalDocs: 1 };
    const legacy = { docs: [{ id: 'legacy' }], totalDocs: 1 };
    const payload: GameBusInputCollectionsPayload = {
      [SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY]: {
        [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: canonical,
      },
      [SERVICE_CLOSEOUT_INPUTS_COLLECTION_KEY_LEGACY]: {
        [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: legacy,
      },
    };
    expect(getRawChefForecastsInput(payload)).toEqual(canonical);
  });

  it('reads flat chefForecasts when collection nesting is absent', () => {
    const flat: GameBusInputCollectionsPayload = {
      [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: rawChefForecastsFixture,
    };
    expect(getRawChefForecastsInput(flat)).toEqual(rawChefForecastsFixture);
  });

  it('reads inputCollectionPari.me for authenticated user profile', () => {
    const mePayload = { id: 'gb-user-123', name: 'Test Account' };
    const payload: GameBusInputCollectionsPayload = {
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: mePayload,
      },
    };
    expect(getRawAuthenticatedMeInput(payload)).toEqual(mePayload);
    expect(getAuthenticatedGameBusUser(payload)).toEqual({
      id: 'gb-user-123',
      name: 'Test Account',
    });
  });

  it('returns null authenticated user when inputCollectionPari.me is missing', () => {
    expect(getAuthenticatedGameBusUser(null)).toBeNull();
    expect(getAuthenticatedGameBusUser({})).toBeNull();
    expect(
      getAuthenticatedGameBusUser({
        [INPUT_COLLECTION_PARI_KEY]: {},
      }),
    ).toBeNull();
  });
});
