// @vitest-environment jsdom
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MenuSection } from './MenuSection';
import { SelectionPanel } from './SelectionPanel';
import { SavedStatusRow } from './SavedStatusRow';
import { MenuStatusBanner } from './MenuStatusBanner';
import { categoryOrder } from '../data/menu';
import { resolveMenuForDate } from '../services/menuResolver';
import { getSubmissionWindowStatus } from '../services/submissionWindow';
import { calculatePointsForTimingStatus } from '../utils/points';
import { FIXTURE_LUNCH_DATE, SUBMISSION_TIMES } from '../test/fixtures/dates';
import { CATEGORY_TITLES } from '../test/fixtures/menus';

afterEach(() => {
  cleanup();
});

describe('menu sections', () => {
  const menu = resolveMenuForDate(FIXTURE_LUNCH_DATE);
  if (menu.status !== 'available') throw new Error('Expected available menu');

  it('renders four menu section headings', () => {
    render(
      <>
        {categoryOrder.map((category) => (
          <MenuSection
            key={category.key}
            title={category.title}
            category={category.key}
            items={menu.items.filter((item) => item.category === category.key)}
            getQuantity={() => 0}
            onIncrement={() => undefined}
            onDecrement={() => undefined}
          />
        ))}
      </>,
    );

    for (const title of CATEGORY_TITLES) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
  });

  it('renders all items from the resolved daily menu', () => {
    render(
      <>
        {categoryOrder.map((category) => (
          <MenuSection
            key={category.key}
            title={category.title}
            category={category.key}
            items={menu.items.filter((item) => item.category === category.key)}
            getQuantity={() => 0}
            onIncrement={() => undefined}
            onDecrement={() => undefined}
          />
        ))}
      </>,
    );

    expect(new Set(menu.items.map((item) => item.id)).size).toBe(menu.items.length);
    for (const item of menu.items) {
      expect(screen.getAllByRole('heading', { level: 3, name: item.name }).length).toBeGreaterThan(0);
    }
  });
});

describe('selection panel behaviour', () => {
  const menu = resolveMenuForDate(FIXTURE_LUNCH_DATE);
  if (menu.status !== 'available') throw new Error('Expected available menu');
  const item = menu.items[0];
  const submissionWindow = getSubmissionWindowStatus(SUBMISSION_TIMES.midday, FIXTURE_LUNCH_DATE);

  const baseProps = {
    selections: [],
    itemCount: 0,
    totalPortions: 0,
    progressPercent: 0,
    noLunch: false,
    hasSavedDeclaration: false,
    updatedAt: null,
    savedScoring: null,
    submitButtonState: 'submit' as const,
    isSubmitDisabled: true,
    isDirty: false,
    menuChanged: false,
    submissionWindow,
    submissionNow: SUBMISSION_TIMES.midday,
    menuInteractive: true,
    onIncrement: vi.fn(),
    onDecrement: vi.fn(),
    onRemove: vi.fn(),
    onNoLunchToggle: vi.fn(),
    onReset: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('updates selected-item count and total portions', () => {
    render(
      <SelectionPanel
        {...baseProps}
        selections={[{ itemId: item.id, name: item.name, quantity: 2, unit: item.unit }]}
        itemCount={1}
        totalPortions={2}
        progressPercent={20}
      />,
    );

    expect(screen.getByText(/1 item/i)).toBeInTheDocument();
    expect(screen.getByText(/2 portions/i)).toBeInTheDocument();
  });

  it('renders saved status with 25 total points after on-time submission', () => {
    render(
      <SavedStatusRow
        scoring={calculatePointsForTimingStatus('on-time')}
        updatedAt={SUBMISSION_TIMES.midday.toISOString()}
      />,
    );
    expect(screen.getByText('Lunch saved · 25 points')).toBeInTheDocument();
    expect(screen.getByText('20 base points + 5 on-time bonus')).toBeInTheDocument();
  });

  it('renders saved status with 15 total points for late declarations', () => {
    render(
      <SavedStatusRow
        scoring={calculatePointsForTimingStatus('late')}
        updatedAt={SUBMISSION_TIMES.lateEvening.toISOString()}
      />,
    );
    expect(screen.getByText('Lunch saved late · 15 points')).toBeInTheDocument();
  });

  it('keeps Update my lunch visible and disabled when unchanged', () => {
    render(
      <SelectionPanel
        {...baseProps}
        hasSavedDeclaration
        savedScoring={calculatePointsForTimingStatus('on-time')}
        updatedAt={SUBMISSION_TIMES.midday.toISOString()}
        submitButtonState="update"
        isSubmitDisabled
      />,
    );

    expect(screen.getByRole('button', { name: 'Update my lunch' })).toBeDisabled();
    expect(screen.getByText('Change your selection to update your lunch.')).toBeInTheDocument();
  });

  it('enables update and shows unsaved-changes text after a genuine change', () => {
    render(
      <SelectionPanel
        {...baseProps}
        hasSavedDeclaration
        savedScoring={calculatePointsForTimingStatus('on-time')}
        updatedAt={SUBMISSION_TIMES.midday.toISOString()}
        submitButtonState="update"
        isSubmitDisabled={false}
        isDirty
      />,
    );

    expect(screen.getByRole('button', { name: 'Update my lunch' })).toBeEnabled();
    expect(screen.getByText('You have unsaved changes.')).toBeInTheDocument();
  });

  it('renders no-lunch state', () => {
    render(
      <SelectionPanel
        {...baseProps}
        noLunch
        progressPercent={100}
      />,
    );

    expect(screen.getByRole('button', { name: 'No lunch tomorrow' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders the deadline card and selected-items list together', () => {
    render(
      <SelectionPanel
        {...baseProps}
        selections={[{ itemId: item.id, name: item.name, quantity: 1, unit: item.unit }]}
        itemCount={1}
        totalPortions={1}
        progressPercent={10}
      />,
    );

    expect(screen.getByRole('heading', { name: submissionWindow.message })).toBeInTheDocument();
    expect(screen.getByText(item.name)).toBeInTheDocument();
  });
});

describe('menu status messaging', () => {
  it('shows the canteen-closed override message', () => {
    render(<MenuStatusBanner message="The canteen is closed on this date." reason="Public holiday" />);
    expect(screen.getByText(/The canteen is closed on this date/i)).toBeInTheDocument();
    expect(screen.getByText(/Public holiday/i)).toBeInTheDocument();
  });
});

describe('quantity controls', () => {
  const menu = resolveMenuForDate(FIXTURE_LUNCH_DATE);
  if (menu.status !== 'available') throw new Error('Expected available menu');
  const item = menu.items[0];

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls increment handlers from menu cards', async () => {
    const user = userEvent.setup();
    const onIncrement = vi.fn();
    render(
      <MenuSection
        title="Vegetarian Lunch"
        category="vegetarian"
        items={[item]}
        getQuantity={() => 0}
        onIncrement={onIncrement}
        onDecrement={() => undefined}
      />,
    );

    await user.click(screen.getByRole('button', { name: `Increase quantity for ${item.name}` }));
    expect(onIncrement).toHaveBeenCalledTimes(1);
  });
});
