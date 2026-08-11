import { useMemo } from 'react';
import { useGameBusEmbed } from '../gamebus/useGameBusEmbed';
import { resolveCloseoutChefForecastFromInputCollections } from './forecast/resolveCloseoutChefForecast';
import type { CloseoutChefForecastResolution } from './forecast/gameBusChefForecastTypes';

export function useCloseoutChefForecast(serviceDate: string): CloseoutChefForecastResolution {
  const { embedded, inputCollections, inputCollectionsReady } = useGameBusEmbed();

  return useMemo(
    () =>
      resolveCloseoutChefForecastFromInputCollections(
        inputCollections,
        serviceDate,
        embedded,
        inputCollectionsReady,
      ),
    [embedded, inputCollections, inputCollectionsReady, serviceDate],
  );
}
