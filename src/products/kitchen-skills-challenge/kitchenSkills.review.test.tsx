/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as detectEmbed from '@/platform/gamebus/detectEmbed';
import { ingestInputCollectionsForTests, ingestTaskForTests, resetGameBusBridgeForTests } from '@/platform/gamebus/bridge';
import { AppRouter } from '@/app/AppRouter';
import { kitchenSkillsTrainerTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import { resetKitchenSkillsPostStateForTests } from '@/products/kitchen-skills-challenge/gamebus/postActivity';

const sessionOne = 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23';
const sessionTwo = 'kitchen-day:kitchen-day-task-1:user-2:2026-09-23';
const sessionSelfOnly = 'kitchen-day:kitchen-day-task-1:user-self:2026-09-23';

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

function selfOnlyTrimActivity() {
  return {
    id: 'act-trim-self-only',
    actor: { id: 'user-self', name: 'Self Only' },
    template: { slug: 'trimSmart' },
    start: '2026-09-23T10:00:00.000Z',
    end: '2026-09-23T10:03:00.000Z',
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionSelfOnly } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:03:00.000Z' } },
      { template: { slug: 'ingredientId' }, value: { value: 'potato' } },
      { template: { slug: 'ingredientName' }, value: { value: 'Potato' } },
      { template: { slug: 'ingredientWeightGrams' }, value: { value: 1000 } },
      { template: { slug: 'trimTechniques' }, value: { value: 'dice' } },
      { template: { slug: 'estimatedWasteGrams' }, value: { value: 100 } },
      { template: { slug: 'actualWasteGrams' }, value: { value: 80 } },
      { template: { slug: 'duration' }, obj: { value: 2, unit: 'minutes' } },
    ],
  };
}

function secondStudentTrimActivity() {
  return {
    id: 'act-trim-2',
    actor: { id: 'user-2', name: 'Student Two' },
    template: { slug: 'trimSmart' },
    start: '2026-09-23T10:00:00.000Z',
    end: '2026-09-23T10:03:00.000Z',
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionTwo } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:03:00.000Z' } },
      { template: { slug: 'ingredientId' }, value: { value: 'onion' } },
      { template: { slug: 'ingredientName' }, value: { value: 'Onion' } },
      { template: { slug: 'ingredientWeightGrams' }, value: { value: 1000 } },
      { template: { slug: 'trimTechniques' }, value: { value: 'dice' } },
      { template: { slug: 'estimatedWasteGrams' }, value: { value: 100 } },
      { template: { slug: 'actualWasteGrams' }, value: { value: 80 } },
      { template: { slug: 'duration' }, obj: { value: 2, unit: 'minutes' } },
    ],
  };
}

