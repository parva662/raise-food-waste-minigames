/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ingestInputCollectionsForTests, resetGameBusBridgeForTests } from '../gamebus/bridge';
import { SessionEvidence } from './SessionEvidence';
import { SessionReviewView } from './SessionReviewView';
import { KitchenDaySessionProvider } from './KitchenDaySessionContext';
import type {
  KitchenDayPortionEntry,
  KitchenDayRescueEntry,
  KitchenDayReviewEntry,
  KitchenDayTrimEntry,
} from './types';

const sessionId = 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23';

const trimEntries: KitchenDayTrimEntry[] = [
  {
    sessionId,
    sessionDate: '2026-09-23',
    submittedAt: '2026-09-23T10:03:00.000Z',
    ingredientId: 'potato',
    ingredientName: 'Potato',
    ingredientCategory: 'root',
    ingredientWeightGrams: 222,
    trimTechniques: 'julienne',
    estimatedWasteGrams: 22,
    actualWasteGrams: 10,
    durationMinutes: 3 / 60,
    preparationStartedAt: '2026-09-23T10:00:00.000Z',
    preparationEndedAt: '2026-09-23T10:00:03.000Z',
    source: 'local',
  },
];

const rescueEntries: KitchenDayRescueEntry[] = [
  {
    sessionId,
    sessionDate: '2026-09-23',
    ingredientId: 'potato',
    reusableWasteGrams: 5,
    reuseDestination: 'Soup',
    submittedAt: '2026-09-23T10:10:00.000Z',
    source: 'local',
  },
];

const portionEntries: KitchenDayPortionEntry[] = [
  {
    sessionId,
    sessionDate: '2026-09-23',
    submittedAt: '2026-09-23T11:00:00.000Z',
    recipeId: '1',
    recipeName: 'Ankanrinta FLOW',
    finalRecipeWeightGrams: 13100,
    source: 'local',
    recipeComposition: [
      { ingredientId: 'ankka-rintafilee', ingredientName: 'ANKKA, RINTAFILEE', actualAmount: 11250, unit: 'g' },
      { ingredientId: 'rosmariini-tuore-100g', ingredientName: 'Rosmariini tuore 100g', actualAmount: 495, unit: 'g' },
      { ingredientId: 'berner-merisuola-keskikarkea-25', ingredientName: 'Berner Merisuola keskikarkea 25', actualAmount: 900, unit: 'g' },
      { ingredientId: 'meira-luomu-mustapippuri', ingredientName: 'Meira Luomu mustapippuri', actualAmount: 450, unit: 'g' },
    ],
  },
];

const review: KitchenDayReviewEntry = {
  sessionId,
  sessionDate: '2026-09-23',
  submittedAt: '2026-09-23T12:00:00.000Z',
  timeEfficiencyScore: 4,
  preparationQualityScore: 5,
  chefFeedback: 'Keep the julienne even.',
  source: 'persisted',
};

