// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MENU_DATES } from '../test/fixtures/dates';
import {
  INPUT_COLLECTION_PARI_KEY,
  INPUT_COLLECTION_PARI_ME_REQUEST_KEY,
} from '../gamebus/inputCollections';
import {
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
} from '../gamebus/groupActivities';
import { TOMORROW_CHEF_FORECAST_ACTIVITY } from './forecast/fixtures/gameBusChefForecastActivities';
import { useCloseoutChefForecast } from './useCloseoutChefForecast';
import * as gameBusEmbedModule from '../gamebus/useGameBusEmbed';

const closeoutDate = MENU_DATES.runtimeWednesday;

describe('useCloseoutChefForecast synthetic fallback gating', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses synthetic forecast on normal #/service-closeout when config is enabled and no exact match exists', () => {
    window.location.hash = '#/service-closeout';
    vi.spyOn(gameBusEmbedModule, 'useGameBusEmbed').mockReturnValue({
      embedded: true,
      taskReady: true,
      task: null,
      inputCollections: {
        [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
          [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [TOMORROW_CHEF_FORECAST_ACTIVITY],
        },
        [INPUT_COLLECTION_PARI_KEY]: {
          [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: {
            id: 'current-closeout-user',
            firstName: 'Current',
            lastName: 'User',
          },
        },
      },
      inputCollectionsReady: true,
      hasPosted: false,
    });

    const { result } = renderHook(() => useCloseoutChefForecast(closeoutDate));

    expect(result.current.status).toBe('matched');
    if (result.current.status === 'matched') {
      expect(result.current.isSynthetic).toBe(true);
      expect(result.current.forecasts[0]!.targetDate).toBe(closeoutDate);
    }
  });
});
