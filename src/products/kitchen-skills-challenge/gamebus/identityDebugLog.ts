import { isGameBusEmbed } from '@/platform/gamebus/detectEmbed';
import { getGameBusInputCollections } from '@/platform/gamebus/bridge';
import { extractGroupActivities, getActivityTemplateReference, getRawKitchenGroupActivitiesInput } from '@/platform/gamebus/groupActivities';
import { getAuthenticatedGameBusUser } from '@/platform/gamebus/inputCollections';
import {
  readActivityActorId,
  readActivityActorName,
  readActivityId,
} from '@/products/kitchen-skills-challenge/read/kitchenSkillsReadModel';

export const KITCHEN_SKILLS_ACTOR_COMPARE_PREFIX = '[kitchen-skills][actor-compare]';

/**
 * Temporary diagnostic: compare /api/me id with every kitchenGroupInput activity actor.
 * Does not change session identity, filtering, or hydration.
 */
export function logKitchenSkillsIdentityDebug(_options: {
  sessionDate: string | null;
  lockedSessionId: string | null;
}): void {
  if (!isGameBusEmbed()) return;

  const payload = getGameBusInputCollections();
  const me = getAuthenticatedGameBusUser(payload);
  const raw = getRawKitchenGroupActivitiesInput(payload);
  const activities = extractGroupActivities(raw);
  const actors = activities.map((activity) => ({
    activityId: readActivityId(activity),
    actorId: readActivityActorId(activity),
    actorName: readActivityActorName(activity),
    template: getActivityTemplateReference(activity),
  }));

  console.info(KITCHEN_SKILLS_ACTOR_COMPARE_PREFIX, {
    meId: me?.id ?? null,
    meName: me?.name ?? null,
    actors,
  });
}
