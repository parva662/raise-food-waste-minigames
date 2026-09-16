// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '../AppRouter';
import { getAppMode, getExpectedActivityRef, TRIM_SMART_ACTIVITY_REF } from '../gamebus/appMode';
import { getDocumentTitleForMode } from '../routing/documentTitle';
import * as operationalCalendarModule from '../services/operationalServiceCalendar';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

async function completeIngredientStep(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByTestId('trim-smart-category-select'), 'vegetables');
  await user.type(screen.getByTestId('trim-smart-ingredient-name'), 'Carrot');
  await user.type(screen.getByTestId('trim-smart-starting-weight'), '1000');
  await user.click(screen.getByTestId('trim-smart-start-challenge'));
}

describe('trim smart routing', () => {
  beforeEach(() => {
    vi.spyOn(operationalCalendarModule, 'resolveChefForecastServiceDate').mockReturnValue(
      '2026-07-31',
    );
    setHash('');
  });

  afterEach(() => {
    cleanup();
    setHash('');
    vi.restoreAllMocks();
  });

  it('resolves trim smart mode without query parameters', () => {
    setHash('#/waste/trim-smart');
    expect(getAppMode()).toBe('trim-smart');
    expect(getExpectedActivityRef()).toBe(TRIM_SMART_ACTIVITY_REF);
    expect(getDocumentTitleForMode('trim-smart')).toBe('Trim Smart');
  });

  it('renders trim smart UI at #/waste/trim-smart', () => {
    setHash('#/waste/trim-smart');
    render(<AppRouter />);
    expect(document.title).toBe('Trim Smart');
    expect(screen.getByTestId('trim-smart-page')).toBeInTheDocument();
    expect(screen.getByTestId('trim-smart-step-ingredient')).toBeInTheDocument();
  });

  it('keeps student route unchanged', () => {
    setHash('');
    render(<AppRouter />);
    expect(document.title).toBe('Student Lunch');
    expect(screen.queryByTestId('trim-smart-page')).not.toBeInTheDocument();
  });
});

describe('trim smart participant flow', () => {
  beforeEach(() => {
    setHash('#/waste/trim-smart');
  });

  afterEach(() => {
    cleanup();
    setHash('');
  });

  it('requires valid ingredient step before continuing', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    const start = screen.getByTestId('trim-smart-start-challenge');
    expect(start).toBeDisabled();
    await completeIngredientStep(user);
    expect(screen.getByTestId('trim-smart-step-practice')).toBeInTheDocument();
  });

  it('progresses through practice and submits in standalone demo', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);

    await completeIngredientStep(user);
    await user.click(screen.getByTestId('trim-smart-practice-careful_trimming'));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    const input = screen.getByTestId('trim-smart-waste-input');
    await user.type(input, '125');
    await user.click(screen.getByTestId('trim-smart-submit-button'));

    expect(screen.getByTestId('trim-smart-ingredient-recorded')).toBeInTheDocument();
    expect(screen.getByText('Ingredient recorded')).toBeInTheDocument();
    expect(screen.getByTestId('trim-smart-ingredient-recorded')).toHaveTextContent('Trim carefully');
    expect(screen.getByTestId('trim-smart-add-another')).toBeInTheDocument();
    expect(screen.getByTestId('trim-smart-finish-session')).toBeInTheDocument();
  });

  it('preserves practice when navigating back from measure', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await completeIngredientStep(user);
    await user.click(screen.getByTestId('trim-smart-practice-whole_ingredient_use'));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByTestId('trim-smart-waste-input'), '10');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByTestId('trim-smart-waste-input')).toHaveValue('10');
  });

  it('preserves ingredient fields when navigating back from practice', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await completeIngredientStep(user);
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('trim-smart-ingredient-name')).toHaveValue('Carrot');
    expect(screen.getByTestId('trim-smart-starting-weight')).toHaveValue('1000');
  });

  it('clears practice when ingredient changes after practice was selected', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await completeIngredientStep(user);
    await user.click(screen.getByTestId('trim-smart-practice-careful_trimming'));
    await user.click(screen.getByRole('button', { name: 'Back' }));
    const nameInput = screen.getByTestId('trim-smart-ingredient-name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Potato');
    await user.click(screen.getByTestId('trim-smart-start-challenge'));
    const practiceStep = screen.getByTestId('trim-smart-step-practice');
    const selected = within(practiceStep).queryByRole('radio', { checked: true });
    expect(selected).toBeNull();
  });

  it('does not show other practice option in the UI', () => {
    render(<AppRouter />);
    expect(screen.queryByTestId('trim-smart-practice-other')).not.toBeInTheDocument();
  });
});
