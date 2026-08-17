import { useEffect, useMemo } from 'react';
import { isChefResultsGameBusDebugMode } from '../gamebus/chefResultsInvestigation';
import { getAuthenticatedGameBusUser } from '../gamebus/inputCollections';
import { useGameBusEmbed } from '../gamebus/useGameBusEmbed';

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
    if (!isChefResultsGameBusDebugMode() || !embedded || !user) return;
    console.info('[gamebus] authenticated user', { id: user.id, name: user.name });
  }, [embedded, user]);

  return {
    embedded,
    inputCollectionsReady,
    user,
  };
}
