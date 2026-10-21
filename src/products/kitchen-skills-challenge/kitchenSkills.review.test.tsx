/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as detectEmbed from '@/platform/gamebus/detectEmbed';
import { ingestInputCollectionsForTests, ingestTaskForTests, resetGameBusBridgeForTests } from '@/platform/gamebus/bridge';
import { AppRouter } from '@/app/AppRouter';
import { kitchenSkillsTrainerTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import { resetKitchenSkillsPostStateForTests } from '@/products/kitchen-skills-challenge/gamebus/postActivity';
import { clearKitchenSkillsReviewDispatchMarkersForTests } from '@/products/kitchen-skills-challenge/gamebus/reviewDispatchMarker';

const sessionOne = 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23';
const sessionTwo = 'kitchen-day:kitchen-day-task-1:user-2:2026-09-23';
const sessionSelfOnly = 'kitchen-day:kitchen-day-task-1:user-self:2026-09-23';

const baseRecipeId = 'test-recipe-1';

const baseActivities = [
  {
    id: 'act-portion-1',
    actor: { id: 'user-1', name: 'Student One' },
    template: { slug: 'portionPrecision' },
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionOne } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T09:00:00.000Z' } },
      { template: { slug: 'recipeId' }, value: { value: baseRecipeId } },
      { template: { slug: 'recipeName' }, value: { value: 'Test Recipe' } },
      { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 4500 } },
      {
        template: { slug: 'recipeComposition' },
        value: {
          value: [
            { ingredientId: 'carrot', ingredientName: 'Carrot', actualAmount: 5000, unit: 'g' },
          ],
        },
      },
    ],
  },
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
      { template: { slug: 'recipeId' }, value: { value: baseRecipeId } },
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

/** Trainer opens Portion first (Portion → Trim → Rescue); legacy Trim assertions switch tabs. */
async function openTrimTab(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => {
    expect(screen.getByTestId('kitchen-day-tutor-module-tab-trimSmart')).toBeInTheDocument();
  });
  await user.click(screen.getByTestId('kitchen-day-tutor-module-tab-trimSmart'));
}

async function openTrimAssessment(user: ReturnType<typeof userEvent.setup>) {
  await openTrimTab(user);
  await waitFor(() => {
    expect(screen.getByTestId('kitchen-day-review-form')).toBeInTheDocument();
  });
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
      { template: { slug: 'recipeId' }, value: { value: 'student-two-recipe' } },
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

function secondStudentPortionActivity() {
  return {
    id: 'act-portion-2',
    actor: { id: 'user-2', name: 'Student Two' },
    template: { slug: 'portionPrecision' },
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionTwo } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T09:00:00.000Z' } },
      { template: { slug: 'recipeId' }, value: { value: 'student-two-recipe' } },
      { template: { slug: 'recipeName' }, value: { value: 'Student Two Recipe' } },
      { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 900 } },
      {
        template: { slug: 'recipeComposition' },
        value: {
          value: [{ ingredientId: 'onion', ingredientName: 'Onion', actualAmount: 1000, unit: 'g' }],
        },
      },
    ],
  };
}

