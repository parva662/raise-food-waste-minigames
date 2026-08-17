import { useMemo } from 'react';
import { useGameBusEmbed } from '../gamebus/useGameBusEmbed';
import { parseCloseoutTestForecastFlag } from './closeoutServiceDate';
import { resolveCloseoutChefForecastFromInputCollections } from './forecast/resolveCloseoutChefForecast';
import type { CloseoutChefForecastResolution } from './forecast/gameBusChefForecastTypes';

export function useCloseoutChefForecast(serviceDate: string): CloseoutChefForecastResolution {
  const { embedded, inputCollections, inputCollectionsReady } = useGameBusEmbed();
  const testForecastFallback = parseCloseoutTestForecastFlag();

  return useMemo(
    () =>
      resolveCloseoutChefForecastFromInputCollections(
        inputCollections,
        serviceDate,
        embedded,
        inputCollectionsReady,
        { testForecastFallback },
      ),
    [embedded, inputCollections, inputCollectionsReady, serviceDate, testForecastFallback],
  );
}
