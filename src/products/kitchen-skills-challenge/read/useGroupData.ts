import { useEffect, useState } from 'react';
import {
  getGameBusInputCollections,
  startGameBusHandshake,
  subscribeGameBusInputCollections,
} from '@/platform/gamebus/bridge';
import { isGameBusEmbed } from '@/platform/gamebus/detectEmbed';
import { extractGroupActivities, getRawKitchenGroupActivitiesInput } from '@/platform/gamebus/groupActivities';
import { getAuthenticatedGameBusUser } from '@/platform/gamebus/inputCollections';
import { buildKitchenDayChefSessions } from '@/products/kitchen-skills-challenge/read/chefSessions';
import type { KitchenDayChefSession } from '@/products/kitchen-skills-challenge/domain/types';

export function useKitchenDayGroupData(): {
  actorId: string | null;
  sessions: KitchenDayChefSession[];
} {
  const [actorId, setActorId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<KitchenDayChefSession[]>([]);

  useEffect(() => {
    const stop = isGameBusEmbed() ? startGameBusHandshake() : () => undefined;
    const sync = () => {
      const payload = getGameBusInputCollections();
      setActorId(getAuthenticatedGameBusUser(payload)?.id ?? null);
      setSessions(
        buildKitchenDayChefSessions(
          extractGroupActivities(getRawKitchenGroupActivitiesInput(payload)),
        ),
      );
    };
    sync();
    const unsubscribe = subscribeGameBusInputCollections(sync);
    return () => {
      unsubscribe();
      stop();
    };
  }, []);

  return { actorId, sessions };
}