describe('Kitchen Day module chef review', () => {
  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    resetKitchenSkillsPostStateForTests();
    setHash('');
    vi.restoreAllMocks();
  });

  it('keeps chef scores unanswered until entered and accepts 0 without module scores', async () => {
    const user = userEvent.setup();
    setHash(`#/kitchen-day-tutor?sessionId=${encodeURIComponent(sessionOne)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenGroupInput: { activities: [{ id: 'chef-forecast', template: { slug: 'chefForecast' }, actor: { id: 'chef-1', name: 'Chef' }, properties: [] }] },
      kitchenSkillsTrainerInput: { activities: baseActivities },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-form')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-review-unscored')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-chef-reference-carrot')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-review-time-value')).not.toBeInTheDocument();
    expect(screen.queryByText(/module score/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/leaderboard|percentile/i)).not.toBeInTheDocument();

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
    setHash(`#/kitchen-day-tutor?sessionId=${encodeURIComponent(sessionOne)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenGroupInput: {
        activities: [
          {
            id: 'chef-forecast',
            actor: { id: 'chef-1', name: 'Chef' },
            template: { slug: 'chefForecast' },
            properties: [],
          },
        ],
      },
      kitchenSkillsTrainerInput: {
        activities: [
          ...baseActivities,
          {
            id: 'act-review-1',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'wastePracticeReview' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionOne } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T15:00:00.000Z' } },
              { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
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

  it('leaves Rescue open for assessment after a Trim review', async () => {
    const user = userEvent.setup();
    setHash(`#/kitchen-day-tutor?sessionId=${encodeURIComponent(sessionOne)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenGroupInput: {
        activities: [
          {
            id: 'chef-forecast',
            actor: { id: 'chef-1', name: 'Chef' },
            template: { slug: 'chefForecast' },
            properties: [],
          },
        ],
      },
      kitchenSkillsTrainerInput: {
        activities: [
          ...baseActivities,
          {
            id: 'act-rescue-1',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'rescueAndReuse' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionOne } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
              { template: { slug: 'reusableWasteGrams' }, value: { value: 200 } },
              { template: { slug: 'reuseDestination' }, value: { value: 'Soup' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:10:00.000Z' } },
            ],
          },
          {
            id: 'act-review-trim',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'wastePracticeReview' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionOne } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T15:00:00.000Z' } },
              { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
              { template: { slug: 'timeEfficiencyScore' }, value: { value: 4 } },
              { template: { slug: 'preparationQualityScore' }, value: { value: 3 } },
            ],
          },
        ],
      },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-submitted')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('kitchen-day-review-form')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('kitchen-day-tutor-module-tab-rescueAndReuse'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-rescueAndReuse-form')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('kitchen-day-review-rescueAndReuse-submitted')).not.toBeInTheDocument();
  });

  it('lists trainer staff from kitchenSkillsTrainerInput.activities only', async () => {
    setHash('#/kitchen-day-tutor');
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenGroupInputSelf: { activities: [selfOnlyTrimActivity()] },
      kitchenGroupInput: { activities: [secondStudentTrimActivity()] },
      kitchenSkillsTrainerInput: { activities: baseActivities },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-staff-user-1')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('kitchen-day-tutor-staff-user-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-tutor-staff-user-self')).not.toBeInTheDocument();
    expect(screen.queryByText('Self Only')).not.toBeInTheDocument();
  });

  it('posts SILENT_ACTIVITY with the selected student actor and keeps the tutor iframe open', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    setHash(`#/kitchen-day-tutor?actorId=user-1&sessionId=${encodeURIComponent(sessionOne)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenGroupInput: {
        activities: [{ id: 'chef-forecast', template: { slug: 'chefForecast' }, actor: { id: 'chef-1', name: 'Chef' }, properties: [] }],
      },
      kitchenSkillsTrainerInput: { activities: [...baseActivities, secondStudentTrimActivity()] },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-form')).toBeInTheDocument();
    });
    await user.type(screen.getByTestId('kitchen-day-review-time'), '4');
    await user.type(screen.getByTestId('kitchen-day-review-quality'), '5');
    await user.type(screen.getByTestId('kitchen-day-review-feedback'), 'Steady work.');
    await user.click(screen.getByTestId('kitchen-day-review-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-submitted')).toBeInTheDocument();
    });

    const activityCalls = postMessage.mock.calls
      .map((call) => call[0])
      .filter((payload): payload is { type: string; data?: { template?: string; actors?: string[]; properties?: { template: string; obj: Record<string, unknown> }[] } } =>
        Boolean(payload && typeof payload === 'object' && 'type' in payload),
      );
    const reviewMessage = activityCalls.find(
      (payload) => payload.type === 'SILENT_ACTIVITY' && payload.data?.template === 'wastePracticeReview',
    );
    expect(reviewMessage?.data?.template).toBe('wastePracticeReview');
    expect(reviewMessage?.data?.actors).toEqual(['user-1']);
    const properties = reviewMessage?.data?.properties ?? [];
    expect(properties.map((property) => property.template)).toEqual([
      'sessionId',
      'sessionDate',
      'submittedAt',
      'reviewedGame',
      'timeEfficiencyScore',
      'preparationQualityScore',
      'chefFeedback',
    ]);
    expect(properties.map((property) => property.template)).not.toContain('studentId');
    expect(properties.find((property) => property.template === 'sessionId')?.obj).toEqual({ value: sessionOne });
    expect(properties.find((property) => property.template === 'sessionDate')?.obj).toEqual({ value: '2026-09-23' });
    expect(properties.find((property) => property.template === 'reviewedGame')?.obj).toEqual({ value: 'trimSmart' });
    expect(properties.find((property) => property.template === 'timeEfficiencyScore')?.obj).toEqual({ value: 4 });
    expect(properties.find((property) => property.template === 'preparationQualityScore')?.obj).toEqual({ value: 5 });
    expect(properties.find((property) => property.template === 'chefFeedback')?.obj).toEqual({ value: 'Steady work.' });
    expect(activityCalls.some((payload) => payload.type === 'ACTIVITY')).toBe(false);
    expect(activityCalls.some((payload) => payload.type === 'EXIT')).toBe(false);
    expect(screen.getByTestId('kitchen-day-tutor-page')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-review-submit')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('kitchen-day-tutor-back-staff'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-back-staff-list')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('kitchen-day-tutor-back-staff-list'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-staff-user-2')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('kitchen-day-tutor-staff-user-2'));
    await waitFor(() => {
      expect(screen.getByTestId(`kitchen-day-chef-session-${sessionTwo}`)).toBeInTheDocument();
    });
    await user.click(screen.getByTestId(`kitchen-day-chef-session-${sessionTwo}`));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-form')).toBeInTheDocument();
    });
  });
});
