/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { ingestInputCollectionsForTests, resetGameBusBridgeForTests } from '../gamebus/bridge';
import { AppRouter } from '../AppRouter';
import { KitchenDaySessionProvider } from './KitchenDaySessionContext';
import { MyDayView } from './MyDayView';

const sessionOne = 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23';
const sessionTwo = 'kitchen-day:kitchen-day-task-1:user-2:2026-09-23';

function trimProps(sessionId: string, ingredientId: string, name: string) {
  return [
    { template: { slug: 'sessionId' }, value: { value: sessionId } },
    { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
    { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:03:00.000Z' } },
    { template: { slug: 'ingredientId' }, value: { value: ingredientId } },
    { template: { slug: 'ingredientName' }, value: { value: name } },
    { template: { slug: 'ingredientCategory' }, value: { value: 'root' } },
    { template: { slug: 'ingredientWeightGrams' }, value: { value: 5000 } },
    { template: { slug: 'trimTechniques' }, value: { value: 'trimming' } },
    { template: { slug: 'estimatedWasteGrams' }, value: { value: 600 } },
    { template: { slug: 'actualWasteGrams' }, value: { value: 450 } },
    { template: { slug: 'duration' }, obj: { value: 3, unit: 'minutes' } },
  ];
}

const groupCollections = {
  kitchenGroupInput: {
    activities: [
      {
        id: 'act-trim-1',
        actor: { id: 'user-1', name: 'Student One' },
        template: { slug: 'trimSmart' },
        start: '2026-09-23T10:00:00.000Z',
        end: '2026-09-23T10:03:00.000Z',
        properties: trimProps(sessionOne, 'carrot', 'Carrot'),
      },
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
        id: 'act-portion-1',
        actor: { id: 'user-1', name: 'Student One' },
        template: { slug: 'portionPrecision' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: sessionOne } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T11:00:00.000Z' } },
          { template: { slug: 'recipeId' }, value: { value: 'mayonnaise' } },
          { template: { slug: 'recipeName' }, value: { value: 'Mayonnaise' } },
          { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 1850 } },
          {
            template: { slug: 'recipeComposition' },
            value: {
              value: [
                { ingredientId: 'yogurt', ingredientName: 'Yogurt', actualAmount: 1000, unit: 'g' },
              ],
            },
          },
        ],
      },
      {
        id: 'act-trim-2',
        actor: { id: 'user-2', name: 'Student Two' },
        template: { slug: 'trimSmart' },
        start: '2026-09-23T10:00:00.000Z',
        end: '2026-09-23T10:03:00.000Z',
        properties: trimProps(sessionTwo, 'onion', 'Onion'),
      },
      {
        template: { slug: 'trimSmart' },
        actor: { id: 'user-1', name: 'Student One' },
        properties: [{ template: { slug: 'ingredientId' }, value: { value: 'unfinished' } }],
      },
    ],
  },
  inputCollectionPari: {
    me: { id: 'user-1', firstName: 'Student', lastName: 'One' },
  },
};

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('Kitchen Day student and chef dashboards', () => {
  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    setHash('');
  });

  it('shows the authenticated student completed records together as read-only', async () => {
    render(
      <KitchenDaySessionProvider
        initialSession={{ sessionId: sessionOne, sessionDate: '2026-09-23' }}
      >
        <MyDayView />
      </KitchenDaySessionProvider>,
    );
    ingestInputCollectionsForTests(groupCollections);
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-trim-carrot')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-overview')).toHaveTextContent('cannot be edited');
    expect(screen.getByTestId('kitchen-day-review-status')).toHaveTextContent('Kitchen Day complete');
    expect(screen.getByTestId('kitchen-day-evidence')).toHaveClass('kitchen-day-evidence');
    expect(screen.getByTestId('kitchen-day-rescue-carrot')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-portion-mayonnaise')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-waste-percent-carrot')).toHaveTextContent('9.0%');
    expect(screen.getByTestId('kitchen-day-trim-carrot').textContent).not.toMatch(/Carrotroot/i);
    expect(screen.queryByText(/kitchen-day:/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-trim-onion')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-trim-unfinished')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('lets the chef open one student session grouped by participant and sessionId', async () => {
    const user = userEvent.setup();
    setHash('#/kitchen-day-tutor');
    render(<AppRouter />);
    ingestInputCollectionsForTests(groupCollections);
    await waitFor(() => {
      expect(screen.getByTestId(`kitchen-day-chef-session-${sessionOne}`)).toBeInTheDocument();
    });
    expect(screen.getByTestId(`kitchen-day-chef-session-${sessionTwo}`)).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-tutor-page')).toBeInTheDocument();
    expect(screen.queryByText(/leaderboard/i)).not.toBeInTheDocument();
    await user.click(screen.getByTestId(`kitchen-day-chef-session-${sessionOne}`));
    await waitFor(() => {
      expect(screen.getByTestId('kitchen-day-chef-selected')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kitchen-day-chef-readonly')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-chef-trim-carrot')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-chef-rescue-carrot')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-chef-portion-mayonnaise')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-chef-trim-onion')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-chef-trim-unfinished')).not.toBeInTheDocument();
  });
});
