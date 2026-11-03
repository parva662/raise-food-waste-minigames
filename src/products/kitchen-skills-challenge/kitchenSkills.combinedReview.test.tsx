/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as detectEmbed from '@/platform/gamebus/detectEmbed';
import { AppRouter } from '@/app/AppRouter';
import {
  ingestInputCollectionsForTests,
  ingestTaskForTests,
  resetGameBusBridgeForTests,
} from '@/platform/gamebus/bridge';
import { resetKitchenSkillsPostStateForTests } from '@/products/kitchen-skills-challenge/gamebus/postActivity';
import { clearKitchenSkillsReviewDispatchMarkersForTests } from '@/products/kitchen-skills-challenge/gamebus/reviewDispatchMarker';
import { validateWastePracticeReviewLinkedProperties } from '@/products/kitchen-skills-challenge/gamebus/reviewPostErrors';
import { kitchenSkillsTrainerTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import type { TaskData } from '@/platform/gamebus/types';
import type { KitchenSkillsReviewEntry } from '@/products/kitchen-skills-challenge/domain/types';

const ALL_COMBINED_LINKS = [
  'sessionId',
  'sessionDate',
  'submittedAt',
  'recipeId',
  'portionTimeEfficiencyScore',
  'portionPreparationQualityScore',
  'portionChefFeedback',
  'trimTimeEfficiencyScore',
  'trimPreparationQualityScore',
  'trimChefFeedback',
  'rescueTimeEfficiencyScore',
  'rescuePreparationQualityScore',
  'rescueChefFeedback',
] as const;

function prop(slug: string, value: string | number | unknown) {
  return { template: { slug }, value: { value } };
}

function durationProp(minutes: number) {
  return { template: { slug: 'duration' }, value: { value: minutes, unit: 'minutes' } };
}

function combinedTask(links: readonly string[] = ALL_COMBINED_LINKS): TaskData {
  return {
    id: 'combined-tutor-task',
    href: 'embedded-task-combined-tutor',
    type: 'USER_TRIGGERED_EMBEDDED',
    url: 'http://localhost:5173/#/kitchen-day-tutor-combined',
    order: 1,
    title: 'Combined tutor',
    description: null,
    thumbnail: null,
    hero: null,
    cycle: null,
    isVisible: true,
    activityTemplates: [
      {
        id: 'kd-review',
        slug: 'wastePracticeReview',
        name: 'Waste practice review',
        providers: [],
        linkedProperties: links.map((ref, index) => ({
          order: index + 1,
          name: ref,
          required: !ref.endsWith('ChefFeedback'),
          ref,
        })),
      },
    ],
    inputCollections: [],
    propertyTemplates: [],
    taskRules: [],
  };
}

const sessionId = 'kitchen-day:t:student-1:2026-11-03:1';

function evidenceActivities() {
  return [
    {
      id: 'portion-1',
      actor: { id: 'student-1', name: 'Ada' },
      template: { slug: 'portionPrecision' },
      properties: [
        prop('sessionId', sessionId),
        prop('sessionDate', '2026-11-03'),
        prop('submittedAt', '2026-11-03T09:00:00.000Z'),
        prop('recipeId', 'recipe-1'),
        prop('recipeName', 'Soup'),
        prop('finalRecipeWeightGrams', 1200),
        prop('recipeComposition', [
          { ingredientId: 'ing-1', ingredientName: 'Carrot', actualAmount: 500, unit: 'g' },
        ]),
      ],
    },
    {
      id: 'trim-1',
      actor: { id: 'student-1', name: 'Ada' },
      template: { slug: 'trimSmart' },
      start: '2026-11-03T09:05:00.000Z',
      end: '2026-11-03T09:10:00.000Z',
      properties: [
        prop('sessionId', sessionId),
        prop('sessionDate', '2026-11-03'),
        prop('submittedAt', '2026-11-03T09:10:00.000Z'),
        prop('recipeId', 'recipe-1'),
        prop('ingredientId', 'ing-1'),
        prop('ingredientName', 'Carrot'),
        prop('ingredientWeightGrams', 500),
        prop('trimTechniques', 'peeling'),
        prop('estimatedWasteGrams', 50),
        prop('actualWasteGrams', 40),
        durationProp(5),
      ],
    },
  ];
}

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('combined tutor assessment', () => {
  beforeEach(() => {
    resetGameBusBridgeForTests();
    resetKitchenSkillsPostStateForTests();
    clearKitchenSkillsReviewDispatchMarkersForTests();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('registers the combined route and deep links', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    setHash(`#/kitchen-day-tutor-combined?actorId=student-1&sessionId=${encodeURIComponent(sessionId)}`);
    render(<AppRouter />);
    ingestTaskForTests(combinedTask());
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: { activities: evidenceActivities() },
      inputCollectionPari: { me: { id: 'tutor-1', firstName: 'Tutor', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-tutor-combined-session')).toBeInTheDocument();
    });
  });

  it('posts one activity for two evidenced modules with valid zero scores', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const user = userEvent.setup();
    const postMessage = vi.fn();
    window.parent.postMessage = postMessage;
    setHash(`#/kitchen-day-tutor-combined?actorId=student-1&sessionId=${encodeURIComponent(sessionId)}`);
    render(<AppRouter />);
    ingestTaskForTests(combinedTask());
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: { activities: evidenceActivities() },
      inputCollectionPari: { me: { id: 'tutor-1', firstName: 'Tutor', lastName: 'One' } },
    });

    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-combined-review-submit')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('kitchen-day-tutor-combined-module-rescueAndReuse')).not.toBeInTheDocument();

    await user.type(screen.getByTestId('kitchen-day-combined-review-portionPrecision-time'), '0');
    await user.type(screen.getByTestId('kitchen-day-combined-review-portionPrecision-quality'), '5');
    await user.type(screen.getByTestId('kitchen-day-combined-review-trimSmart-time'), '3');
    await user.type(screen.getByTestId('kitchen-day-combined-review-trimSmart-quality'), '4');
    await user.click(screen.getByTestId('kitchen-day-combined-review-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-combined-review-portionPrecision-awaiting')).toBeInTheDocument();
    });

    const silent = postMessage.mock.calls
      .map((call) => call[0])
      .find((payload) => payload?.type === 'SILENT_ACTIVITY');
    expect(silent?.data?.template).toBe('wastePracticeReview');
    expect(silent?.data?.actors).toEqual(['student-1']);
    const templates = silent?.data?.properties?.map((property: { template: string }) => property.template);
    expect(templates).toEqual([
      'sessionId',
      'sessionDate',
      'submittedAt',
      'recipeId',
      'portionTimeEfficiencyScore',
      'portionPreparationQualityScore',
      'trimTimeEfficiencyScore',
      'trimPreparationQualityScore',
    ]);
    expect(templates).not.toContain('reviewedGame');
    expect(templates).not.toContain('timeEfficiencyScore');
    expect(templates).not.toContain('rescueTimeEfficiencyScore');
  });

  it('keeps drafts when combined property links are missing', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const user = userEvent.setup();
    setHash(`#/kitchen-day-tutor-combined?actorId=student-1&sessionId=${encodeURIComponent(sessionId)}`);
    render(<AppRouter />);
    ingestTaskForTests(
      combinedTask(['sessionId', 'sessionDate', 'submittedAt', 'recipeId', 'portionTimeEfficiencyScore']),
    );
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: { activities: evidenceActivities() },
      inputCollectionPari: { me: { id: 'tutor-1', firstName: 'Tutor', lastName: 'One' } },
    });

    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-combined-review-submit')).toBeInTheDocument();
    });
    await user.type(screen.getByTestId('kitchen-day-combined-review-portionPrecision-time'), '1');
    await user.type(screen.getByTestId('kitchen-day-combined-review-portionPrecision-quality'), '2');
    await user.type(screen.getByTestId('kitchen-day-combined-review-trimSmart-time'), '3');
    await user.type(screen.getByTestId('kitchen-day-combined-review-trimSmart-quality'), '4');
    await user.click(screen.getByTestId('kitchen-day-combined-review-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-combined-review-error')).toHaveTextContent(
        'portionPreparationQualityScore',
      );
    });
    expect(screen.getByTestId('kitchen-day-combined-review-portionPrecision-time')).toHaveValue('1');
    expect(screen.getByTestId('kitchen-day-combined-review-trimSmart-quality')).toHaveValue('4');
  });

  it('old route fails clearly when legacy links are disconnected', () => {
    const entry: KitchenSkillsReviewEntry = {
      sessionId,
      sessionDate: '2026-11-03',
      submittedAt: '2026-11-03T12:00:00.000Z',
      recipeId: 'recipe-1',
      reviewedGame: 'portionPrecision',
      timeEfficiencyScore: 3,
      preparationQualityScore: 4,
      source: 'local',
    };
    const disconnected = {
      ...kitchenSkillsTrainerTaskFixture,
      activityTemplates: [
        {
          id: 'kd-review',
          slug: 'wastePracticeReview',
          name: 'Waste practice review',
          providers: [],
          linkedProperties: ALL_COMBINED_LINKS.map((ref, index) => ({
            order: index + 1,
            name: ref,
            required: true,
            ref,
          })),
        },
      ],
    };
    const result = validateWastePracticeReviewLinkedProperties(disconnected, entry);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toEqual(
      expect.arrayContaining(['reviewedGame', 'timeEfficiencyScore', 'preparationQualityScore']),
    );
  });

  it('ignores blank scores and does not treat them as zero', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const user = userEvent.setup();
    setHash(`#/kitchen-day-tutor-combined?actorId=student-1&sessionId=${encodeURIComponent(sessionId)}`);
    render(<AppRouter />);
    ingestTaskForTests(combinedTask());
    ingestInputCollectionsForTests({
      kitchenSkillsTrainerInput: { activities: evidenceActivities() },
      inputCollectionPari: { me: { id: 'tutor-1', firstName: 'Tutor', lastName: 'One' } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-combined-review-submit')).toBeDisabled();
    });
    await user.type(screen.getByTestId('kitchen-day-combined-review-portionPrecision-time'), '1');
    expect(screen.getByTestId('kitchen-day-combined-review-submit')).toBeDisabled();
    fireEvent.click(screen.getByTestId('kitchen-day-combined-review-submit'));
    expect(screen.queryByTestId('kitchen-day-combined-review-portionPrecision-awaiting')).not.toBeInTheDocument();
  });
});