describe('Kitchen Day module chef review', () => {
  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    resetKitchenSkillsPostStateForTests();
    clearKitchenSkillsReviewDispatchMarkersForTests();
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
    await openTrimAssessment(user);
    expect(screen.getByTestId('kitchen-day-review-unscored')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-chef-jamix-reference-carrot')).toHaveTextContent(
      'Reference unavailable',
    );
    expect(screen.queryByText(/better than|worse than/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-review-time-value')).not.toBeInTheDocument();
    expect(screen.queryByText(/module score/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/leaderboard|percentile/i)).not.toBeInTheDocument();

    expect(screen.getByTestId('kitchen-day-review-submit')).toBeDisabled();

    await user.type(screen.getByTestId('kitchen-day-review-time'), '6');
    expect(screen.getByTestId('kitchen-day-review-time')).toHaveValue('');
    await user.type(screen.getByTestId('kitchen-day-review-time'), '2.5');
    expect(screen.getByTestId('kitchen-day-review-time')).toHaveValue('2');
    await user.clear(screen.getByTestId('kitchen-day-review-time'));
    expect(screen.getByTestId('kitchen-day-review-submit')).toBeDisabled();

    await user.type(screen.getByTestId('kitchen-day-review-time'), '0');
    await user.type(screen.getByTestId('kitchen-day-review-quality'), '5');
    expect(screen.getByTestId('kitchen-day-review-submit')).toBeEnabled();
    await user.click(screen.getByTestId('kitchen-day-review-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-submitted')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-review-time-value')).toHaveTextContent('0');
    expect(screen.getByTestId('kitchen-day-review-quality-value')).toHaveTextContent('5');
    expect(screen.queryByTestId('kitchen-day-review-form')).not.toBeInTheDocument();
  });

  it('clears assessment inputs when switching module tabs', async () => {
    const user = userEvent.setup();
    setHash(`#/kitchen-day-tutor?sessionId=${encodeURIComponent(sessionOne)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenGroupInput: {
        activities: [{ id: 'chef-forecast', template: { slug: 'chefForecast' }, actor: { id: 'chef-1', name: 'Chef' }, properties: [] }],
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
        ],
      },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await openTrimAssessment(user);
    await user.type(screen.getByTestId('kitchen-day-review-time'), '4');
    await user.type(screen.getByTestId('kitchen-day-review-quality'), '5');
    expect(screen.getByTestId('kitchen-day-review-time')).toHaveValue('4');
    expect(screen.getByTestId('kitchen-day-review-quality')).toHaveValue('5');

    await user.click(screen.getByTestId('kitchen-day-tutor-module-tab-rescueAndReuse'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-rescueAndReuse-form')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-review-rescueAndReuse-time')).toHaveValue('');
    expect(screen.getByTestId('kitchen-day-review-rescueAndReuse-quality')).toHaveValue('');
  });

  it('posts EXIT from Close without submitting a review draft', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    setHash(`#/kitchen-day-tutor?actorId=user-1&sessionId=${encodeURIComponent(sessionOne)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenGroupInput: {
        activities: [{ id: 'chef-forecast', template: { slug: 'chefForecast' }, actor: { id: 'chef-1', name: 'Chef' }, properties: [] }],
      },
      kitchenSkillsTrainerInput: { activities: baseActivities },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await openTrimAssessment(user);
    await user.type(screen.getByTestId('kitchen-day-review-time'), '4');
    await user.click(screen.getByTestId('kitchen-day-tutor-close'));
    expect(confirmSpy).toHaveBeenCalled();
    const exitCalls = postMessage.mock.calls
      .map((call) => call[0])
      .filter((payload): payload is { type: string } =>
        Boolean(payload && typeof payload === 'object' && 'type' in payload && payload.type === 'EXIT'),
      );
    expect(exitCalls).toHaveLength(1);
    expect(
      postMessage.mock.calls.some(
        (call) =>
          Boolean(call[0] && typeof call[0] === 'object' && 'type' in call[0] && call[0].type === 'SILENT_ACTIVITY'),
      ),
    ).toBe(false);
  });

  it('posts EXIT directly from Close when the draft is clean', async () => {
    const user = userEvent.setup();
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    setHash('#/kitchen-day-tutor');
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: { activities: baseActivities },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-close')).toBeInTheDocument();
    });
    const header = screen.getByTestId('kitchen-day-tutor-header');
    expect(header).toHaveClass('kitchen-day-tutor-header--sticky');
    expect(header.contains(screen.getByTestId('kitchen-day-tutor-close'))).toBe(true);
    await user.click(screen.getByTestId('kitchen-day-tutor-close'));
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(
      postMessage.mock.calls.some(
        (call) => Boolean(call[0] && typeof call[0] === 'object' && 'type' in call[0] && call[0].type === 'EXIT'),
      ),
    ).toBe(true);
  });

  it('keeps pending and reviewed sessions in separate staff tabs', async () => {
    const user = userEvent.setup();
    const pendingSession = 'kitchen-day:kitchen-day-task-1:user-1:2026-09-25';
    const partialSession = 'kitchen-day:kitchen-day-task-1:user-1:2026-09-24';
    const reviewedSession = 'kitchen-day:kitchen-day-task-1:user-1:2026-09-22';
    setHash('#/kitchen-day-tutor?actorId=user-1');
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: {
        activities: [
          {
            ...baseActivities[1],
            id: 'act-trim-pending',
            properties: baseActivities[1]!.properties.map((property) =>
              property.template.slug === 'sessionId'
                ? { ...property, value: { value: pendingSession } }
                : property.template.slug === 'sessionDate'
                  ? { ...property, value: { value: '2026-09-25' } }
                  : property.template.slug === 'submittedAt'
                    ? { ...property, value: { value: '2026-09-25T10:03:00.000Z' } }
                    : property.template.slug === 'recipeId'
                      ? { ...property, value: { value: undefined } }
                      : property,
            ).filter((property) => property.template.slug !== 'recipeId'),
          },
          {
            id: 'act-trim-partial',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'trimSmart' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: partialSession } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-24' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-24T10:03:00.000Z' } },
              { template: { slug: 'ingredientId' }, value: { value: 'onion' } },
              { template: { slug: 'ingredientName' }, value: { value: 'Onion' } },
              { template: { slug: 'ingredientCategory' }, value: { value: 'root' } },
              { template: { slug: 'ingredientWeightGrams' }, value: { value: 1000 } },
              { template: { slug: 'trimTechniques' }, value: { value: 'dice' } },
              { template: { slug: 'estimatedWasteGrams' }, value: { value: 100 } },
              { template: { slug: 'actualWasteGrams' }, value: { value: 80 } },
              { template: { slug: 'duration' }, obj: { value: 2, unit: 'minutes' } },
            ],
          },
          {
            id: 'act-rescue-partial',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'rescueAndReuse' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: partialSession } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-24' } },
              { template: { slug: 'ingredientId' }, value: { value: 'onion' } },
              { template: { slug: 'reusableWasteGrams' }, value: { value: 40 } },
              { template: { slug: 'reuseDestination' }, value: { value: 'Stock' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-24T10:10:00.000Z' } },
            ],
          },
          {
            id: 'act-review-partial-trim',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'wastePracticeReview' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: partialSession } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-24' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-24T15:00:00.000Z' } },
              { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
              { template: { slug: 'timeEfficiencyScore' }, value: { value: 4 } },
              { template: { slug: 'preparationQualityScore' }, value: { value: 5 } },
            ],
          },
          {
            id: 'act-trim-reviewed',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'trimSmart' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: reviewedSession } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-22' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-22T10:03:00.000Z' } },
              { template: { slug: 'ingredientId' }, value: { value: 'celery' } },
              { template: { slug: 'ingredientName' }, value: { value: 'Celery' } },
              { template: { slug: 'ingredientCategory' }, value: { value: 'root' } },
              { template: { slug: 'ingredientWeightGrams' }, value: { value: 1000 } },
              { template: { slug: 'trimTechniques' }, value: { value: 'dice' } },
              { template: { slug: 'estimatedWasteGrams' }, value: { value: 100 } },
              { template: { slug: 'actualWasteGrams' }, value: { value: 80 } },
              { template: { slug: 'duration' }, obj: { value: 2, unit: 'minutes' } },
            ],
          },
          {
            id: 'act-review-complete',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'wastePracticeReview' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: reviewedSession } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-22' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-22T15:00:00.000Z' } },
              { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
              { template: { slug: 'timeEfficiencyScore' }, value: { value: 2 } },
              { template: { slug: 'preparationQualityScore' }, value: { value: 4 } },
              { template: { slug: 'chefFeedback' }, value: { value: 'Steady pacing on celery.' } },
            ],
          },
        ],
      },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });

    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-session-tab-needs')).toHaveTextContent('To assess (2)');
    });
    expect(screen.getByTestId('kitchen-day-tutor-session-tab-awaiting')).toHaveTextContent(
      'Awaiting confirmation (0)',
    );
    expect(screen.getByTestId('kitchen-day-tutor-session-tab-reviewed')).toHaveTextContent('Reviewed (1)');
    expect(screen.getByTestId(`kitchen-day-chef-session-${pendingSession}`)).toBeInTheDocument();
    expect(screen.getByTestId(`kitchen-day-chef-session-${partialSession}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`kitchen-day-chef-session-${reviewedSession}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`kitchen-day-tutor-session-status-${partialSession}`)).toHaveTextContent(
      'Needs assessment',
    );
    expect(screen.getByTestId(`kitchen-day-tutor-session-counts-${partialSession}`)).toHaveTextContent(
      '1 confirmed · 0 awaiting · 1 to assess',
    );
    expect(screen.queryByText(/needs review|✓/)).not.toBeInTheDocument();

    const needsLinks = screen.getAllByTestId(/kitchen-day-chef-session-/);
    expect(needsLinks[0]).toHaveAttribute(
      'data-testid',
      `kitchen-day-chef-session-${pendingSession}`,
    );

    await user.click(screen.getByTestId('kitchen-day-tutor-session-tab-reviewed'));
    await waitFor(() => {
      expect(screen.getByTestId(`kitchen-day-chef-session-${reviewedSession}`)).toBeInTheDocument();
    });
    expect(screen.queryByTestId(`kitchen-day-chef-session-${pendingSession}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`kitchen-day-tutor-session-counts-${reviewedSession}`)).toHaveTextContent(
      '1 confirmed · 0 awaiting · 0 to assess',
    );
    expect(screen.getByTestId(`kitchen-day-tutor-session-status-${reviewedSession}`)).toHaveTextContent('Reviewed');
    expect(screen.getByTestId('kitchen-day-tutor-close')).toBeInTheDocument();
  });

  it('marks a Portion-only session Reviewed without requiring Trim or Rescue', async () => {
    const user = userEvent.setup();
    const portionOnlyReviewed = 'kitchen-day:kitchen-day-task-1:user-1:2026-09-25';
    const portionOnlyPending = 'kitchen-day:kitchen-day-task-1:user-1:2026-09-24';
    setHash('#/kitchen-day-tutor');
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: {
        activities: [
          {
            id: 'act-portion-reviewed',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'portionPrecision' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: portionOnlyReviewed } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-25' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-25T11:00:00.000Z' } },
              { template: { slug: 'recipeId' }, value: { value: '42' } },
              { template: { slug: 'recipeName' }, value: { value: 'Hedelmät M,G' } },
              { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 3700 } },
              {
                template: { slug: 'recipeComposition' },
                value: {
                  value: [{ ingredientId: 'banaani', ingredientName: 'Banaani', actualAmount: 1500, unit: 'g' }],
                },
              },
            ],
          },
          {
            id: 'act-review-portion-only',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'wastePracticeReview' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: portionOnlyReviewed } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-25' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-25T15:00:00.000Z' } },
              { template: { slug: 'recipeId' }, value: { value: '42' } },
              { template: { slug: 'reviewedGame' }, value: { value: 'portionPrecision' } },
              { template: { slug: 'timeEfficiencyScore' }, value: { value: 4 } },
              { template: { slug: 'preparationQualityScore' }, value: { value: 5 } },
            ],
          },
          {
            id: 'act-portion-pending',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'portionPrecision' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: portionOnlyPending } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-24' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-24T11:00:00.000Z' } },
              { template: { slug: 'recipeId' }, value: { value: '42' } },
              { template: { slug: 'recipeName' }, value: { value: 'Hedelmät M,G' } },
              { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 3700 } },
              {
                template: { slug: 'recipeComposition' },
                value: {
                  value: [{ ingredientId: 'banaani', ingredientName: 'Banaani', actualAmount: 1500, unit: 'g' }],
                },
              },
            ],
          },
        ],
      },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });

    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-staff-user-1')).toHaveAttribute(
        'aria-label',
        'Student One: 2 sessions · 1 to assess · 0 awaiting · 1 reviewed',
      );
    });
    await user.click(screen.getByTestId('kitchen-day-tutor-staff-user-1'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-session-tab-needs')).toHaveTextContent('To assess (1)');
    });
    expect(screen.getByTestId('kitchen-day-tutor-staff-session-count')).toHaveTextContent(
      '2 sessions · 1 to assess · 0 awaiting · 1 reviewed',
    );
    const pendingRow = screen.getByTestId(`kitchen-day-chef-session-${portionOnlyPending}`);
    expect(pendingRow).toHaveTextContent('Hedelmät M,G');
    expect(pendingRow).toHaveTextContent('Portion');
    expect(pendingRow).not.toHaveTextContent(/Trim|Rescue/);
    expect(screen.getByTestId(`kitchen-day-tutor-session-counts-${portionOnlyPending}`)).toHaveTextContent(
      '0 confirmed · 0 awaiting · 1 to assess',
    );
    expect(screen.queryByText(/not applicable/i)).not.toBeInTheDocument();

    await user.click(screen.getByTestId('kitchen-day-tutor-session-tab-reviewed'));
    await waitFor(() => {
      expect(screen.getByTestId(`kitchen-day-chef-session-${portionOnlyReviewed}`)).toBeInTheDocument();
    });
    expect(screen.getByTestId(`kitchen-day-tutor-session-status-${portionOnlyReviewed}`)).toHaveTextContent(
      'Reviewed',
    );
    expect(screen.getByTestId(`kitchen-day-tutor-session-counts-${portionOnlyReviewed}`)).toHaveTextContent(
      '1 confirmed · 0 awaiting · 0 to assess',
    );
  });

  it('shows an existing review read-only instead of creating another', async () => {
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
            id: 'act-review-1',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'wastePracticeReview' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionOne } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T15:00:00.000Z' } },
              { template: { slug: 'recipeId' }, value: { value: baseRecipeId } },
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
    // Portion still needs assessment, so the workspace opens there first.
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-portionPrecision-form')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-tutor-module-tab-trimSmart')).toHaveAttribute(
      'data-module-status',
      'reviewed',
    );
    await openTrimTab(user);
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
              { template: { slug: 'recipeId' }, value: { value: baseRecipeId } },
              { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
              { template: { slug: 'timeEfficiencyScore' }, value: { value: 4 } },
              { template: { slug: 'preparationQualityScore' }, value: { value: 3 } },
            ],
          },
        ],
      },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await openTrimTab(user);
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
      kitchenSkillsTrainerInput: {
        activities: [...baseActivities, secondStudentPortionActivity(), secondStudentTrimActivity()],
      },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await openTrimAssessment(user);
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
      'recipeId',
      'reviewedGame',
      'timeEfficiencyScore',
      'preparationQualityScore',
      'chefFeedback',
    ]);
    expect(properties.map((property) => property.template)).not.toContain('studentId');
    expect(properties.find((property) => property.template === 'sessionId')?.obj).toEqual({ value: sessionOne });
    expect(properties.find((property) => property.template === 'sessionDate')?.obj).toEqual({ value: '2026-09-23' });
    expect(properties.find((property) => property.template === 'recipeId')?.obj).toEqual({ value: baseRecipeId });
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
    await openTrimAssessment(user);
  });

  it('shows Trim actual vs JAMIX without filling tutor scores', async () => {
    const user = userEvent.setup();
    const hedelmatSession = 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23';
    setHash(`#/kitchen-day-tutor?sessionId=${encodeURIComponent(hedelmatSession)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: {
        activities: [
          {
            id: 'act-portion-hedelmat',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'portionPrecision' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: hedelmatSession } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T09:00:00.000Z' } },
              { template: { slug: 'recipeId' }, value: { value: '42' } },
              { template: { slug: 'recipeName' }, value: { value: 'Hedelmät M,G' } },
              { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 3700 } },
              {
                template: { slug: 'recipeComposition' },
                value: {
                  value: [
                    { ingredientId: 'banaani', ingredientName: 'Banaani', actualAmount: 1500, unit: 'g' },
                    { ingredientId: 'omena', ingredientName: 'Omena', actualAmount: 1200, unit: 'g' },
                  ],
                },
              },
            ],
          },
          {
            id: 'act-trim-banaani',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'trimSmart' },
            start: '2026-09-23T10:00:00.000Z',
            end: '2026-09-23T10:03:00.000Z',
            properties: [
              { template: { slug: 'sessionId' }, value: { value: hedelmatSession } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:03:00.000Z' } },
              { template: { slug: 'ingredientId' }, value: { value: 'banaani' } },
              { template: { slug: 'ingredientName' }, value: { value: 'Banaani' } },
              { template: { slug: 'ingredientWeightGrams' }, value: { value: 5000 } },
              { template: { slug: 'trimTechniques' }, value: { value: 'trimming' } },
              { template: { slug: 'estimatedWasteGrams' }, value: { value: 600 } },
              { template: { slug: 'actualWasteGrams' }, value: { value: 450 } },
              { template: { slug: 'duration' }, obj: { value: 3, unit: 'minutes' } },
            ],
          },
        ],
      },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await openTrimTab(user);
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-chef-trim-banaani')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-chef-actual-removed-banaani')).toHaveTextContent('450 g (9.0%)');
    expect(screen.getByTestId('kitchen-day-chef-jamix-reference-banaani')).toHaveTextContent(
      '37.0% (~1.85 kg for this starting amount)',
    );
    expect(screen.getByTestId('kitchen-day-chef-reference-delta-banaani')).toHaveTextContent(
      '28.0 percentage points below reference',
    );
    expect(screen.queryByText(/better than|worse than/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-review-unscored')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-review-time')).toHaveValue('');
    expect(screen.getByTestId('kitchen-day-review-quality')).toHaveValue('');
    await user.type(screen.getByTestId('kitchen-day-review-time'), '2');
    await user.type(screen.getByTestId('kitchen-day-review-quality'), '4');
    expect(screen.getByTestId('kitchen-day-chef-reference-delta-banaani')).toHaveTextContent(
      '28.0 percentage points below reference',
    );
    expect(screen.getByTestId('kitchen-day-review-time')).toHaveValue('2');
  });

  it('keeps three Portion assessments distinct across submit, awaiting, and hydration', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    const multiSession = 'kitchen-day:kitchen-day-task-1:user-1:2026-10-01';
    const portions = ['recipe-a', 'recipe-b', 'recipe-c'].map((recipeId, index) => ({
      id: `act-portion-${recipeId}`,
      actor: { id: 'user-1', name: 'Student One' },
      template: { slug: 'portionPrecision' },
      properties: [
        { template: { slug: 'sessionId' }, value: { value: multiSession } },
        { template: { slug: 'sessionDate' }, value: { value: '2026-10-01' } },
        { template: { slug: 'submittedAt' }, value: { value: `2026-10-01T09:0${index}:00.000Z` } },
        { template: { slug: 'recipeId' }, value: { value: recipeId } },
        { template: { slug: 'recipeName' }, value: { value: recipeId.toUpperCase() } },
        { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 1000 } },
        {
          template: { slug: 'recipeComposition' },
          value: {
            value: [{ ingredientId: 'carrot', ingredientName: 'Carrot', actualAmount: 500, unit: 'g' }],
          },
        },
      ],
    }));

    setHash(`#/kitchen-day-tutor?actorId=user-1&sessionId=${encodeURIComponent(multiSession)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: { activities: portions },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });

    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-recipe-tabs')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-tutor-session-status')).toHaveTextContent('Needs assessment');

    for (const recipeId of ['recipe-a', 'recipe-b', 'recipe-c']) {
      await user.click(screen.getByTestId(`kitchen-day-tutor-recipe-tab-${recipeId}`));
      await waitFor(() => {
        expect(screen.getByTestId('kitchen-day-review-portionPrecision-form')).toBeInTheDocument();
      });
      await user.type(screen.getByTestId('kitchen-day-review-portionPrecision-time'), '3');
      await user.type(screen.getByTestId('kitchen-day-review-portionPrecision-quality'), '4');
      await user.click(screen.getByTestId('kitchen-day-review-portionPrecision-submit'));
      await waitFor(() => {
        expect(screen.getByTestId('kitchen-day-review-portionPrecision-awaiting')).toBeInTheDocument();
      });
      // Awaiting must not flip the recipe to REVIEWED before GameBus hydration.
      expect(screen.getByTestId(`kitchen-day-tutor-recipe-tab-${recipeId}`)).toHaveAttribute(
        'data-recipe-status',
        'awaiting_confirmation',
      );
    }
    expect(screen.getByTestId('kitchen-day-tutor-session-status')).toHaveTextContent('Awaiting confirmation');
    expect(screen.getByTestId('kitchen-day-tutor-session-counts')).toHaveTextContent(
      '0 confirmed · 3 awaiting confirmation · 0 outstanding',
    );

    const reviewMessages = postMessage.mock.calls
      .map((call) => call[0])
      .filter(
        (payload): payload is {
          type: string;
          data?: { template?: string; properties?: { template: string; obj: { value: string } }[] };
        } =>
          Boolean(
            payload &&
              typeof payload === 'object' &&
              'type' in payload &&
              (payload as { type: string }).type === 'SILENT_ACTIVITY',
          ),
      )
      .filter((payload) => payload.data?.template === 'wastePracticeReview');
    expect(reviewMessages).toHaveLength(3);
    const postedRecipeIds = reviewMessages.map(
      (message) =>
        message.data?.properties?.find((property) => property.template === 'recipeId')?.obj.value,
    );
    expect(postedRecipeIds.sort()).toEqual(['recipe-a', 'recipe-b', 'recipe-c']);

    const hydratedReviews = ['recipe-a', 'recipe-b', 'recipe-c'].map((recipeId, index) => ({
      id: `act-review-${recipeId}`,
      actor: { id: 'user-1', name: 'Student One' },
      template: { slug: 'wastePracticeReview' },
      properties: [
        { template: { slug: 'sessionId' }, value: { value: multiSession } },
        { template: { slug: 'sessionDate' }, value: { value: '2026-10-01' } },
        { template: { slug: 'submittedAt' }, value: { value: `2026-10-01T12:0${index}:00.000Z` } },
        { template: { slug: 'recipeId' }, value: { value: recipeId } },
        { template: { slug: 'reviewedGame' }, value: { value: 'portionPrecision' } },
        { template: { slug: 'timeEfficiencyScore' }, value: { value: 3 } },
        { template: { slug: 'preparationQualityScore' }, value: { value: 4 } },
      ],
    }));
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: { activities: [...portions, ...hydratedReviews] },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });

    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-session-status')).toHaveTextContent('Reviewed');
    });
    for (const recipeId of ['recipe-a', 'recipe-b', 'recipe-c']) {
      await user.click(screen.getByTestId(`kitchen-day-tutor-recipe-tab-${recipeId}`));
      await waitFor(() => {
        expect(screen.getByTestId(`kitchen-day-tutor-recipe-tab-${recipeId}`)).toHaveAttribute(
          'data-recipe-status',
          'reviewed',
        );
        expect(screen.getByTestId('kitchen-day-review-portionPrecision-submitted')).toBeInTheDocument();
        expect(screen.queryByTestId('kitchen-day-review-portionPrecision-awaiting')).not.toBeInTheDocument();
      });
    }
  });

  it('does not offer retry or post again while an assessment is awaiting confirmation', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    setHash(`#/kitchen-day-tutor?actorId=user-1&sessionId=${encodeURIComponent(sessionOne)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: { activities: baseActivities },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await openTrimAssessment(user);
    await user.type(screen.getByTestId('kitchen-day-review-time'), '4');
    await user.type(screen.getByTestId('kitchen-day-review-quality'), '5');
    await user.click(screen.getByTestId('kitchen-day-review-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-awaiting')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('kitchen-day-review-retry')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-review-submit')).not.toBeInTheDocument();
    const reviewCalls = postMessage.mock.calls.filter((call) => {
      const payload = call[0] as { type?: string; data?: { template?: string } };
      return payload?.type === 'SILENT_ACTIVITY' && payload.data?.template === 'wastePracticeReview';
    });
    expect(reviewCalls).toHaveLength(1);
  });

  it('keeps inactive-module drafts and confirms Close when any draft is unsaved', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    setHash(`#/kitchen-day-tutor?actorId=user-1&sessionId=${encodeURIComponent(sessionOne)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: { activities: baseActivities },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await openTrimAssessment(user);
    await user.type(screen.getByTestId('kitchen-day-review-time'), '3');
    await user.click(screen.getByTestId('kitchen-day-tutor-module-tab-portionPrecision'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-portionPrecision-form')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-tutor-unsaved-hint')).toBeInTheDocument();
    await user.click(screen.getByTestId('kitchen-day-tutor-close'));
    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByTestId('kitchen-day-tutor-page')).toBeInTheDocument();
    await user.click(screen.getByTestId('kitchen-day-tutor-module-tab-trimSmart'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-time')).toHaveValue('3');
    });
    confirmSpy.mockRestore();
  });

  it('preserves draft scores and shows an actionable error when client validation blocks the post', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    ingestTaskForTests({
      ...kitchenSkillsTrainerTaskFixture,
      activityTemplates: kitchenSkillsTrainerTaskFixture.activityTemplates.map((template) => {
        if (template.slug !== 'wastePracticeReview') return template;
        return {
          ...template,
          linkedProperties: (template.linkedProperties ?? []).filter((item) => item.ref !== 'recipeId'),
        };
      }),
    });
    setHash(`#/kitchen-day-tutor?actorId=user-1&sessionId=${encodeURIComponent(sessionOne)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: { activities: baseActivities },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await openTrimAssessment(user);
    await user.type(screen.getByTestId('kitchen-day-review-time'), '4');
    await user.type(screen.getByTestId('kitchen-day-review-quality'), '5');
    await user.click(screen.getByTestId('kitchen-day-review-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-error')).toHaveTextContent(
        /required property links are missing on wastePracticeReview: recipeId/i,
      );
    });
    expect(screen.getByTestId('kitchen-day-review-time')).toHaveValue('4');
    expect(screen.getByTestId('kitchen-day-review-quality')).toHaveValue('5');
    expect(screen.queryByTestId('kitchen-day-review-submitted')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-review-awaiting')).not.toBeInTheDocument();
  });

  it('retains unsaved assessment drafts when switching recipes', async () => {
    const user = userEvent.setup();
    const multiSession = 'kitchen-day:kitchen-day-task-1:user-1:2026-10-02';
    const portions = ['draft-a', 'draft-b'].map((recipeId, index) => ({
      id: `act-portion-${recipeId}`,
      actor: { id: 'user-1', name: 'Student One' },
      template: { slug: 'portionPrecision' },
      properties: [
        { template: { slug: 'sessionId' }, value: { value: multiSession } },
        { template: { slug: 'sessionDate' }, value: { value: '2026-10-02' } },
        { template: { slug: 'submittedAt' }, value: { value: `2026-10-02T09:0${index}:00.000Z` } },
        { template: { slug: 'recipeId' }, value: { value: recipeId } },
        { template: { slug: 'recipeName' }, value: { value: recipeId } },
        { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 1000 } },
        {
          template: { slug: 'recipeComposition' },
          value: {
            value: [{ ingredientId: 'carrot', ingredientName: 'Carrot', actualAmount: 500, unit: 'g' }],
          },
        },
      ],
    }));
    setHash(`#/kitchen-day-tutor?actorId=user-1&sessionId=${encodeURIComponent(multiSession)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: { activities: portions },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-portionPrecision-form')).toBeInTheDocument();
    });
    await user.type(screen.getByTestId('kitchen-day-review-portionPrecision-time'), '2');
    await user.type(screen.getByTestId('kitchen-day-review-portionPrecision-quality'), '3');
    await user.click(screen.getByTestId('kitchen-day-tutor-recipe-tab-draft-b'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-portionPrecision-time')).toHaveValue('');
    });
    await user.click(screen.getByTestId('kitchen-day-tutor-recipe-tab-draft-a'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-portionPrecision-time')).toHaveValue('2');
      expect(screen.getByTestId('kitchen-day-review-portionPrecision-quality')).toHaveValue('3');
    });
  });

  it('reproduces staff2 15 Oct two-recipe Portion assessment without cross-marking Reviewed', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    const sessionId = 'kitchen-day:kitchen-day-task-1:staff2:2026-10-15';
    const recipes = [
      { id: 'broileri-linssikeitto', name: 'Broileri-linssikeitto M,G' },
      { id: 'flow-mustamakkara', name: 'FLOW mustamakkara' },
    ] as const;
    const portions = recipes.map((recipe, index) => ({
      id: `act-portion-${recipe.id}`,
      actor: { id: 'staff2', name: 'staff2 staff' },
      template: { slug: 'portionPrecision' },
      properties: [
        { template: { slug: 'sessionId' }, value: { value: sessionId } },
        { template: { slug: 'sessionDate' }, value: { value: '2026-10-15' } },
        { template: { slug: 'submittedAt' }, value: { value: `2026-10-15T10:0${index}:00.000Z` } },
        { template: { slug: 'recipeId' }, value: { value: recipe.id } },
        { template: { slug: 'recipeName' }, value: { value: recipe.name } },
        { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 1200 } },
        {
          template: { slug: 'recipeComposition' },
          value: {
            value: [{ ingredientId: 'onion', ingredientName: 'Onion', actualAmount: 200, unit: 'g' }],
          },
        },
      ],
    }));

    setHash(`#/kitchen-day-tutor?actorId=staff2&sessionId=${encodeURIComponent(sessionId)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: { activities: portions },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });

    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-recipe-summary')).toHaveTextContent(
        '2 recipes · 0 of 2 reviewed',
      );
    });
    // Identity lives in the header only.
    expect(screen.getByTestId('kitchen-day-tutor-header-session')).toHaveTextContent('staff2 staff');
    expect(screen.getByTestId('kitchen-day-tutor-header-session')).toHaveTextContent('15 October 2026');
    expect(screen.queryByTestId('kitchen-day-tutor-session-meta')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('kitchen-day-tutor-recipe-tab-broileri-linssikeitto'));
    await user.click(document.getElementById('time-broileri-linssikeitto-portionPrecision-5')!);
    await user.click(document.getElementById('quality-broileri-linssikeitto-portionPrecision-5')!);
    await user.type(screen.getByTestId('kitchen-day-review-portionPrecision-feedback'), 'nn');
    await user.click(screen.getByTestId('kitchen-day-review-portionPrecision-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-portionPrecision-awaiting')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-tutor-recipe-tab-broileri-linssikeitto')).toHaveAttribute(
      'data-recipe-status',
      'awaiting_confirmation',
    );
    expect(screen.getByTestId('kitchen-day-tutor-recipe-tab-flow-mustamakkara')).toHaveAttribute(
      'data-recipe-status',
      'needs_assessment',
    );
    expect(screen.getByTestId('kitchen-day-tutor-recipe-summary')).toHaveTextContent(
      '2 recipes · 0 of 2 reviewed',
    );

    const reviewMessage = postMessage.mock.calls
      .map((call) => call[0] as { type?: string; data?: { template?: string; properties?: { template: string; obj: { value: unknown } }[]; actors?: string[] } })
      .find((payload) => payload?.type === 'SILENT_ACTIVITY' && payload.data?.template === 'wastePracticeReview');
    expect(reviewMessage?.data?.actors).toEqual(['staff2']);
    expect(
      reviewMessage?.data?.properties?.find((property) => property.template === 'recipeId')?.obj.value,
    ).toBe('broileri-linssikeitto');
    expect(
      reviewMessage?.data?.properties?.find((property) => property.template === 'chefFeedback')?.obj.value,
    ).toBe('nn');
  });

  it('accepts explicit score 0 from the score picker', async () => {
    const user = userEvent.setup();
    setHash(`#/kitchen-day-tutor?actorId=user-1&sessionId=${encodeURIComponent(sessionOne)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: { activities: baseActivities },
      inputCollectionPari: { me: { id: 'chef-1', firstName: 'Chef', lastName: 'One' } },
    });
    await openTrimAssessment(user);
    expect(screen.getByTestId('kitchen-day-review-time')).toHaveValue('');
    await user.click(document.getElementById(`time-${baseRecipeId}-trimSmart-0`)!);
    await user.click(document.getElementById(`quality-${baseRecipeId}-trimSmart-0`)!);
    expect(screen.getByTestId('kitchen-day-review-time')).toHaveValue('0');
    expect(screen.getByTestId('kitchen-day-review-quality')).toHaveValue('0');
    expect(screen.getByTestId('kitchen-day-review-submit')).toBeEnabled();
  });
});
