/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as detectEmbed from '@/platform/gamebus/detectEmbed';
import {
  ingestInputCollectionsForTests,
  ingestTaskForTests,
  resetGameBusBridgeForTests,
} from '@/platform/gamebus/bridge';
import { kitchenSkillsTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import { resetKitchenSkillsPostStateForTests } from '@/products/kitchen-skills-challenge/gamebus/postActivity';
import { KitchenSkillsChallengeApp } from '@/products/kitchen-skills-challenge/surfaces/challenge/KitchenSkillsChallengeApp';
import { KitchenSkillsSessionProvider, useKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { ensureKitchenSkillsLockedSession } from '@/products/kitchen-skills-challenge/domain/session/lock';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function Probe() {
  const value = useKitchenSkillsSession();
  return (
    <div>
      <span data-testid="kd-status">{value.status}</span>
      <span data-testid="kd-session-id">{value.session?.sessionId ?? ''}</span>
      <span data-testid="kd-session-date">{value.session?.sessionDate ?? ''}</span>
      <span data-testid="kd-trim-count">{value.trimEntries.length}</span>
      <span data-testid="kd-ids">{value.recordedIngredientIds.join(',')}</span>
    </div>
  );
}

const persistedCollections = {
  kitchenGroupInputSelf: {
    activities: [
      {
        id: 'act-trim-1',
        start: '2026-09-23T10:00:00.000Z',
        end: '2026-09-23T10:03:00.000Z',
        actor: { id: 'user-1', name: 'Student' },
        template: { slug: 'trimSmart' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23' } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:03:00.000Z' } },
          { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
          { template: { slug: 'ingredientName' }, value: { value: 'Carrot' } },
          { template: { slug: 'ingredientCategory' }, value: { value: 'root' } },
          { template: { slug: 'ingredientWeightGrams' }, value: { value: 5000 } },
          { template: { slug: 'trimTechniques' }, value: { value: 'trimming' } },
          { template: { slug: 'estimatedWasteGrams' }, value: { value: 600 } },
          { template: { slug: 'actualWasteGrams' }, value: { value: 450 } },
          { template: { slug: 'duration' }, obj: { value: 3, unit: 'minutes' } },
        ],
      },
      {
        id: 'act-rescue-1',
        actor: { id: 'user-1' },
        template: { slug: 'rescueAndReuse' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23' } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
          { template: { slug: 'reusableWasteGrams' }, value: { value: 200 } },
          { template: { slug: 'reuseDestination' }, value: { value: 'Soup' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:10:00.000Z' } },
        ],
      },
      {
        id: 'act-portion-1',
        actor: { id: 'user-1' },
        template: { slug: 'portionPrecision' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23' } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T11:00:00.000Z' } },
          { template: { slug: 'recipeId' }, value: { value: 'mayonnaise' } },
          { template: { slug: 'recipeName' }, value: { value: 'Mayonnaise' } },
          { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 1850 } },
          {
            template: { slug: 'recipeComposition' },
            value: {
              value: [
                { ingredientId: 'yogurt', ingredientName: 'Yogurt', actualAmount: 1000, unit: 'g' },
              ],
            },
          },
        ],
      },
    ],
  },
  inputCollectionPari: {
    me: { id: 'user-1', firstName: 'Student', lastName: 'One' },
  },
};

