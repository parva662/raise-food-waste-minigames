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
      { template: { slug: 'ingredientWeightGrams' }, value: { value: 5000 } },
      { template: { slug: 'trimTechniques' }, value: { value: 'trimming' } },
      { template: { slug: 'estimatedWasteGrams' }, value: { value: 600 } },
      { template: { slug: 'actualWasteGrams' }, value: { value: 450 } },
      { template: { slug: 'duration' }, obj: { value: 3, unit: 'minutes' } },
    ],
  },
  {
    id: 'act-rescue-1',
    actor: { id: 'user-1', name: 'Student One' },
    template: { slug: 'rescueAndReuse' },
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionOne } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:10:00.000Z' } },
      { template: { slug: 'recipeId' }, value: { value: baseRecipeId } },
      { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
      { template: { slug: 'reusableWasteGrams' }, value: { value: 100 } },
      { template: { slug: 'reuseDestination' }, value: { value: 'Stock' } },
    ],
  },
];

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function sessionReviewActivity(actorId: string, sessionId: string, scores: {
  time?: number;
  quality?: number;
  feedback?: string;
} = {}) {
  const properties = [
    { template: { slug: 'sessionId' }, value: { value: sessionId } },
    { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
    { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T15:00:00.000Z' } },
    { template: { slug: 'timeEfficiencyScore' }, value: { value: scores.time ?? 4 } },
    { template: { slug: 'preparationQualityScore' }, value: { value: scores.quality ?? 5 } },
  ];
  if (scores.feedback) {
    properties.push({ template: { slug: 'chefFeedback' }, value: { value: scores.feedback } });
  }
  return {
    id: `review-session-${actorId}-${sessionId}`,
    actor: { id: actorId, name: actorId === 'user-1' ? 'Student One' : 'Student Two' },
    template: { slug: 'wastePracticeReview' },
    properties,
  };
}

function historicalModuleReview(
  actorId: string,
  sessionId: string,
  reviewedGame: 'portionPrecision' | 'trimSmart' | 'rescueAndReuse',
) {
  return {
    id: `review-module-${actorId}-${reviewedGame}`,
    actor: { id: actorId, name: 'Student One' },
    template: { slug: 'wastePracticeReview' },
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionId } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T14:00:00.000Z' } },
      { template: { slug: 'recipeId' }, value: { value: baseRecipeId } },
      { template: { slug: 'reviewedGame' }, value: { value: reviewedGame } },
      { template: { slug: 'timeEfficiencyScore' }, value: { value: 3 } },
      { template: { slug: 'preparationQualityScore' }, value: { value: 3 } },
    ],
  };
}

function ingestTrainerFeed(activities: unknown[]) {
  ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
  ingestInputCollectionsForTests({
    kitchenSkillsTrainerInput: { activities },
    inputCollectionPari: { me: { id: 'tutor-1', firstName: 'Tutor', lastName: 'One' } },
  });
}

async function openStudentSession(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => {
    expect(screen.getByTestId('kitchen-day-tutor-staff-user-1')).toBeInTheDocument();
  });
  await user.click(screen.getByTestId('kitchen-day-tutor-staff-user-1'));
  await waitFor(() => {
    expect(screen.getByTestId(`kitchen-day-chef-session-${sessionOne}`)).toBeInTheDocument();
  });
  await user.click(screen.getByTestId(`kitchen-day-chef-session-${sessionOne}`));
  await waitFor(() => {
    expect(screen.getByTestId('kitchen-day-chef-selected')).toBeInTheDocument();
  });
}

