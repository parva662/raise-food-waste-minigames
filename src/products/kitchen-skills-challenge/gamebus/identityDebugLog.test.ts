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
  KITCHEN_SKILLS_ACTOR_COMPARE_PREFIX,
  logKitchenSkillsIdentityDebug,
} from '@/products/kitchen-skills-challenge/gamebus/identityDebugLog';

describe('Kitchen Skills actor-compare diagnostic log', () => {
  afterEach(() => {
    resetGameBusBridgeForTests();
    vi.restoreAllMocks();
  });

  it('logs /api/me id and every extracted activity actor without template filtering', () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTaskFixture);
    ingestInputCollectionsForTests({
      inputCollectionPari: { me: { id: 'me-cms', firstName: 'Chef', lastName: 'Staff' } },
      kitchenGroupInput: {
        activities: {
          docs: [
            {
              id: 'act-forecast-1',
              actor: { id: 'gb-participant', name: 'staff1 Staff' },
              template: { slug: 'chefForecast' },
            },
            {
              id: 'act-trim-1',
              actor: { id: 'other-actor', name: 'Other Staff' },
              template: { slug: 'trimSmart' },
            },
          ],
        },
      },
    });

    logKitchenSkillsIdentityDebug({
      sessionDate: '2026-09-28',
      lockedSessionId: 'kitchen-day:kitchen-day-task-1:me-cms:2026-09-28',
    });

    expect(info).toHaveBeenCalledWith(KITCHEN_SKILLS_ACTOR_COMPARE_PREFIX, {
      meId: 'me-cms',
      meName: 'Chef Staff',
      actors: [
        {
          activityId: 'act-forecast-1',
          actorId: 'gb-participant',
          actorName: 'staff1 Staff',
          template: 'chefForecast',
        },
        {
          activityId: 'act-trim-1',
          actorId: 'other-actor',
          actorName: 'Other Staff',
          template: 'trimSmart',
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