describe('Kitchen Day session initialization and hydration', () => {
  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    resetKitchenSkillsPostStateForTests();
    vi.restoreAllMocks();
    setHash('');
  });

  it('shows initializing in embed until TASK and authenticated user both exist', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    setHash('#/kitchen-day');
    render(<KitchenSkillsChallengeApp now={new Date('2026-09-23T10:00:00.000Z')} />);
    expect(screen.getByTestId('kitchen-day-initializing')).toBeInTheDocument();
    ingestTaskForTests(kitchenSkillsTaskFixture);
    expect(screen.getByTestId('kitchen-day-initializing')).toBeInTheDocument();
    ingestInputCollectionsForTests({
      inputCollectionPari: { me: { id: 'user-1', firstName: 'Student', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-page')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-header-session')).toHaveTextContent(
      'Wednesday, 23 September 2026',
    );
  });

  it('does not replace a locked session when a later TASK or participant refresh arrives', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    render(
      <KitchenSkillsSessionProvider now={new Date('2026-09-23T10:00:00.000Z')}>
        <Probe />
      </KitchenSkillsSessionProvider>,
    );
    expect(screen.getByTestId('kd-status')).toHaveTextContent('initializing');
    ingestTaskForTests(kitchenSkillsTaskFixture);
    expect(screen.getByTestId('kd-status')).toHaveTextContent('initializing');
    ingestInputCollectionsForTests({
      inputCollectionPari: { me: { id: 'user-1', firstName: 'Student', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kd-session-id')).toHaveTextContent(
        'kitchen-day:kitchen-day-task-1:user-1:2026-09-23',
      );
    });
    ingestTaskForTests({ ...kitchenSkillsTaskFixture, id: 'other-task' });
    ingestInputCollectionsForTests({
      inputCollectionPari: { me: { id: 'user-9', firstName: 'Other', lastName: 'Student' } },
    });
    expect(screen.getByTestId('kd-session-id')).toHaveTextContent(
      'kitchen-day:kitchen-day-task-1:user-1:2026-09-23',
    );
  });

  it('keeps the locked session date when the open page crosses Helsinki midnight', () => {
    const locked = ensureKitchenSkillsLockedSession(null, {
      embedded: true,
      taskId: 'kitchen-day-task-1',
      actorId: 'user-1',
      now: new Date('2026-09-22T20:30:00.000Z'),
    });
    const reused = ensureKitchenSkillsLockedSession(locked, {
      embedded: true,
      taskId: 'kitchen-day-task-1',
      actorId: 'user-1',
      now: new Date('2026-09-22T21:30:00.000Z'),
    });
    expect(reused.sessionDate).toBe('2026-09-22');
    expect(reused.sessionId).toBe(locked.sessionId);
  });

  it('hydrates Trim, Rescue, and Portion after reload from kitchenGroupInputSelf', async () => {
    const session = {
      sessionId: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23',
      sessionDate: '2026-09-23',
    };
    render(
      <KitchenSkillsSessionProvider initialSession={session}>
        <Probe />
      </KitchenSkillsSessionProvider>,
    );
    ingestInputCollectionsForTests(persistedCollections);
    await waitFor(() => {
      expect(screen.getByTestId('kd-trim-count')).toHaveTextContent('1');
    });
    expect(screen.getByTestId('kd-ids')).toHaveTextContent('carrot');
  });

  it('reconstructs Session Review and blocks the same ingredient after reload', async () => {
    const session = {
      sessionId: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23',
      sessionDate: '2026-09-23',
    };
    function CommitProbe() {
      const { commitTrimEntry, recordedIngredientIds } = useKitchenSkillsSession();
      return (
        <button
          type="button"
          data-testid="kd-try-duplicate"
          onClick={() => {
            const result = commitTrimEntry({
              sessionId: session.sessionId,
              sessionDate: session.sessionDate,
              submittedAt: '2026-09-23T12:00:00.000Z',
              ingredientId: 'carrot',
              ingredientName: 'Carrot',
              ingredientWeightGrams: 1000,
              trimTechniques: 'dice',
              estimatedWasteGrams: 0,
              actualWasteGrams: 0,
              durationMinutes: 1,
              preparationStartedAt: '2026-09-23T11:59:00.000Z',
              preparationEndedAt: '2026-09-23T12:00:00.000Z',
              source: 'local',
            });
            document.body.dataset.duplicate = result.ok ? 'allowed' : result.reason;
            document.body.dataset.ids = recordedIngredientIds.join(',');
          }}
        >
          try
        </button>
      );
    }
    const { SessionReviewView } = await import('@/products/kitchen-skills-challenge/surfaces/challenge/SessionReviewView');
    render(
      <KitchenSkillsSessionProvider initialSession={session}>
        <SessionReviewView />
        <CommitProbe />
      </KitchenSkillsSessionProvider>,
    );
    ingestInputCollectionsForTests(persistedCollections);
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-trim-carrot')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-rescue-carrot')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-portion-mayonnaise')).toBeInTheDocument();
    screen.getByTestId('kd-try-duplicate').click();
    expect(document.body.dataset.duplicate).toBe('duplicate_ingredient');
  });

  it('does not hydrate kitchenGroupInput records into the student session', async () => {
    const session = {
      sessionId: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23',
      sessionDate: '2026-09-23',
    };
    render(
      <KitchenSkillsSessionProvider initialSession={session}>
        <Probe />
      </KitchenSkillsSessionProvider>,
    );
    ingestInputCollectionsForTests({
      kitchenGroupInput: {
        activities: [
          persistedCollections.kitchenGroupInputSelf.activities[0],
          {
            ...persistedCollections.kitchenGroupInputSelf.activities[0],
            id: 'act-other',
            actor: { id: 'user-2', name: 'Other' },
            properties: [
              {
                template: { slug: 'sessionId' },
                value: { value: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23' },
              },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:03:00.000Z' } },
              { template: { slug: 'ingredientId' }, value: { value: 'onion' } },
              { template: { slug: 'ingredientName' }, value: { value: 'Onion' } },
              { template: { slug: 'ingredientWeightGrams' }, value: { value: 800 } },
              { template: { slug: 'trimTechniques' }, value: { value: 'dice' } },
              { template: { slug: 'estimatedWasteGrams' }, value: { value: 80 } },
              { template: { slug: 'actualWasteGrams' }, value: { value: 70 } },
              { template: { slug: 'duration' }, obj: { value: 2, unit: 'minutes' } },
            ],
          },
        ],
      },
      inputCollectionPari: persistedCollections.inputCollectionPari,
    });
    await waitFor(() => {
      expect(screen.getByTestId('kd-trim-count')).toHaveTextContent('0');
    });
  });

  it('hydrates self activities without requiring activity.actor.id to match /api/me', async () => {
    const session = {
      sessionId: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23',
      sessionDate: '2026-09-23',
    };
    render(
      <KitchenSkillsSessionProvider initialSession={session}>
        <Probe />
      </KitchenSkillsSessionProvider>,
    );
    ingestInputCollectionsForTests({
      kitchenGroupInputSelf: {
        activities: [
          {
            ...persistedCollections.kitchenGroupInputSelf.activities[0],
            actor: { id: 'other-gamebus-actor', name: 'staff1 Staff' },
          },
          persistedCollections.kitchenGroupInputSelf.activities[1],
        ],
      },
      inputCollectionPari: persistedCollections.inputCollectionPari,
    });
    await waitFor(() => {
      expect(screen.getByTestId('kd-trim-count')).toHaveTextContent('1');
    });
    expect(screen.getByTestId('kd-ids')).toHaveTextContent('carrot');
  });

  it('retains a successful silent Trim locally immediately', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTaskFixture);
    const session = {
      sessionId: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23',
      sessionDate: '2026-09-23',
    };
    function CommitProbe() {
      const { commitTrimEntry, trimEntries, findTrimByIngredientId } = useKitchenSkillsSession();
      return (
        <button
          type="button"
          data-testid="kd-commit-trim"
          onClick={() => {
            commitTrimEntry({
              sessionId: session.sessionId,
              sessionDate: session.sessionDate,
              submittedAt: '2026-09-23T12:00:00.000Z',
              ingredientId: 'carrot',
              ingredientName: 'Carrot',
              ingredientWeightGrams: 5000,
              trimTechniques: 'trimming',
              estimatedWasteGrams: 600,
              actualWasteGrams: 450,
              durationMinutes: 3,
              preparationStartedAt: '2026-09-23T11:57:00.000Z',
              preparationEndedAt: '2026-09-23T12:00:00.000Z',
              source: 'local',
            });
            document.body.dataset.trimCount = String(trimEntries.length);
            document.body.dataset.hasCarrot = String(Boolean(findTrimByIngredientId('carrot')));
          }}
        >
          commit
        </button>
      );
    }
    render(
      <KitchenSkillsSessionProvider initialSession={session}>
        <Probe />
        <CommitProbe />
      </KitchenSkillsSessionProvider>,
    );
    screen.getByTestId('kd-commit-trim').click();
    await waitFor(() => {
      expect(screen.getByTestId('kd-trim-count')).toHaveTextContent('1');
    });
    expect(screen.getByTestId('kd-ids')).toHaveTextContent('carrot');
  });

  it('deduplicates local Trim once persisted self activities arrive', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTaskFixture);
    const session = {
      sessionId: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23',
      sessionDate: '2026-09-23',
    };
    function CommitProbe() {
      const { commitTrimEntry } = useKitchenSkillsSession();
      return (
        <button
          type="button"
          data-testid="kd-commit-trim"
          onClick={() => {
            commitTrimEntry({
              sessionId: session.sessionId,
              sessionDate: session.sessionDate,
              submittedAt: '2026-09-23T12:00:00.000Z',
              ingredientId: 'carrot',
              ingredientName: 'Carrot',
              ingredientWeightGrams: 5000,
              trimTechniques: 'trimming',
              estimatedWasteGrams: 600,
              actualWasteGrams: 450,
              durationMinutes: 3,
              preparationStartedAt: '2026-09-23T11:57:00.000Z',
              preparationEndedAt: '2026-09-23T12:00:00.000Z',
              source: 'local',
            });
          }}
        >
          commit
        </button>
      );
    }
    render(
      <KitchenSkillsSessionProvider initialSession={session}>
        <Probe />
        <CommitProbe />
      </KitchenSkillsSessionProvider>,
    );
    screen.getByTestId('kd-commit-trim').click();
    await waitFor(() => {
      expect(screen.getByTestId('kd-trim-count')).toHaveTextContent('1');
    });
    ingestInputCollectionsForTests(persistedCollections);
    await waitFor(() => {
      expect(screen.getByTestId('kd-trim-count')).toHaveTextContent('1');
    });
  });
});
