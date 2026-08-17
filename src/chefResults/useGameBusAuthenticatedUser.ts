import { useEffect, useMemo } from 'react';
import { getAuthenticatedGameBusUser } from '../gamebus/inputCollections';
import { isChefResultsGameBusInvestigationEnabled } from '../gamebus/chefResultsInvestigation';
import { useGameBusEmbed } from '../gamebus/useGameBusEmbed';

/**
 * Real authenticated GameBus identity from `inputCollectionPari.me`.
 * Separate from fixture calculation user selection.
 */
export function useGameBusAuthenticatedUser() {
  const { embedded, inputCollections, inputCollectionsReady } = useGameBusEmbed();
  const user = useMemo(
    () => getAuthenticatedGameBusUser(inputCollections),
    [inputCollections],
  );

  useEffect(() => {
    if (!isChefResultsGameBusInvestigationEnabled() || !embedded || !user) return;
    console.info('[gamebus] authenticated user', { id: user.id, name: user.name });
  }, [embedded, user]);

  return {
    embedded,
    inputCollectionsReady,
    user,
  };
}