describe('Kitchen Day session-level tutor assessment', () => {
  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    resetKitchenSkillsPostStateForTests();
    clearKitchenSkillsReviewDispatchMarkersForTests();
    setHash('');
    vi.restoreAllMocks();
  });

  it('shows Portion, Trim and Rescue evidence with one unanswered session form', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    ingestTrainerFeed(baseActivities);
    setHash('#/kitchen-day-tutor');
    const user = userEvent.setup();
    render(<AppRouter />);
    await openStudentSession(user);

    expect(screen.getByTestId('kitchen-day-chef-evidence')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-review-form')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-review-unscored')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-tutor-module-tabs')).not.toBeInTheDocument();
  });

  it('posts exactly one SILENT_ACTIVITY without reviewedGame or recipeId', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTrainerFeed(baseActivities);
    setHash('#/kitchen-day-tutor');
    const user = userEvent.setup();
    render(<AppRouter />);
    await openStudentSession(user);

    await user.type(screen.getByTestId('kitchen-day-review-time'), '3');
    await user.type(screen.getByTestId('kitchen-day-review-quality'), '4');
    await user.type(screen.getByTestId('kitchen-day-review-feedback'), 'Steady pace');
    await user.click(screen.getByTestId('kitchen-day-review-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-submitted')).toBeInTheDocument();
    });

    const silent = postMessage.mock.calls
      .map((call) => call[0] as { type?: string; data?: { template?: string; actors?: string[]; properties?: { template: string }[] } })
      .filter((message) => message?.type === 'SILENT_ACTIVITY');
    expect(silent).toHaveLength(1);
    expect(silent[0]?.data?.template).toBe('wastePracticeReview');
    expect(silent[0]?.data?.actors).toEqual(['user-1']);
    const templates = silent[0]?.data?.properties?.map((property) => property.template) ?? [];
    expect(templates).toEqual([
      'sessionId',
      'sessionDate',
      'submittedAt',
      'timeEfficiencyScore',
      'preparationQualityScore',
      'chefFeedback',
    ]);
    expect(templates).not.toContain('reviewedGame');
    expect(templates).not.toContain('recipeId');
    expect(postMessage.mock.calls.some((call) => (call[0] as { type?: string }).type === 'EXIT')).toBe(false);
  });

  it('blocks duplicate session submissions', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTrainerFeed(baseActivities);
    setHash('#/kitchen-day-tutor');
    const user = userEvent.setup();
    render(<AppRouter />);
    await openStudentSession(user);

    await user.type(screen.getByTestId('kitchen-day-review-time'), '2');
    await user.type(screen.getByTestId('kitchen-day-review-quality'), '5');
    await user.click(screen.getByTestId('kitchen-day-review-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-submitted')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('kitchen-day-review-submit')).not.toBeInTheDocument();
  });

  it('shows Assessment submitted after postMessage without claiming GameBus saved', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTrainerFeed(baseActivities);
    setHash('#/kitchen-day-tutor');
    const user = userEvent.setup();
    render(<AppRouter />);
    await openStudentSession(user);

    await user.type(screen.getByTestId('kitchen-day-review-time'), '3');
    await user.type(screen.getByTestId('kitchen-day-review-quality'), '4');
    await user.click(screen.getByTestId('kitchen-day-review-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-submitted')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-review-submitted')).toHaveTextContent(/assessment submitted/i);
    expect(screen.queryByTestId('kitchen-day-review-saved')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-tutor-session-status')).toHaveTextContent(/needs assessment/i);
    expect(screen.queryByTestId('kitchen-day-review-submit')).not.toBeInTheDocument();
    expect(
      postMessage.mock.calls.filter((call) => (call[0] as { type?: string }).type === 'SILENT_ACTIVITY'),
    ).toHaveLength(1);

    await user.click(screen.getByTestId('kitchen-day-tutor-back-staff'));
    await waitFor(() => expect(screen.getByTestId(`kitchen-day-chef-session-${sessionOne}`)).toBeInTheDocument());
    await user.click(screen.getByTestId(`kitchen-day-chef-session-${sessionOne}`));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-submitted')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('kitchen-day-review-saved')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-review-submit')).not.toBeInTheDocument();
    expect(
      postMessage.mock.calls.filter((call) => (call[0] as { type?: string }).type === 'SILENT_ACTIVITY'),
    ).toHaveLength(1);
  });

  it('shows Assessment saved / Reviewed only after a matching persisted GameBus record exists', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    ingestTrainerFeed([
      ...baseActivities,
      sessionReviewActivity('user-1', sessionOne, { feedback: 'Nice work' }),
    ]);
    setHash('#/kitchen-day-tutor');
    const user = userEvent.setup();
    render(<AppRouter />);
    await openStudentSession(user);

    expect(screen.getByTestId('kitchen-day-review-saved')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-review-saved')).toHaveTextContent(/assessment saved/i);
    expect(screen.getByTestId('kitchen-day-review-feedback-value')).toHaveTextContent('Nice work');
    expect(screen.getByTestId('kitchen-day-tutor-session-status')).toHaveTextContent(/reviewed/i);
    expect(screen.queryByTestId('kitchen-day-review-form')).not.toBeInTheDocument();
  });

  it('does not silently report success when reopening finds no persisted assessment', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    ingestTrainerFeed(baseActivities);
    setHash('#/kitchen-day-tutor');
    const user = userEvent.setup();
    render(<AppRouter />);
    await openStudentSession(user);

    expect(screen.getByTestId('kitchen-day-review-form')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-review-saved')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-review-submitted')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-tutor-session-status')).toHaveTextContent(/needs assessment/i);
  });

  it('keeps historical module reviews readable without marking the session reviewed', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    ingestTrainerFeed([
      ...baseActivities,
      historicalModuleReview('user-1', sessionOne, 'portionPrecision'),
      historicalModuleReview('user-1', sessionOne, 'trimSmart'),
    ]);
    setHash('#/kitchen-day-tutor');
    const user = userEvent.setup();
    render(<AppRouter />);
    await openStudentSession(user);

    expect(screen.getByTestId('kitchen-day-tutor-historical-module-reviews')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-review-form')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-tutor-session-status')).toHaveTextContent(/needs assessment/i);
  });

  it('separates needs-assessment and reviewed staff session tabs', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    ingestTrainerFeed([
      ...baseActivities,
      {
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
      },
      sessionReviewActivity('user-2', sessionTwo),
    ]);
    setHash('#/kitchen-day-tutor');
    render(<AppRouter />);

    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-staff-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('kitchen-day-tutor-staff-user-2')).toBeInTheDocument();
    });
  });

  it('posts EXIT from Close without submitting a review draft', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTrainerFeed(baseActivities);
    setHash('#/kitchen-day-tutor');
    const user = userEvent.setup();
    render(<AppRouter />);
    await openStudentSession(user);
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(postMessage).toHaveBeenCalledWith({ type: 'EXIT' }, '*');
    expect(
      postMessage.mock.calls.some((call) => (call[0] as { type?: string }).type === 'SILENT_ACTIVITY'),
    ).toBe(false);
  });

  it('accepts explicit score 0', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTrainerFeed(baseActivities);
    setHash('#/kitchen-day-tutor');
    const user = userEvent.setup();
    render(<AppRouter />);
    await openStudentSession(user);

    await user.type(screen.getByTestId('kitchen-day-review-time'), '0');
    await user.type(screen.getByTestId('kitchen-day-review-quality'), '0');
    await user.click(screen.getByTestId('kitchen-day-review-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-time-value')).toHaveTextContent('0');
      expect(screen.getByTestId('kitchen-day-review-quality-value')).toHaveTextContent('0');
    });
  });
});
