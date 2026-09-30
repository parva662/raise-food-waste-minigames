import { useEffect, useState } from 'react';
import {
  getGameBusInputCollections,
  startGameBusHandshake,
  subscribeGameBusInputCollections,
} from '@/platform/gamebus/bridge';
import { isGameBusEmbed } from '@/platform/gamebus/detectEmbed';
import { extractGroupActivities, getRawKitchenSelfActivitiesInput } from '@/platform/gamebus/groupActivities';
import { getAuthenticatedGameBusUser } from '@/platform/gamebus/inputCollections';
import { buildKitchenSkillsStudentProgressSessions } from '@/products/kitchen-skills-challenge/read/studentProgressSessions';
import type { KitchenSkillsTrainerSession } from '@/products/kitchen-skills-challenge/domain/types';

export function useKitchenSkillsStudentProgressData(): {
  actorId: string | null;
  sessions: KitchenSkillsTrainerSession[];
} {
  const [actorId, setActorId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<KitchenSkillsTrainerSession[]>([]);

  useEffect(() => {
    const stop = isGameBusEmbed() ? startGameBusHandshake() : () => undefined;
    const sync = () => {
      const payload = getGameBusInputCollections();
      const user = getAuthenticatedGameBusUser(payload);
      setActorId(user?.id ?? null);
      setSessions(
        buildKitchenSkillsStudentProgressSessions(
          extractGroupActivities(getRawKitchenSelfActivitiesInput(payload)),
          { actorId: user?.id ?? null, actorName: user?.name ?? null },
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
