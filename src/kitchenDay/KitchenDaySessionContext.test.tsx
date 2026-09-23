/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as detectEmbed from '../gamebus/detectEmbed';
import {
  ingestInputCollectionsForTests,
  ingestTaskForTests,
  resetGameBusBridgeForTests,
} from '../gamebus/bridge';
import { kitchenDayTaskFixture } from '../gamebus/kitchenDayTaskFixtures';
import { KitchenDayApp } from './KitchenDayApp';
import { KitchenDaySessionProvider, useKitchenDaySession } from './KitchenDaySessionContext';
import { ensureKitchenDayLockedSession } from './session/lock';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function Probe() {
  const value = useKitchenDaySession();
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
  kitchenGroupInput: {
    activities: [
      {
        id: 'act-trim-1',
        start: '2026-09-23T10:00:00.000Z',
        end: '2026-09-23T10:03:00.000Z',
        actor: { id: 'user-1', name: 'Student' },
        template: { slug: 'trimSmart' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: 'kitchen-day:kitchen-day-task-1:2026-09-23' } },
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
          { template: { slug: 'sessionId' }, value: { value: 'kitchen-day:kitchen-day-task-1:2026-09-23' } },
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
          { template: { slug: 'sessionId' }, value: { value: 'kitchen-day:kitchen-day-task-1:2026-09-23' } },
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
    vi.restoreAllMocks();
    setHash('');
  });

  it('shows initializing in embed before TASK and locks the session once TASK arrives', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    setHash('#/kitchen-day');
    render(<KitchenDayApp />);
    expect(screen.getByTestId('kitchen-day-initializing')).toBeInTheDocument();
    ingestTaskForTests(kitchenDayTaskFixture);
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-page')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-header-session')).toHaveTextContent(/one shared session/);
  });

  it('does not replace a locked session when a later TASK is ignored', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    render(
      <KitchenDaySessionProvider now={new Date('2026-09-23T10:00:00.000Z')}>
        <Probe />
      </KitchenDaySessionProvider>,
    );
    expect(screen.getByTestId('kd-status')).toHaveTextContent('initializing');
    ingestTaskForTests(kitchenDayTaskFixture);
    await waitFor(() => {
      expect(screen.getByTestId('kd-session-id')).toHaveTextContent(
        'kitchen-day:kitchen-day-task-1:2026-09-23',
      );
    });
    ingestTaskForTests({ ...kitchenDayTaskFixture, id: 'other-task' });
    expect(screen.getByTestId('kd-session-id')).toHaveTextContent(
      'kitchen-day:kitchen-day-task-1:2026-09-23',
    );
  });

  it('keeps the locked session date when the open page crosses Helsinki midnight', () => {
    const locked = ensureKitchenDayLockedSession(null, {
      embedded: true,
      taskId: 'kitchen-day-task-1',
      now: new Date('2026-09-22T20:30:00.000Z'),
    });
    const reused = ensureKitchenDayLockedSession(locked, {
      embedded: true,
      taskId: 'kitchen-day-task-1',
      now: new Date('2026-09-22T21:30:00.000Z'),
    });
    expect(reused.sessionDate).toBe('2026-09-22');
    expect(reused.sessionId).toBe(locked.sessionId);
  });

  it('hydrates Trim, Rescue, and Portion after reload from group activities', async () => {
    const session = {
      sessionId: 'kitchen-day:kitchen-day-task-1:2026-09-23',
      sessionDate: '2026-09-23',
    };
    render(
      <KitchenDaySessionProvider initialSession={session}>
        <Probe />
      </KitchenDaySessionProvider>,
    );
    ingestInputCollectionsForTests(persistedCollections);
    await waitFor(() => {
      expect(screen.getByTestId('kd-trim-count')).toHaveTextContent('1');
    });
    expect(screen.getByTestId('kd-ids')).toHaveTextContent('carrot');
  });

  it('reconstructs My Day and blocks the same ingredient after reload', async () => {
    const session = {
      sessionId: 'kitchen-day:kitchen-day-task-1:2026-09-23',
      sessionDate: '2026-09-23',
    };
    function CommitProbe() {
      const { commitTrimEntry, recordedIngredientIds } = useKitchenDaySession();
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
              ingredientCategory: 'root',
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
    const { MyDayView } = await import('./MyDayView');
    render(
      <KitchenDaySessionProvider initialSession={session}>
        <MyDayView />
        <CommitProbe />
      </KitchenDaySessionProvider>,
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
});
