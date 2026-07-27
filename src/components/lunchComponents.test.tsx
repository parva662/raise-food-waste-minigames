// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealSection } from './MealSection';
import { RegularLunchPanel } from './RegularLunchPanel';
import { SoupLunchPanel } from './SoupLunchPanel';
import { PortionFoodCard } from './PortionFoodCard';
import { GameStatusHeader } from './GameStatusHeader';
import { SelectionPanel } from './SelectionPanel';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import { getSubmissionWindowStatus } from '../services/submissionWindow';
import { calculatePointsForTimingStatus } from '../utils/points';
import { FIXTURE_LUNCH_DATE, SUBMISSION_TIMES } from '../test/fixtures/dates';

afterEach(() => {
  cleanup();
});

describe('unified portion food UI', () => {
  const slots = resolveMealSlotsForDate(FIXTURE_LUNCH_DATE)!;
  const submissionWindow = getSubmissionWindowStatus(SUBMISSION_TIMES.midday, FIXTURE_LUNCH_DATE);

  it('always shows quantity controls on portion food card', () => {
    render(
      <PortionFoodCard
        item={slots.main}
        categoryLabel="Main dish"
        quantity={0}
        sectionActive={false}
        menuInteractive
        onActivateSection={() => undefined}
        onIncrement={() => undefined}
        onDecrement={() => undefined}
      />,
    );
    expect(screen.getByLabelText(`Increase ${slots.main.name}`)).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('calls increment handler from plus button', async () => {
    const user = userEvent.setup();
    const onIncrement = vi.fn();
    render(
      <PortionFoodCard
        item={slots.main}
        categoryLabel="Main dish"
        quantity={0}
        sectionActive={false}
        menuInteractive
        onActivateSection={() => undefined}
        onIncrement={onIncrement}
        onDecrement={() => undefined}
      />,
    );
    await user.click(screen.getByLabelText(`Increase ${slots.main.name}`));
    expect(onIncrement).toHaveBeenCalled();
  });

  it('renders regular and soup panels with shared grid', () => {
    render(
      <RegularLunchPanel
        main={slots.main}
        vegetarian={slots.vegetarian}
        mainQuantity={1}
        vegetarianQuantity={0}
        sectionActive
        menuInteractive
        onActivateSection={() => undefined}
        onAdjustMain={() => undefined}
        onAdjustVegetarian={() => undefined}
      />,
    );
    expect(document.querySelector('.portion-food-grid')).toBeInTheDocument();
  });

  it('shows points badges in game header', () => {
    render(<GameStatusHeader submissionWindow={submissionWindow} now={SUBMISSION_TIMES.midday} />);
    expect(screen.getByText('20 base')).toBeInTheDocument();
  });

  it('activates meal section from header area click', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(
      <MealSection
        sectionId="regular-lunch"
        title="Regular lunch"
        description="Choose the main dish, the vegetarian dish, or both."
        active={false}
        muted={false}
        onActivate={onActivate}
      >
        <SoupLunchPanel
          soup={slots.soup}
          dessert={slots.dessert}
          soupQuantity={0}
          dessertQuantity={0}
          sectionActive={false}
          menuInteractive
          onActivateSection={() => undefined}
          onAdjustSoup={() => undefined}
          onAdjustDessert={() => undefined}
        />
      </MealSection>,
    );
    await user.click(screen.getByText('Regular lunch'));
    expect(onActivate).toHaveBeenCalled();
  });
});

describe('saved status', () => {
  it('shows saved points row', () => {
    const scoring = calculatePointsForTimingStatus('on-time');
    render(
      <SelectionPanel
        summaryLines={[]}
        hasSavedDeclaration
        updatedAt={SUBMISSION_TIMES.midday.toISOString()}
        savedScoring={scoring}
        isSubmitDisabled
        submissionWindow={getSubmissionWindowStatus(SUBMISSION_TIMES.midday, FIXTURE_LUNCH_DATE)}
        menuInteractive={false}
        onReset={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(screen.getByText(/25 points/i)).toBeInTheDocument();
  });
});