function following(first: HTMLElement, second: HTMLElement) {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe('Session review presentation', () => {
  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
  });

  it('stacks modules vertically with labelled values and a separate tutor assessment', () => {
    const { container } = render(
      <SessionEvidence
        trimEntries={trimEntries}
        rescueEntries={rescueEntries}
        portionEntries={portionEntries}
        review={review}
      />,
    );

    const evidence = screen.getByTestId('kitchen-day-evidence');
    const trim = screen.getByTestId('kitchen-day-trim-section');
    const rescue = screen.getByTestId('kitchen-day-rescue-section');
    const portion = screen.getByTestId('kitchen-day-portion-section');
    const tutor = screen.getByTestId('kitchen-day-tutor-review');

    expect(evidence).toHaveClass('kitchen-day-evidence');
    expect(evidence).not.toHaveClass('chef-results-metrics');
    expect(following(trim, rescue)).toBe(true);
    expect(following(rescue, portion)).toBe(true);
    expect(following(portion, tutor)).toBe(true);
    expect(tutor).toHaveClass('kitchen-day-evidence-section--assessment');

    const potato = screen.getByTestId('kitchen-day-trim-potato');
    expect(potato.querySelector('h4')).toHaveTextContent('Potato');
    expect(potato.textContent).not.toMatch(/potatoRoot vegetablesStarting/i);
    expect(potato.textContent).not.toMatch(/Starting 222 gJulienne/i);
    expect(potato.querySelector('dt')?.textContent).toBe('Starting weight');
    expect([...potato.querySelectorAll('dt')].map((node) => node.textContent)).toEqual(
      expect.arrayContaining([
        'Starting weight',
        'Technique',
        'Estimated waste',
        'Actual waste',
        'Waste rate',
        'Duration',
      ]),
    );
    expect(potato.querySelector('dd')?.textContent).toBe('222 g');
    expect(screen.getByTestId('kitchen-day-rescue-potato').querySelector('h4')).toHaveTextContent('Potato');
    expect(screen.getByTestId('kitchen-day-rescue-potato').textContent).toMatch(/Reusable/);
    expect(screen.getByTestId('kitchen-day-rescue-potato').textContent).toMatch(/Soup/);

    expect(screen.getByTestId('kitchen-day-portion-accuracy-1')).toHaveTextContent('96.3%');
    expect(screen.getByTestId('kitchen-day-portion-expected-final-1')).toHaveTextContent('13500 g');
    expect(screen.getByTestId('kitchen-day-portion-final-deviation-1')).toHaveTextContent('3.0%');
    expect(screen.getByTestId('kitchen-day-portion-target-1-ankka-rintafilee')).toHaveTextContent('11250 g');
    expect(screen.getByTestId('kitchen-day-portion-actual-1-ankka-rintafilee')).toHaveTextContent('11250 g');
    expect(screen.getByTestId('kitchen-day-deviation-1-ankka-rintafilee')).toHaveTextContent('Exact');
    expect(screen.getByTestId('kitchen-day-portion-difference-1-rosmariini-tuore-100g')).toHaveTextContent('45 g over');
    expect(screen.getByTestId('kitchen-day-deviation-1-rosmariini-tuore-100g')).toHaveTextContent('10.0% over');
    expect(screen.getByTestId('kitchen-day-portion-difference-1-meira-luomu-mustapippuri')).toHaveTextContent(
      '450 g under',
    );
    expect(screen.getByTestId('kitchen-day-deviation-1-meira-luomu-mustapippuri')).toHaveTextContent('50.0% under');
    expect(screen.getByTestId('kitchen-day-portion-target-1-ankka-rintafilee')).not.toHaveTextContent('ANKKA');
    expect(screen.getByTestId('kitchen-day-portion-accuracy-1')).not.toHaveTextContent('Ingredient accuracy');

    expect(tutor).toHaveTextContent('Tutor assessment');
    expect(tutor).toHaveTextContent('4 / 5');
    expect(tutor).toHaveTextContent('5 / 5');
    expect(tutor).toHaveTextContent('Keep the julienne even.');
    expect(trim).not.toHaveTextContent('Tutor assessment');
    expect(container.textContent).not.toContain(sessionId);
    expect(container.textContent).not.toMatch(/ingredientWeightGrams|trimTechniques|actualWasteGrams/);
  });

  it('shows Kitchen Day complete when required records exist and hides sessionId', async () => {
    render(
      <KitchenDaySessionProvider
        initialSession={{ sessionId, sessionDate: '2026-09-23' }}
      >
        <SessionReviewView />
      </KitchenDaySessionProvider>,
    );
    ingestInputCollectionsForTests({
      kitchenGroupInput: {
        activities: [
          {
            id: 'act-trim-1',
            actor: { id: 'user-1' },
            template: { slug: 'trimSmart' },
            start: '2026-09-23T10:00:00.000Z',
            end: '2026-09-23T10:03:00.000Z',
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionId } },
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
            id: 'act-portion-1',
            actor: { id: 'user-1' },
            template: { slug: 'portionPrecision' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionId } },
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
            id: 'act-trim-other',
            actor: { id: 'user-2' },
            template: { slug: 'trimSmart' },
            start: '2026-09-23T10:00:00.000Z',
            end: '2026-09-23T10:03:00.000Z',
            properties: [
              { template: { slug: 'sessionId' }, value: { value: 'kitchen-day:kitchen-day-task-1:user-2:2026-09-23' } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:03:00.000Z' } },
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
        ],
      },
      inputCollectionPari: { me: { id: 'user-1' } },
    });

    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-review-status')).toHaveTextContent('Kitchen Day complete');
    });
    expect(screen.getByTestId('kitchen-day-session-meta')).toHaveTextContent('23 September 2026');
    expect(screen.queryByText(/All required modules/)).not.toBeInTheDocument();
    expect(screen.queryByText(/kitchen-day:/)).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-trim-carrot')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-trim-onion')).not.toBeInTheDocument();
  });

  it('lists remaining required modules without technical wording', () => {
    render(
      <KitchenDaySessionProvider initialSession={{ sessionId, sessionDate: '2026-09-23' }}>
        <SessionReviewView />
      </KitchenDaySessionProvider>,
    );
    expect(screen.getByTestId('kitchen-day-review-status')).toHaveTextContent('Still to complete');
    expect(screen.getByTestId('kitchen-day-review-status')).toHaveTextContent('Trim Smart');
    expect(screen.getByTestId('kitchen-day-review-status')).toHaveTextContent('Portion Precision');
    expect(screen.queryByText(/All required modules/)).not.toBeInTheDocument();
  });
});
