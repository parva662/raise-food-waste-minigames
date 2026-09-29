import { isGameBusEmbed } from '@/platform/gamebus/detectEmbed';
import { getGameBusInputCollections, getGameBusTask } from '@/platform/gamebus/bridge';
import { extractGroupActivities, getActivityTemplateReference, getRawKitchenGroupActivitiesInput } from '@/platform/gamebus/groupActivities';
import { getAuthenticatedGameBusUser } from '@/platform/gamebus/inputCollections';
import { KITCHEN_DAY_ACTIVITY_TEMPLATES } from '@/products/kitchen-skills-challenge/read/selectKitchenSkillsActivities';
import {
  readActivityActorId,
  readActivityActorName,
  readActivityId,
} from '@/products/kitchen-skills-challenge/read/kitchenSkillsReadModel';
import { readActivityPropertyString } from '@/products/kitchen-skills-challenge/read/groupActivityProperties';

export const KITCHEN_SKILLS_IDENTITY_DEBUG_PREFIX = '[kitchen-skills][identity-debug]';

function isKitchenSkillsTemplate(template: string | null): template is (typeof KITCHEN_DAY_ACTIVITY_TEMPLATES)[number] {
  return (
    template !== null && (KITCHEN_DAY_ACTIVITY_TEMPLATES as readonly string[]).includes(template)
  );
}

function summarizeActivity(activity: unknown) {
  return {
    activityId: readActivityId(activity),
    template: getActivityTemplateReference(activity),
    actorId: readActivityActorId(activity),
    actorName: readActivityActorName(activity),
    sessionId: readActivityPropertyString(activity, 'sessionId'),
    sessionDate: readActivityPropertyString(activity, 'sessionDate'),
  };
}

/**
 * Temporary diagnostic for live GameBus identity comparison.
 * Does not change session identity, filtering, or hydration.
 */
export function logKitchenSkillsIdentityDebug(options: {
  sessionDate: string | null;
  lockedSessionId: string | null;
}): void {
  if (!isGameBusEmbed()) return;

  const payload = getGameBusInputCollections();
  const me = getAuthenticatedGameBusUser(payload);
  const rawActivitiesInput = getRawKitchenGroupActivitiesInput(payload);
  const extractedActivities = extractGroupActivities(rawActivitiesInput).map(summarizeActivity);
  const relevantActivities = extractedActivities.filter((activity) =>
    isKitchenSkillsTemplate(activity.template),
  );

  console.info(KITCHEN_SKILLS_IDENTITY_DEBUG_PREFIX, {
    taskId: getGameBusTask()?.id ?? null,
    sessionDate: options.sessionDate,
    lockedSessionId: options.lockedSessionId,
    authenticatedMe: me ? { id: me.id, name: me.name } : null,
    rawActivitiesInput,
    extractedActivitiesCount: extractedActivities.length,
    extractedActivities,
    relevantActivities,
  });
}
