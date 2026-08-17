// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MENU_DATES } from '../test/fixtures/dates';
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
        serviceCloseoutInput: {
          chefForecasts: [TOMORROW_CHEF_FORECAST_ACTIVITY],
        },
      },
      inputCollectionsReady: true,
      hasPosted: false,
    });

    const { result } = renderHook(() => useCloseoutChefForecast(closeoutDate));

    expect(result.current.status).toBe('matched');
    if (result.current.status === 'matched') {
      expect(result.current.isSynthetic).toBe(true);
      expect(result.current.forecast.targetDate).toBe(closeoutDate);
    }
  });
});
