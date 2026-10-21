/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as detectEmbed from '@/platform/gamebus/detectEmbed';
import { ingestInputCollectionsForTests, ingestTaskForTests, resetGameBusBridgeForTests } from '@/platform/gamebus/bridge';
import { AppRouter } from '@/app/AppRouter';
import { kitchenSkillsTrainerTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import { resetKitchenSkillsPostStateForTests } from '@/products/kitchen-skills-challenge/gamebus/postActivity';
import {
  clearKitchenSkillsReviewDispatchMarkersForTests,
  kitchenSkillsTrainerFeedFingerprint,
  markKitchenSkillsReviewDispatched,
} from '@/products/kitchen-skills-challenge/gamebus/reviewDispatchMarker';

const actor = { id: 'staff1', name: 'staff1 Staff' };
const sessionId = 'kitchen-day:task:staff1:2026-10-20';
const recipeId = '5';

function prop(slug: string, value: unknown) {
  return { template: { slug }, value: { value } };
}

const evidence = [
  {
    id: 'portion-5',
    actor,
    template: { slug: 'portionPrecision' },
    properties: [
      prop('sessionId', sessionId),
      prop('sessionDate', '2026-10-20'),
      prop('submittedAt', '2026-10-20T08:37:45.000Z'),
      prop('recipeId', recipeId),
      prop('recipeName', 'Banaanismoothie L, G'),
      prop('finalRecipeWeightGrams', 2000),
      prop('recipeComposition', [
        { ingredientId: 'banaani', ingredientName: 'Banaani', actualAmount: 800, unit: 'g' },
      ]),
    ],
  },
  {
    id: 'trim-5',
    actor,
    template: { slug: 'trimSmart' },
    properties: [
      prop('sessionId', sessionId),
      prop('sessionDate', '2026-10-20'),
      prop('submittedAt', '2026-10-20T08:38:03.000Z'),
      prop('recipeId', recipeId),
      prop('ingredientId', 'banaani'),
      prop('ingredientName', 'Banaani'),
      prop('ingredientWeightGrams', 900),
      prop('trimTechniques', 'trimming'),
      prop('estimatedWasteGrams', 200),
      prop('actualWasteGrams', 260),
      { template: { slug: 'duration' }, obj: { value: 4, unit: 'minutes' } },
    ],
  },
  {
    id: 'rescue-5',
    actor,
    template: { slug: 'rescueAndReuse' },
    properties: [
      prop('sessionId', sessionId),
      prop('sessionDate', '2026-10-20'),
      prop('submittedAt', '2026-10-20T08:38:13.000Z'),
      prop('recipeId', recipeId),
      prop('ingredientId', 'banaani'),
      prop('reusableWasteGrams', 0),
      prop('reuseDestination', 'Compost'),
    ],
  },
];

const confirmedTrimReview = {
  id: 'review-trim-5',
  actor,
  template: { slug: 'wastePracticeReview' },
  properties: [
    prop('sessionId', sessionId),
    prop('sessionDate', '2026-10-20'),
    prop('submittedAt', '2026-10-20T08:40:22.000Z'),
    prop('recipeId', recipeId),
    prop('reviewedGame', 'trimSmart'),
    prop('timeEfficiencyScore', 2),
    prop('preparationQualityScore', 4),
    prop('chefFeedback', 'Good peel.'),
  ],
};

function feed(extra: unknown[] = []) {
  return {
    kitchenSkillsTrainerInput: { activities: [...evidence, confirmedTrimReview, ...extra] },
    inputCollectionPari: { me: { id: 'chef-1', firstName: 'Pari', lastName: 'Chef' } },
  };
}

function seedEarlierDispatch(feedFingerprintAtDispatch: string) {
  markKitchenSkillsReviewDispatched(
    'staff1',
    {
      sessionId,
      sessionDate: '2026-10-20',
      submittedAt: '2026-10-20T08:41:00.000Z',
      recipeId,
      reviewedGame: 'portionPrecision',
      timeEfficiencyScore: 3,
      preparationQualityScore: 4,
      source: 'local',
    },
    feedFingerprintAtDispatch,
  );
}

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function reviewPosts(postMessage: { mock: { calls: unknown[][] } }) {
  return postMessage.mock.calls.filter((call) => {
    const payload = call[0] as { type?: string; data?: { template?: string } };
    return payload?.type === 'SILENT_ACTIVITY' && payload.data?.template === 'wastePracticeReview';
  });
}

async function submitScores(user: ReturnType<typeof userEvent.setup>, module: string) {
  await waitFor(() => {
    expect(screen.getByTestId(`kitchen-day-review-${module}-form`)).toBeInTheDocument();
  });
  await user.click(document.getElementById(`time-${recipeId}-${module}-3`)!);
  await user.click(document.getElementById(`quality-${recipeId}-${module}-4`)!);
  await user.click(screen.getByTestId(`kitchen-day-review-${module}-submit`));
  await waitFor(() => {
    expect(screen.getByTestId(`kitchen-day-review-${module}-awaiting`)).toBeInTheDocument();
  });
}

describe('Kitchen Skills trainer three-state assessment status', () => {
  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    resetKitchenSkillsPostStateForTests();
    clearKitchenSkillsReviewDispatchMarkersForTests();
    setHash('');
    vi.restoreAllMocks();
  });

  it('shows Trim confirmed + Portion/Rescue awaiting as Awaiting confirmation at every level', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    setHash(`#/kitchen-day-tutor?actorId=staff1&sessionId=${encodeURIComponent(sessionId)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests(feed());

    // Opens on the earliest module that still needs assessment: Portion (Trim is confirmed).
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-module-tab-portionPrecision')).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });
    expect(screen.queryByTestId('kitchen-day-tutor-recipe-tabs')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-tutor-active-recipe')).toHaveTextContent('Banaanismoothie L, G');
    expect(screen.getByTestId('kitchen-day-tutor-session-counts')).toHaveTextContent(
      '1 confirmed · 0 awaiting confirmation · 2 outstanding',
    );

    await submitScores(user, 'portionPrecision');
    // No auto-switch after submitting.
    expect(screen.getByTestId('kitchen-day-tutor-module-tab-portionPrecision')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.click(screen.getByTestId('kitchen-day-tutor-module-tab-rescueAndReuse'));
    await submitScores(user, 'rescueAndReuse');

    expect(screen.getByTestId('kitchen-day-tutor-session-status')).toHaveTextContent('Awaiting confirmation');
    expect(screen.getByTestId('kitchen-day-tutor-session-counts')).toHaveTextContent(
      '1 confirmed · 2 awaiting confirmation · 0 outstanding',
    );
    expect(screen.getByTestId('kitchen-day-tutor-module-tab-portionPrecision')).toHaveAttribute(
      'data-module-status',
      'awaiting_confirmation',
    );
    expect(screen.getByTestId('kitchen-day-tutor-module-tab-trimSmart')).toHaveAttribute(
      'data-module-status',
      'reviewed',
    );
    expect(screen.queryByText(/Partially reviewed|needs review/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-review-rescueAndReuse-submit')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-review-rescueAndReuse-reassess')).not.toBeInTheDocument();
    expect(reviewPosts(postMessage)).toHaveLength(2);

    await user.click(screen.getByTestId('kitchen-day-tutor-back-staff'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-session-tab-awaiting')).toHaveTextContent(
        'Awaiting confirmation (1)',
      );
    });
    expect(screen.getByTestId('kitchen-day-tutor-session-tab-awaiting')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId(`kitchen-day-tutor-session-counts-${sessionId}`)).toHaveTextContent(
      '1 confirmed · 2 awaiting · 0 to assess',
    );
    expect(screen.getByTestId('kitchen-day-tutor-session-tab-reviewed')).toHaveTextContent('Reviewed (0)');

    await user.click(screen.getByTestId('kitchen-day-tutor-back-staff-list'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-staff-staff1')).toHaveAttribute(
        'aria-label',
        'staff1 Staff: 1 session · 0 to assess · 1 awaiting · 0 reviewed',
      );
    });
  });

  it('becomes Reviewed only when the feed contains every assessment', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    setHash(`#/kitchen-day-tutor?actorId=staff1&sessionId=${encodeURIComponent(sessionId)}`);
    render(<AppRouter />);
    const review = (module: string) => ({
      ...confirmedTrimReview,
      id: `review-${module}`,
      properties: confirmedTrimReview.properties.map((item) =>
        item.template.slug === 'reviewedGame' ? prop('reviewedGame', module) : item,
      ),
    });
    ingestInputCollectionsForTests(feed([review('portionPrecision'), review('rescueAndReuse')]));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-session-status')).toHaveTextContent('Reviewed');
    });
    expect(screen.getByTestId('kitchen-day-tutor-session-counts')).toHaveTextContent(
      '3 confirmed · 0 awaiting confirmation · 0 outstanding',
    );
    expect(screen.getByTestId('kitchen-day-review-portionPrecision-submitted')).toBeInTheDocument();
  });

  it('keeps an earlier dispatch awaiting after reload and never re-posts it', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    // Dispatched in an earlier page load against an older feed; the reopened feed is a new
    // GameBus fetch (it now holds the Trim review) and still lacks the Portion assessment.
    seedEarlierDispatch(kitchenSkillsTrainerFeedFingerprint(evidence));
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    setHash(`#/kitchen-day-tutor?actorId=staff1&sessionId=${encodeURIComponent(sessionId)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests(feed());

    await user.click(await screen.findByTestId('kitchen-day-tutor-module-tab-portionPrecision'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-portionPrecision-awaiting')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-review-portionPrecision-missing-after-refresh')).toHaveTextContent(
      /not in the GameBus trainer feed loaded after that/,
    );
    expect(screen.queryByTestId('kitchen-day-review-portionPrecision-submit')).not.toBeInTheDocument();
    expect(reviewPosts(postMessage)).toHaveLength(0);

    // Deliberate, confirmed re-assessment only.
    confirmSpy.mockReturnValueOnce(false);
    await user.click(screen.getByTestId('kitchen-day-review-portionPrecision-reassess'));
    expect(screen.getByTestId('kitchen-day-review-portionPrecision-awaiting')).toBeInTheDocument();
    await user.click(screen.getByTestId('kitchen-day-review-portionPrecision-reassess'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-portionPrecision-form')).toBeInTheDocument();
    });
    expect(reviewPosts(postMessage)).toHaveLength(0);
    await submitScores(user, 'portionPrecision');
    expect(reviewPosts(postMessage)).toHaveLength(1);
    expect(screen.queryByTestId('kitchen-day-review-portionPrecision-reassess')).not.toBeInTheDocument();
  });

  it('does not unlock Assess again when the old feed snapshot is replayed after a reload', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    seedEarlierDispatch(kitchenSkillsTrainerFeedFingerprint(feed().kitchenSkillsTrainerInput.activities));
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    setHash(`#/kitchen-day-tutor?actorId=staff1&sessionId=${encodeURIComponent(sessionId)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests(feed());

    await user.click(await screen.findByTestId('kitchen-day-tutor-module-tab-portionPrecision'));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-portionPrecision-awaiting')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('kitchen-day-review-portionPrecision-missing-after-refresh')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-review-portionPrecision-reassess')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-review-portionPrecision-submit')).not.toBeInTheDocument();
  });

  it('does not unlock Assess again when the same page receives the unchanged feed again later', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    setHash(`#/kitchen-day-tutor?actorId=staff1&sessionId=${encodeURIComponent(sessionId)}`);
    render(<AppRouter />);
    ingestInputCollectionsForTests(feed());
    await submitScores(user, 'portionPrecision');

    const realNow = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(realNow + 5 * 60_000);
    ingestInputCollectionsForTests(feed());
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-portionPrecision-awaiting')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('kitchen-day-review-portionPrecision-reassess')).not.toBeInTheDocument();
  });

  it('never matches a review to the wrong student or session', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    setHash(`#/kitchen-day-tutor?actorId=staff1&sessionId=${encodeURIComponent(sessionId)}`);
    render(<AppRouter />);
    const foreign = {
      ...confirmedTrimReview,
      id: 'review-foreign',
      actor: { id: 'staff2', name: 'staff2 staff' },
      properties: confirmedTrimReview.properties.map((item) =>
        item.template.slug === 'reviewedGame' ? prop('reviewedGame', 'portionPrecision') : item,
      ),
    };
    ingestInputCollectionsForTests(feed([foreign]));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-session-counts')).toHaveTextContent(
        '1 confirmed · 0 awaiting confirmation · 2 outstanding',
      );
    });
    expect(screen.getByTestId('kitchen-day-review-portionPrecision-form')).toBeInTheDocument();
  });
});
