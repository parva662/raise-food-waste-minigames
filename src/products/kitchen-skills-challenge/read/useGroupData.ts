import { useEffect, useState } from 'react';
import {
  getGameBusInputCollections,
  startGameBusHandshake,
  subscribeGameBusInputCollections,
} from '@/platform/gamebus/bridge';
import { isGameBusEmbed } from '@/platform/gamebus/detectEmbed';
import { extractGroupActivities, getRawKitchenGroupActivitiesInput } from '@/platform/gamebus/groupActivities';
import { getAuthenticatedGameBusUser } from '@/platform/gamebus/inputCollections';
import { buildKitchenSkillsTrainerSessions } from '@/products/kitchen-skills-challenge/read/trainerSessions';
import type { KitchenSkillsTrainerSession } from '@/products/kitchen-skills-challenge/domain/types';

export function useKitchenSkillsGroupData(): {
  actorId: string | null;
  sessions: KitchenSkillsTrainerSession[];
} {
  const [actorId, setActorId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<KitchenSkillsTrainerSession[]>([]);

  useEffect(() => {
    const stop = isGameBusEmbed() ? startGameBusHandshake() : () => undefined;
    const sync = () => {
      const payload = getGameBusInputCollections();
      setActorId(getAuthenticatedGameBusUser(payload)?.id ?? null);
      setSessions(
        buildKitchenSkillsTrainerSessions(
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
