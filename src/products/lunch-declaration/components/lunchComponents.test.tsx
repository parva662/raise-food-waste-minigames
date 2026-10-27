// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealSection } from '@/products/lunch-declaration/components/MealSection';
import { RegularLunchPanel } from '@/products/lunch-declaration/components/RegularLunchPanel';
import { SoupDessertPackagePanel } from '@/products/lunch-declaration/components/SoupDessertPackagePanel';
import { PortionFoodCard } from '@/products/lunch-declaration/components/PortionFoodCard';
import { GameStatusHeader } from '@/products/lunch-declaration/components/GameStatusHeader';
import { SelectionPanel } from '@/products/lunch-declaration/components/SelectionPanel';
import { FoodImage } from '@/products/lunch-declaration/components/FoodImage';
import { resolveMealSlotsForDate } from '@/shared/menu/mealSlots';
import { publicAssetUrl } from '@/shared/menu/menuItemImage';
import { getSubmissionWindowStatus } from '@/products/lunch-declaration/submissionWindow';
import { FIXTURE_LUNCH_DATE, SUBMISSION_TIMES } from '@/test/fixtures/dates';

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
        categoryLabel="Classic dish"
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
        categoryLabel="Classic dish"
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

  it('renders exclusive classic panel and soup package panel', () => {
    const { rerender } = render(
      <RegularLunchPanel
        item={slots.main}
        categoryLabel="Classic dish"
        quantity={1}
        sectionActive
        menuInteractive
        onActivateSection={() => undefined}
        onAdjust={() => undefined}
      />,
    );
    expect(document.querySelector('.portion-food-grid')).toBeInTheDocument();

    rerender(
      <SoupDessertPackagePanel
        soup={slots.soup}
        dessert={slots.dessert}
        packageQuantity={2}
        sectionActive
        menuInteractive
        onActivateSection={() => undefined}
        onAdjustPackage={() => undefined}
      />,
    );
    expect(screen.getByRole('group', { name: /Soup \+ Dessert package:/i })).toBeInTheDocument();
    expect(screen.getByText(/One quantity sets both soup and dessert/i)).toBeInTheDocument();
  });

  it('shows submission deadline in game header', () => {
    render(
      <GameStatusHeader
        submissionWindow={submissionWindow}
        now={SUBMISSION_TIMES.midday}
        lunchDate={FIXTURE_LUNCH_DATE}
      />,
    );
    expect(screen.getByText('Submit by 23:59')).toBeInTheDocument();
    expect(screen.queryByText('20 base')).not.toBeInTheDocument();
  });

  it('activates meal section from header area click', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(
      <MealSection
        sectionId="classic-dish"
        title="Classic dish"
        description="Choose only the classic main dish."
        active={false}
        muted={false}
        onActivate={onActivate}
      >
        <RegularLunchPanel
          item={slots.main}
          categoryLabel="Classic dish"
          quantity={0}
          sectionActive={false}
          menuInteractive
          onActivateSection={() => undefined}
          onAdjust={() => undefined}
        />
      </MealSection>,
    );
    await user.click(screen.getByText('Choose only the classic main dish.'));
    expect(onActivate).toHaveBeenCalled();
  });
});

describe('saved status', () => {
  it('shows saved lunch row without points', () => {
    render(
      <SelectionPanel
        summaryLines={[]}
        hasSavedDeclaration
        updatedAt={SUBMISSION_TIMES.midday.toISOString()}
        lunchDate={FIXTURE_LUNCH_DATE}
        uiStep="review"
        submitStatus="dispatched"
        submitError={null}
        isReviewDisabled
        isConfirmDisabled
        submissionWindow={getSubmissionWindowStatus(SUBMISSION_TIMES.midday, FIXTURE_LUNCH_DATE)}
        menuInteractive={false}
        onReset={() => undefined}
        onEnterReview={() => undefined}
        onExitReview={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(screen.getByTestId('declaration-dispatched-status')).toHaveTextContent(/waiting for GameBus/i);
    expect(screen.queryByText('Lunch saved')).not.toBeInTheDocument();
    expect(screen.queryByText(/points/i)).not.toBeInTheDocument();
  });
});

describe('FoodImage', () => {
  it('falls back from broken dedicated image to placeholder', () => {
    const placeholder = publicAssetUrl('images/menu/placeholders/main.svg');
    const { container } = render(
      <FoodImage
        src="/missing-dedicated.webp"
        placeholderSrc={placeholder}
        alt="Test dish"
        category="classic"
      />,
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    fireEvent.error(img!);
    expect(container.querySelector('img')?.getAttribute('src')).toBe(placeholder);
  });
});
