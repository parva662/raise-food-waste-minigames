/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as detectEmbed from '@/platform/gamebus/detectEmbed';
import {
  ingestInputCollectionsForTests,
  ingestTaskForTests,
  resetGameBusBridgeForTests,
} from '@/platform/gamebus/bridge';
import { kitchenSkillsTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import {
  KITCHEN_SKILLS_IDENTITY_DEBUG_PREFIX,
  logKitchenSkillsIdentityDebug,
} from '@/products/kitchen-skills-challenge/gamebus/identityDebugLog';

describe('Kitchen Skills identity diagnostic log', () => {
  afterEach(() => {
    resetGameBusBridgeForTests();
    vi.restoreAllMocks();
  });

  it('logs me vs activity.actor from the current TASK and kitchenGroupInput', () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTaskFixture);
    ingestInputCollectionsForTests({
      inputCollectionPari: { me: { id: 'me-cms', firstName: 'Chef', lastName: 'Staff' } },
      kitchenGroupInput: {
        activities: [
          {
            id: 'act-trim-1',
            actor: { id: 'gb-participant', name: 'staff1 Staff' },
            template: { slug: 'trimSmart' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: 'kitchen-day:kitchen-day-task-1:me-cms:2026-09-28' } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-28' } },
            ],
          },
        ],
      },
    });

    logKitchenSkillsIdentityDebug({
      sessionDate: '2026-09-28',
      lockedSessionId: 'kitchen-day:kitchen-day-task-1:me-cms:2026-09-28',
    });

    expect(info).toHaveBeenCalledWith(KITCHEN_SKILLS_IDENTITY_DEBUG_PREFIX, {
      taskId: 'kitchen-day-task-1',
      sessionDate: '2026-09-28',
      lockedSessionId: 'kitchen-day:kitchen-day-task-1:me-cms:2026-09-28',
      authenticatedMe: { id: 'me-cms', name: 'Chef Staff' },
      relevantActivities: [
        {
          activityId: 'act-trim-1',
          template: 'trimSmart',
          actorId: 'gb-participant',
          actorName: 'staff1 Staff',
          sessionId: 'kitchen-day:kitchen-day-task-1:me-cms:2026-09-28',
          sessionDate: '2026-09-28',
        },
      ],
    });
  });

  it('does not log when not embedded', () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(false);
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logKitchenSkillsIdentityDebug({ sessionDate: '2026-09-28', lockedSessionId: 'x' });
    expect(info).not.toHaveBeenCalled();
  });
});
