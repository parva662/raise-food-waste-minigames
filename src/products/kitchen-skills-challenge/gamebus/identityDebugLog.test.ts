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

    const trimSummary = {
      activityId: 'act-trim-1',
      template: 'trimSmart',
      actorId: 'gb-participant',
      actorName: 'staff1 Staff',
      sessionId: 'kitchen-day:kitchen-day-task-1:me-cms:2026-09-28',
      sessionDate: '2026-09-28',
    };
    expect(info).toHaveBeenCalledWith(KITCHEN_SKILLS_IDENTITY_DEBUG_PREFIX, {
      taskId: 'kitchen-day-task-1',
      sessionDate: '2026-09-28',
      lockedSessionId: 'kitchen-day:kitchen-day-task-1:me-cms:2026-09-28',
      authenticatedMe: { id: 'me-cms', name: 'Chef Staff' },
      rawActivitiesInput: [
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
      extractedActivitiesCount: 1,
      extractedActivities: [trimSummary],
      relevantActivities: [trimSummary],
    });
  });

  it('logs raw kitchenGroupInput activities before Kitchen Skills template filtering', () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTaskFixture);
    const rawActivitiesInput = {
      docs: [
        {
          id: 'act-forecast-1',
          actor: { id: 'gb-participant', name: 'staff1 Staff' },
          template: { slug: 'chefForecast' },
          properties: [{ template: { slug: 'sessionId' }, value: { value: 'other-session' } }],
        },
        {
          id: 'act-trim-1',
          actor: { id: 'other-actor', name: 'Other Staff' },
          template: { slug: 'trimSmart' },
          properties: [
            { template: { slug: 'sessionId' }, value: { value: 'kitchen-day:kitchen-day-task-1:me-cms:2026-09-28' } },
            { template: { slug: 'sessionDate' }, value: { value: '2026-09-28' } },
          ],
        },
      ],
      totalDocs: 2,
    };
    ingestInputCollectionsForTests({
      inputCollectionPari: { me: { id: 'me-cms', firstName: 'Chef', lastName: 'Staff' } },
      kitchenGroupInput: { activities: rawActivitiesInput },
    });

    logKitchenSkillsIdentityDebug({
      sessionDate: '2026-09-28',
      lockedSessionId: 'kitchen-day:kitchen-day-task-1:me-cms:2026-09-28',
    });

    const payload = info.mock.calls.find((call) => call[0] === KITCHEN_SKILLS_IDENTITY_DEBUG_PREFIX)?.[1] as {
      rawActivitiesInput: unknown;
      extractedActivitiesCount: number;
      extractedActivities: unknown[];
      relevantActivities: unknown[];
    };
    expect(payload.rawActivitiesInput).toEqual(rawActivitiesInput);
    expect(payload.extractedActivitiesCount).toBe(2);
    expect(payload.extractedActivities).toEqual([
      {
        activityId: 'act-forecast-1',
        template: 'chefForecast',
        actorId: 'gb-participant',
        actorName: 'staff1 Staff',
        sessionId: 'other-session',
        sessionDate: null,
      },
      {
        activityId: 'act-trim-1',
        template: 'trimSmart',
        actorId: 'other-actor',
        actorName: 'Other Staff',
        sessionId: 'kitchen-day:kitchen-day-task-1:me-cms:2026-09-28',
        sessionDate: '2026-09-28',
      },
    ]);
    expect(payload.relevantActivities).toEqual([
      {
        activityId: 'act-trim-1',
        template: 'trimSmart',
        actorId: 'other-actor',
        actorName: 'Other Staff',
        sessionId: 'kitchen-day:kitchen-day-task-1:me-cms:2026-09-28',
        sessionDate: '2026-09-28',
      },
    ]);
  });

  it('keeps unexpected raw kitchenGroupInput shapes visible when extraction yields nothing', () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTaskFixture);
    const rawActivitiesInput = { items: [{ id: 'hidden' }] };
    ingestInputCollectionsForTests({
      inputCollectionPari: { me: { id: 'me-cms', name: 'Chef Staff' } },
      kitchenGroupInput: { activities: rawActivitiesInput },
    });

    logKitchenSkillsIdentityDebug({ sessionDate: '2026-09-28', lockedSessionId: 'x' });

    expect(info).toHaveBeenCalledWith(
      KITCHEN_SKILLS_IDENTITY_DEBUG_PREFIX,
      expect.objectContaining({
        authenticatedMe: { id: 'me-cms', name: 'Chef Staff' },
        rawActivitiesInput,
        extractedActivitiesCount: 0,
        extractedActivities: [],
        relevantActivities: [],
      }),
    );
  });

  it('does not log when not embedded', () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(false);
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logKitchenSkillsIdentityDebug({ sessionDate: '2026-09-28', lockedSessionId: 'x' });
    expect(info).not.toHaveBeenCalled();
  });
});
