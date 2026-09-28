import { useMemo } from 'react';
import { SERVICE_CLOSEOUT_CONFIG } from '@/products/service-closeout/config';
import { useGameBusEmbed } from '@/platform/gamebus/useGameBusEmbed';
import { resolveCloseoutChefForecastFromInputCollections } from '@/products/service-closeout/forecast/resolveCloseoutChefForecast';
import type { CloseoutChefForecastResolution } from '@/products/service-closeout/forecast/gameBusChefForecastTypes';

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
