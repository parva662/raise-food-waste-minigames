import { useEffect, useMemo } from 'react';
import { isForecastResultsGameBusDebugMode } from '@/products/forecast-results/debug/forecastResultsInvestigation';
import { logForecastIdentityDebug } from '@/products/forecast-results/debug/logForecastIdentityDebug';
import { getAuthenticatedGameBusUser } from '@/platform/gamebus/inputCollections';
import { useGameBusEmbed } from '@/platform/gamebus/useGameBusEmbed';

/**
 * Real authenticated GameBus identity from `inputCollectionPari.me`.
 * Separate from fixture calculation user selection in standalone development.
 */
export function useGameBusAuthenticatedUser() {
  const { embedded, inputCollections, inputCollectionsReady } = useGameBusEmbed();
  const user = useMemo(
    () => getAuthenticatedGameBusUser(inputCollections),
    [inputCollections],
  );

  useEffect(() => {
    if (!isForecastResultsGameBusDebugMode() || !embedded || !inputCollectionsReady) return;
    // Scalar lines only — some GameBus console UIs collapse objects to "Object".
    logForecastIdentityDebug(inputCollections);
  }, [embedded, inputCollections, inputCollectionsReady]);

  return {
    embedded,
    inputCollectionsReady,
    user,
  };
}
