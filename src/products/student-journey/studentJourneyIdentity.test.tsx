// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STUDENT_ACTIVITY_REF } from '@/app/routes';
import {
  ingestInputCollectionsForTests,
  resetGameBusBridgeForTests,
} from '@/platform/gamebus/bridge';
import * as detectEmbedModule from '@/platform/gamebus/detectEmbed';
import { StudentJourneyApp } from '@/products/student-journey/StudentJourneyApp';

function lunchActivity(overrides: {
  id: string;
  actorId: string;
  targetDate: string;
  mealType: 'regular' | 'soup' | 'no_lunch';
  submittedAt: string;
  mainQuantity?: number;
  vegetarianQuantity?: number;
  soupQuantity?: number;
  dessertQuantity?: number;
}) {
  return {
    id: overrides.id,
    actor: { id: overrides.actorId, name: overrides.actorId },
    createdAt: overrides.submittedAt,
    template: { slug: STUDENT_ACTIVITY_REF },
    properties: [
      { template: { slug: 'targetDate' }, value: { value: overrides.targetDate } },
      { template: { slug: 'mealType' }, value: { value: overrides.mealType } },
      {
        template: { slug: 'mainQuantity' },
        value: { value: overrides.mainQuantity ?? (overrides.mealType === 'regular' ? 1 : 0) },
      },
      {
        template: { slug: 'vegetarianQuantity' },
        value: { value: overrides.vegetarianQuantity ?? 0 },
      },
      {
        template: { slug: 'soupQuantity' },
        value: { value: overrides.soupQuantity ?? (overrides.mealType === 'soup' ? 1 : 0) },
      },
      {
        template: { slug: 'dessertQuantity' },
        value: { value: overrides.dessertQuantity ?? (overrides.mealType === 'soup' ? 1 : 0) },
      },
      { template: { slug: 'submittedAt' }, value: { value: overrides.submittedAt } },
    ],
  };
}

function payload(userId: string, activities: unknown[]) {
  return {
    inputCollectionPari: {
      me: { id: userId, firstName: 'Test', lastName: 'Student' },
    },
    kitchenGroupInputSelf: { activities },
  };
}

describe('My Food Journey identity isolation', () => {
  beforeEach(() => {
    vi.spyOn(detectEmbedModule, 'isGameBusEmbed').mockReturnValue(true);
    resetGameBusBridgeForTests();
  });

  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    vi.restoreAllMocks();
  });

  it('shows only the authenticated student lunch rows from the self feed', async () => {
    const user = userEvent.setup();
    const activities = [
      lunchActivity({
        id: 'mine-1',
        actorId: 'student-a',
        targetDate: '2026-10-28',
        mealType: 'no_lunch',
        submittedAt: '2026-10-27T12:00:00.000Z',
      }),
      lunchActivity({
        id: 'other-1',
        actorId: 'student-b',
        targetDate: '2026-10-27',
        mealType: 'regular',
        submittedAt: '2026-10-26T12:00:00.000Z',
      }),
    ];

    render(<StudentJourneyApp />);
    act(() => {
      ingestInputCollectionsForTests(payload('student-a', activities));
    });

    await waitFor(() => {
      expect(screen.getByTestId('journey-declaration-count')).toHaveTextContent('1');
    });
    expect(screen.getByTestId('journey-service-date-count')).toHaveTextContent('1');

    await user.click(screen.getByRole('tab', { name: 'My Progress' }));
    expect(screen.getByTestId('journey-history-list').textContent).toMatch(/No lunch/i);
    expect(screen.getByTestId('journey-history-list').textContent).not.toMatch(/Classic dish/i);
  });

  it('hides history until authenticated identity is present', async () => {
    render(<StudentJourneyApp />);
    act(() => {
      ingestInputCollectionsForTests({
        kitchenGroupInputSelf: {
          activities: [
            lunchActivity({
              id: 'orphan',
              actorId: 'student-a',
              targetDate: '2026-10-28',
              mealType: 'regular',
              submittedAt: '2026-10-27T12:00:00.000Z',
            }),
          ],
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('student-journey-identity-missing')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('journey-declaration-count')).toHaveTextContent('0');
  });
});
