/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AppRouter } from '../AppRouter';
import { ingestInputCollectionsForTests, resetGameBusBridgeForTests } from '../gamebus/bridge';
import { getAppMode } from '../gamebus/appMode';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('Kitchen Day page split', () => {
  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    setHash('');
  });

  it('keeps activity navigation to Trim, Reuse, and Portion only', () => {
    setHash('#/kitchen-day');
    render(<AppRouter />);
    expect(getAppMode()).toBe('kitchen-day');
    expect(screen.getByTestId('kitchen-day-nav-trim')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-nav-reuse')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-nav-portion')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-nav-chef')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Progress' })).not.toBeInTheDocument();
    expect(screen.queryByText(/idle/i)).not.toBeInTheDocument();
  });

  it('opens the separate progress and tutor routes', async () => {
    const user = userEvent.setup();
    setHash('#/kitchen-day-progress');
    render(<AppRouter />);
    expect(getAppMode()).toBe('kitchen-day-progress');
    expect(screen.getByTestId('kitchen-day-progress-page')).toBeInTheDocument();
    await user.click(screen.getByTestId('kitchen-day-progress-tab-progress'));
    expect(screen.getByTestId('kitchen-day-progress-history')).toBeInTheDocument();

    setHash('#/kitchen-day-tutor');
    expect(getAppMode()).toBe('kitchen-day-tutor');
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-page')).toBeInTheDocument();
    });
  });

  it('excludes other actors from student progress', async () => {
    setHash('#/kitchen-day-progress');
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenGroupInput: {
        activities: [
          {
            id: 'own',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'trimSmart' },
            start: '2026-09-23T10:00:00.000Z',
            end: '2026-09-23T10:03:00.000Z',
            properties: [
              { template: { slug: 'sessionId' }, value: { value: 'kitchen-day:t:user-1:2026-09-23' } },
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
            id: 'other',
            actor: { id: 'user-2', name: 'Student Two' },
            template: { slug: 'trimSmart' },
            start: '2026-09-23T10:00:00.000Z',
            end: '2026-09-23T10:03:00.000Z',
            properties: [
              { template: { slug: 'sessionId' }, value: { value: 'kitchen-day:t:user-2:2026-09-23' } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:03:00.000Z' } },
              { template: { slug: 'ingredientId' }, value: { value: 'onion' } },
              { template: { slug: 'ingredientName' }, value: { value: 'Onion' } },
              { template: { slug: 'ingredientCategory' }, value: { value: 'root' } },
              { template: { slug: 'ingredientWeightGrams' }, value: { value: 800 } },
              { template: { slug: 'trimTechniques' }, value: { value: 'dice' } },
              { template: { slug: 'estimatedWasteGrams' }, value: { value: 80 } },
              { template: { slug: 'actualWasteGrams' }, value: { value: 70 } },
              { template: { slug: 'duration' }, obj: { value: 2, unit: 'minutes' } },
            ],
          },
        ],
      },
      inputCollectionPari: { me: { id: 'user-1', firstName: 'Student', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-progress-trim-carrot')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('kitchen-day-progress-trim-onion')).not.toBeInTheDocument();
  });
});
