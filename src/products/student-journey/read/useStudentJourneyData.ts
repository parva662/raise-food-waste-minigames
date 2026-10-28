import { useEffect, useMemo, useState } from 'react';
import {
  getGameBusInputCollections,
  startGameBusHandshake,
  subscribeGameBusInputCollections,
} from '@/platform/gamebus/bridge';
import { isGameBusEmbed } from '@/platform/gamebus/detectEmbed';
import {
  extractGroupActivities,
  getRawKitchenSelfActivitiesInput,
} from '@/platform/gamebus/groupActivities';
import { getAuthenticatedGameBusUser } from '@/platform/gamebus/inputCollections';
import {
  buildFixtureStudentLunchActivities,
  FIXTURE_STUDENT_JOURNEY_USER,
} from '@/products/student-journey/fixtures/fixtureStudentLunchActivities';
import {
  buildStudentLunchHistory,
  type ParsedStudentLunchCheckin,
} from '@/products/student-journey/read/parseStudentLunchCheckin';
import {
  summarizeStudentParticipation,
  type StudentJourneyParticipationSummary,
} from '@/products/student-journey/read/studentJourneyModel';

export type StudentJourneyDataState = {
  embedded: boolean;
  ready: boolean;
  actorId: string | null;
  actorName: string | null;
  history: ParsedStudentLunchCheckin[];
  summary: StudentJourneyParticipationSummary;
};

export function useStudentJourneyData(): StudentJourneyDataState {
  const embedded = isGameBusEmbed();
  const [ready, setReady] = useState(!embedded);
  const [actorId, setActorId] = useState<string | null>(embedded ? null : FIXTURE_STUDENT_JOURNEY_USER.id);
  const [actorName, setActorName] = useState<string | null>(
    embedded ? null : FIXTURE_STUDENT_JOURNEY_USER.name,
  );
  const [history, setHistory] = useState<ParsedStudentLunchCheckin[]>(() =>
    embedded
      ? []
      : buildStudentLunchHistory(buildFixtureStudentLunchActivities(), {
          actorId: FIXTURE_STUDENT_JOURNEY_USER.id,
        }),
  );

  useEffect(() => {
    if (!embedded) return undefined;

    const stop = startGameBusHandshake();
    const sync = () => {
      const payload = getGameBusInputCollections();
      if (!payload) {
        setReady(false);
        return;
      }
      const user = getAuthenticatedGameBusUser(payload);
      const activities = extractGroupActivities(getRawKitchenSelfActivitiesInput(payload));
      // Require authenticated identity before exposing personal history.
      const nextHistory = user?.id
        ? buildStudentLunchHistory(activities, { actorId: user.id })
        : [];
      setActorId(user?.id ?? null);
      setActorName(user?.name ?? null);
      setHistory(nextHistory);
      setReady(true);
    };

    sync();
    const unsubscribe = subscribeGameBusInputCollections(sync);
    return () => {
      unsubscribe();
      stop();
    };
  }, [embedded]);

  const summary = useMemo(() => summarizeStudentParticipation(history), [history]);

  return {
    embedded,
    ready,
    actorId,
    actorName,
    history,
    summary,
  };
}
