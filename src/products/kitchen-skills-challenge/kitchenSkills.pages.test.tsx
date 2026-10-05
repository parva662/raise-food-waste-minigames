/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AppRouter } from '@/app/AppRouter';
import { ingestInputCollectionsForTests, resetGameBusBridgeForTests } from '@/platform/gamebus/bridge';
import { getAppMode } from '@/app/routes';

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
    expect(screen.getByTestId('kitchen-day-progress-module-tabs')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-progress-trim-time-trend')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-progress-rescue-time-trend')).not.toBeInTheDocument();

    setHash('#/kitchen-day-tutor');
    expect(getAppMode()).toBe('kitchen-day-tutor');
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('kitchen-day-tutor-debug')).not.toBeInTheDocument();
  });

  it('excludes other actors from student progress', async () => {
    const user = userEvent.setup();
    setHash('#/kitchen-day-progress');
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenGroupInputSelf: {
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
        ],
      },
      kitchenSkillsTrainerInput: {
        activities: [
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
      kitchenGroupInput: {
        activities: [
          {
            id: 'chef-forecast',
            actor: { id: 'chef-1', name: 'Chef' },
            template: { slug: 'chefForecast', name: 'Chef forecast' },
            properties: [],
          },
        ],
      },
      inputCollectionPari: { me: { id: 'user-1', firstName: 'Student', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-progress-overview-trimSmart')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-progress-overview-trimSmart')).toHaveTextContent('1');
    await user.click(screen.getByTestId('kitchen-day-progress-tab-progress'));
    await waitFor(() => {
      expect(
        screen.getByTestId('kitchen-day-progress-session-trimSmart-kitchen-day:t:user-1:2026-09-23'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/onion/i)).not.toBeInTheDocument();
  });

  it('shows the student own Trim result from self activities before tutor review exists', async () => {
    const user = userEvent.setup();
    setHash('#/kitchen-day-progress');
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenGroupInputSelf: {
        activities: [
          {
            id: 'own-unreviewed',
            template: { slug: 'trimSmart' },
            start: '2026-09-23T10:00:00.000Z',
            end: '2026-09-23T10:03:00.000Z',
            properties: [
              { template: { slug: 'sessionId' }, value: { value: 'kitchen-day:t:user-1:2026-09-23' } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:03:00.000Z' } },
              { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
              { template: { slug: 'ingredientName' }, value: { value: 'Carrot' } },
              { template: { slug: 'ingredientWeightGrams' }, value: { value: 5000 } },
              { template: { slug: 'trimTechniques' }, value: { value: 'trimming' } },
              { template: { slug: 'estimatedWasteGrams' }, value: { value: 600 } },
              { template: { slug: 'actualWasteGrams' }, value: { value: 450 } },
              { template: { slug: 'duration' }, obj: { value: 3, unit: 'minutes' } },
            ],
          },
        ],
      },
      kitchenGroupInput: {
        activities: [
          {
            id: 'chef-forecast',
            actor: { id: 'chef-1', name: 'Chef' },
            template: { slug: 'chefForecast', name: 'Chef forecast' },
            properties: [],
          },
        ],
      },
      inputCollectionPari: { me: { id: 'user-1', firstName: 'Student', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-progress-overview-trimSmart')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-progress-overview-trimSmart')).toHaveTextContent(
      'No tutor assessment',
    );
    await user.click(screen.getByTestId('kitchen-day-progress-tab-progress'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-progress-tutor-empty-trimSmart')).toBeInTheDocument();
    });
    expect(screen.queryByText(/no history yet/i)).not.toBeInTheDocument();
  });

  it('hydrates tutor assessments onto Progress even when review actor differs from evidence', async () => {
    const user = userEvent.setup();
    setHash('#/kitchen-day-progress');
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenGroupInputSelf: {
        activities: [
          {
            id: 'own-trim',
            template: { slug: 'trimSmart' },
            start: '2026-09-23T10:00:00.000Z',
            end: '2026-09-23T10:03:00.000Z',
            properties: [
              { template: { slug: 'sessionId' }, value: { value: 'kitchen-day:t:user-1:2026-09-23' } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:03:00.000Z' } },
              { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
              { template: { slug: 'ingredientName' }, value: { value: 'Carrot' } },
              { template: { slug: 'ingredientWeightGrams' }, value: { value: 5000 } },
              { template: { slug: 'trimTechniques' }, value: { value: 'trimming' } },
              { template: { slug: 'estimatedWasteGrams' }, value: { value: 600 } },
              { template: { slug: 'actualWasteGrams' }, value: { value: 450 } },
              { template: { slug: 'duration' }, obj: { value: 3, unit: 'minutes' } },
            ],
          },
          {
            id: 'own-review',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'wastePracticeReview' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: 'kitchen-day:t:user-1:2026-09-23' } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T15:00:00.000Z' } },
              { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
              { template: { slug: 'timeEfficiencyScore' }, value: { value: 4 } },
              { template: { slug: 'preparationQualityScore' }, value: { value: 5 } },
              { template: { slug: 'chefFeedback' }, value: { value: 'Clean knife work.' } },
            ],
          },
        ],
      },
      inputCollectionPari: { me: { id: 'user-1', firstName: 'Student', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-progress-overview-trimSmart')).toHaveTextContent('4/5');
    });
    await user.click(screen.getByTestId('kitchen-day-progress-overview-open-trimSmart'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-progress-tutor-trimSmart')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-progress-tutor-trimSmart-time')).toHaveTextContent('4 / 5');
    expect(screen.getByTestId('kitchen-day-progress-tutor-trimSmart-quality')).toHaveTextContent('5 / 5');
    expect(screen.getByTestId('kitchen-day-progress-tutor-trimSmart-feedback')).toHaveTextContent(
      'Clean knife work.',
    );
  });

  it('keeps module tutor assessments and charts isolated under Progress tabs', async () => {
    const user = userEvent.setup();
    const sessionA = 'kitchen-day:t:user-1:2026-09-23';
    const sessionB = 'kitchen-day:t:user-1:2026-09-24';
    setHash('#/kitchen-day-progress');
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenGroupInputSelf: {
        activities: [
          {
            id: 'trim-a',
            actor: { id: 'user-1' },
            template: { slug: 'trimSmart' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionA } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:03:00.000Z' } },
              { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
              { template: { slug: 'ingredientName' }, value: { value: 'Carrot' } },
              { template: { slug: 'ingredientWeightGrams' }, value: { value: 5000 } },
              { template: { slug: 'trimTechniques' }, value: { value: 'trimming' } },
              { template: { slug: 'estimatedWasteGrams' }, value: { value: 600 } },
              { template: { slug: 'actualWasteGrams' }, value: { value: 450 } },
              { template: { slug: 'duration' }, obj: { value: 3, unit: 'minutes' } },
            ],
          },
          {
            id: 'rescue-a',
            actor: { id: 'user-1' },
            template: { slug: 'rescueAndReuse' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionA } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
              { template: { slug: 'reusableWasteGrams' }, value: { value: 200 } },
              { template: { slug: 'reuseDestination' }, value: { value: 'Soup' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:10:00.000Z' } },
            ],
          },
          {
            id: 'portion-a',
            actor: { id: 'user-1' },
            template: { slug: 'portionPrecision' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionA } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T11:00:00.000Z' } },
              { template: { slug: 'recipeId' }, value: { value: 'mayonnaise' } },
              { template: { slug: 'recipeName' }, value: { value: 'Mayonnaise' } },
              { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 1850 } },
              {
                template: { slug: 'recipeComposition' },
                value: {
                  value: [{ ingredientId: 'yogurt', ingredientName: 'Yogurt', actualAmount: 1000, unit: 'g' }],
                },
              },
            ],
          },
          {
            id: 'trim-b',
            actor: { id: 'user-1' },
            template: { slug: 'trimSmart' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionB } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-24' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-24T10:03:00.000Z' } },
              { template: { slug: 'ingredientId' }, value: { value: 'onion' } },
              { template: { slug: 'ingredientName' }, value: { value: 'Onion' } },
              { template: { slug: 'ingredientWeightGrams' }, value: { value: 1000 } },
              { template: { slug: 'trimTechniques' }, value: { value: 'dice' } },
              { template: { slug: 'estimatedWasteGrams' }, value: { value: 100 } },
              { template: { slug: 'actualWasteGrams' }, value: { value: 80 } },
              { template: { slug: 'duration' }, obj: { value: 2, unit: 'minutes' } },
            ],
          },
          {
            id: 'review-trim',
            actor: { id: 'user-1' },
            template: { slug: 'wastePracticeReview' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionA } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T15:00:00.000Z' } },
              { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
              { template: { slug: 'timeEfficiencyScore' }, value: { value: 0 } },
              { template: { slug: 'preparationQualityScore' }, value: { value: 4 } },
              { template: { slug: 'chefFeedback' }, value: { value: 'Trim feedback' } },
            ],
          },
          {
            id: 'review-rescue',
            actor: { id: 'user-1' },
            template: { slug: 'wastePracticeReview' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionA } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T15:01:00.000Z' } },
              { template: { slug: 'reviewedGame' }, value: { value: 'rescueAndReuse' } },
              { template: { slug: 'timeEfficiencyScore' }, value: { value: 3 } },
              { template: { slug: 'preparationQualityScore' }, value: { value: 3 } },
              { template: { slug: 'chefFeedback' }, value: { value: 'Rescue feedback' } },
            ],
          },
          {
            id: 'review-portion',
            actor: { id: 'user-1' },
            template: { slug: 'wastePracticeReview' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionA } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T15:02:00.000Z' } },
              { template: { slug: 'reviewedGame' }, value: { value: 'portionPrecision' } },
              { template: { slug: 'timeEfficiencyScore' }, value: { value: 5 } },
              { template: { slug: 'preparationQualityScore' }, value: { value: 2 } },
            ],
          },
          {
            id: 'review-trim-b',
            actor: { id: 'user-1' },
            template: { slug: 'wastePracticeReview' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionB } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-24' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-24T15:00:00.000Z' } },
              { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
              { template: { slug: 'timeEfficiencyScore' }, value: { value: 2 } },
              { template: { slug: 'preparationQualityScore' }, value: { value: 2 } },
              { template: { slug: 'chefFeedback' }, value: { value: 'Later trim feedback' } },
            ],
          },
        ],
      },
      inputCollectionPari: { me: { id: 'user-1', firstName: 'Student', lastName: 'One' } },
    });

    await user.click(screen.getByTestId('kitchen-day-progress-tab-progress'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-progress-tutor-trimSmart-time')).toHaveTextContent('2 / 5');
    });
    expect(screen.getByTestId('kitchen-day-progress-tutor-trimSmart-feedback')).toHaveTextContent(
      'Later trim feedback',
    );
    expect(screen.getByTestId('kitchen-day-progress-trimSmart-wastePercent-trend')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-progress-portionPrecision-ingredientAccuracyPercent-trend')).not.toBeInTheDocument();

    const trimSessions = screen.getByTestId('kitchen-day-progress-sessions-trimSmart');
    const trimSessionCards = trimSessions.querySelectorAll('[data-testid^="kitchen-day-progress-session-trimSmart-"]');
    expect(trimSessionCards[0]).toHaveAttribute(
      'data-testid',
      `kitchen-day-progress-session-trimSmart-${sessionB}`,
    );

    await user.click(screen.getByTestId('kitchen-day-progress-module-tab-rescueAndReuse'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-progress-tutor-rescueAndReuse-feedback')).toHaveTextContent(
        'Rescue feedback',
      );
    });
    expect(screen.queryByTestId('kitchen-day-progress-tutor-trimSmart')).not.toBeInTheDocument();
    expect(screen.queryByText('Trim feedback')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('kitchen-day-progress-module-tab-portionPrecision'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-progress-tutor-portionPrecision-time')).toHaveTextContent('5 / 5');
    });
    expect(screen.getByTestId('kitchen-day-progress-tutor-portionPrecision-quality')).toHaveTextContent('2 / 5');
    expect(screen.queryByText('Rescue feedback')).not.toBeInTheDocument();
  });
});
