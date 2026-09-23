/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { ingestInputCollectionsForTests, resetGameBusBridgeForTests } from '../gamebus/bridge';
import { KitchenDayApp } from './KitchenDayApp';

const sessionOne = 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23';

const baseActivities = [
  {
    id: 'act-trim-1',
    actor: { id: 'user-1', name: 'Student One' },
    template: { slug: 'trimSmart' },
    start: '2026-09-23T10:00:00.000Z',
    end: '2026-09-23T10:03:00.000Z',
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionOne } },
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
];

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('Kitchen Day session-level chef review', () => {
  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    setHash('');
  });

  it('keeps chef scores unanswered until entered and accepts 0 without module scores', async () => {
    const user = userEvent.setup();
    setHash(`#/kitchen-day/chef?sessionId=${encodeURIComponent(sessionOne)}`);
    render(<KitchenDayApp />);
    ingestInputCollectionsForTests({
      kitchenGroupInput: { activities: baseActivities },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-form')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-review-unscored')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-chef-reference-carrot')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-review-time-value')).not.toBeInTheDocument();
    expect(screen.queryByText(/module score/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-no-leaderboard')).toBeInTheDocument();

    await user.click(screen.getByTestId('kitchen-day-review-submit'));
    expect(screen.getByTestId('kitchen-day-review-error')).toBeInTheDocument();

    await user.type(screen.getByTestId('kitchen-day-review-time'), '6');
    await user.type(screen.getByTestId('kitchen-day-review-quality'), '3');
    await user.click(screen.getByTestId('kitchen-day-review-submit'));
    expect(screen.getByTestId('kitchen-day-review-error')).toBeInTheDocument();

    await user.clear(screen.getByTestId('kitchen-day-review-time'));
    await user.type(screen.getByTestId('kitchen-day-review-time'), '0');
    await user.clear(screen.getByTestId('kitchen-day-review-quality'));
    await user.type(screen.getByTestId('kitchen-day-review-quality'), '5');
    await user.click(screen.getByTestId('kitchen-day-review-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-submitted')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-review-time-value')).toHaveTextContent('0');
    expect(screen.getByTestId('kitchen-day-review-quality-value')).toHaveTextContent('5');
    expect(screen.queryByTestId('kitchen-day-review-form')).not.toBeInTheDocument();
  });

  it('shows an existing review read-only instead of creating another', async () => {
    setHash(`#/kitchen-day/chef?sessionId=${encodeURIComponent(sessionOne)}`);
    render(<KitchenDayApp />);
    ingestInputCollectionsForTests({
      kitchenGroupInput: {
        activities: [
          ...baseActivities,
          {
            id: 'act-review-1',
            actor: { id: 'chef-1', name: 'Chef One' },
            template: { slug: 'wastePracticeReview' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionOne } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T15:00:00.000Z' } },
              { template: { slug: 'timeEfficiencyScore' }, value: { value: 4 } },
              { template: { slug: 'preparationQualityScore' }, value: { value: 3 } },
              { template: { slug: 'chefFeedback' }, value: { value: 'Steady work.' } },
            ],
          },
        ],
      },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-submitted')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-review-time-value')).toHaveTextContent('4');
    expect(screen.getByTestId('kitchen-day-review-feedback-value')).toHaveTextContent('Steady work.');
    expect(screen.queryByTestId('kitchen-day-review-submit')).not.toBeInTheDocument();
  });
});
