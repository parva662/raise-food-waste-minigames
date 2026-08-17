import { useMemo } from 'react';
import { SERVICE_CLOSEOUT_CONFIG } from '../config/serviceCloseout';
import { useGameBusEmbed } from '../gamebus/useGameBusEmbed';
import { resolveCloseoutChefForecastFromInputCollections } from './forecast/resolveCloseoutChefForecast';
import type { CloseoutChefForecastResolution } from './forecast/gameBusChefForecastTypes';

export function useCloseoutChefForecast(serviceDate: string): CloseoutChefForecastResolution {
  const { embedded, inputCollections, inputCollectionsReady } = useGameBusEmbed();
  const syntheticForecastFallback = SERVICE_CLOSEOUT_CONFIG.syntheticForecastFallbackEnabled;

  return useMemo(
    () =>
      resolveCloseoutChefForecastFromInputCollections(
        inputCollections,
        serviceDate,
        embedded,
        inputCollectionsReady,
        { syntheticForecastFallback },
      ),
    [embedded, inputCollections, inputCollectionsReady, serviceDate, syntheticForecastFallback],
  );
}
