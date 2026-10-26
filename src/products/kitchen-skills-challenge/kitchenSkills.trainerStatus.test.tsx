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

const SESSION = 'kitchen-day:kitchen-day-task-1:user-1:2026-10-20';

const evidence = [
  {
    id: 'portion-1',
    actor: { id: 'user-1', name: 'Student One' },
    template: { slug: 'portionPrecision' },
    properties: [
      { template: { slug: 'sessionId' }, value: { value: SESSION } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-10-20' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-10-20T08:00:00.000Z' } },
      { template: { slug: 'recipeId' }, value: { value: '5' } },
      { template: { slug: 'recipeName' }, value: { value: 'Smoothie' } },
      { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 1000 } },
      {
        template: { slug: 'recipeComposition' },
        value: { value: [{ ingredientId: 'banana', ingredientName: 'Banana', actualAmount: 500, unit: 'g' }] },
      },
    ],
  },
  {
    id: 'trim-1',
    actor: { id: 'user-1', name: 'Student One' },
    template: { slug: 'trimSmart' },
    properties: [
      { template: { slug: 'sessionId' }, value: { value: SESSION } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-10-20' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-10-20T08:10:00.000Z' } },
      { template: { slug: 'recipeId' }, value: { value: '5' } },
      { template: { slug: 'ingredientId' }, value: { value: 'banana' } },
      { template: { slug: 'ingredientName' }, value: { value: 'Banana' } },
      { template: { slug: 'ingredientWeightGrams' }, value: { value: 500 } },
      { template: { slug: 'trimTechniques' }, value: { value: 'peeling' } },
      { template: { slug: 'estimatedWasteGrams' }, value: { value: 50 } },
      { template: { slug: 'actualWasteGrams' }, value: { value: 40 } },
      { template: { slug: 'duration' }, obj: { value: 2, unit: 'minutes' } },
    ],
  },
];

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('Kitchen Skills trainer session-level status', () => {
  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    resetKitchenSkillsPostStateForTests();
    clearKitchenSkillsReviewDispatchMarkersForTests();
    setHash('');
    vi.restoreAllMocks();
  });

  it('shows Needs assessment until a session assessment exists, then Reviewed', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: { activities: evidence },
      inputCollectionPari: { me: { id: 'tutor-1', firstName: 'Tutor', lastName: 'One' } },
    });
    setHash('#/kitchen-day-tutor');
    const user = userEvent.setup();
    render(<AppRouter />);

    await waitFor(() => expect(screen.getByTestId('kitchen-day-tutor-staff-user-1')).toBeInTheDocument());
    await user.click(screen.getByTestId('kitchen-day-tutor-staff-user-1'));
    await waitFor(() => expect(screen.getByTestId(`kitchen-day-chef-session-${SESSION}`)).toBeInTheDocument());
    await user.click(screen.getByTestId(`kitchen-day-chef-session-${SESSION}`));
    await waitFor(() => expect(screen.getByTestId('kitchen-day-tutor-session-status')).toBeInTheDocument());
    expect(screen.getByTestId('kitchen-day-tutor-session-status')).toHaveTextContent(/needs assessment/i);

    await user.type(screen.getByTestId('kitchen-day-review-time'), '4');
    await user.type(screen.getByTestId('kitchen-day-review-quality'), '5');
    await user.click(screen.getByTestId('kitchen-day-review-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-submitted')).toBeInTheDocument();
    });
    // postMessage alone is not GameBus persistence — stay Needs assessment until feed confirms.
    expect(screen.getByTestId('kitchen-day-tutor-session-status')).toHaveTextContent(/needs assessment/i);
    expect(screen.queryByTestId('kitchen-day-review-saved')).not.toBeInTheDocument();
    expect(postMessage.mock.calls.filter((call) => (call[0] as { type?: string }).type === 'SILENT_ACTIVITY')).toHaveLength(
      1,
    );
  });

  it('shows Reviewed only after a persisted session assessment hydrates from GameBus', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: {
        activities: [
          ...evidence,
          {
            id: 'review-session',
            actor: { id: 'user-1', name: 'Student One' },
            template: { slug: 'wastePracticeReview' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: SESSION } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-10-20' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-10-20T09:00:00.000Z' } },
              { template: { slug: 'timeEfficiencyScore' }, value: { value: 4 } },
              { template: { slug: 'preparationQualityScore' }, value: { value: 5 } },
            ],
          },
        ],
      },
      inputCollectionPari: { me: { id: 'tutor-1', firstName: 'Tutor', lastName: 'One' } },
    });
    setHash('#/kitchen-day-tutor');
    const user = userEvent.setup();
    render(<AppRouter />);
    await waitFor(() => expect(screen.getByTestId('kitchen-day-tutor-staff-user-1')).toBeInTheDocument());
    await user.click(screen.getByTestId('kitchen-day-tutor-staff-user-1'));
    await waitFor(() => expect(screen.getByTestId(`kitchen-day-chef-session-${SESSION}`)).toBeInTheDocument());
    await user.click(screen.getByTestId(`kitchen-day-chef-session-${SESSION}`));
    await waitFor(() => expect(screen.getByTestId('kitchen-day-review-saved')).toBeInTheDocument());
    expect(screen.getByTestId('kitchen-day-tutor-session-status')).toHaveTextContent(/reviewed/i);
    expect(screen.queryByTestId('kitchen-day-review-submit')).not.toBeInTheDocument();
    expect(postMessage).not.toHaveBeenCalled();
  });
});
