/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRouter } from '@/app/AppRouter';
import { getAppMode } from '@/app/routes';
import {
  recordAnkanrintaPortion,
  recordDuckBreastTrim,
  selectTrimIngredient,
} from '@/products/kitchen-skills-challenge/kitchenSkills.testSupport';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('Kitchen Day connected flow', () => {
  beforeEach(() => {
    setHash('#/kitchen-day');
  });

  afterEach(() => {
    cleanup();
    setHash('');
    vi.restoreAllMocks();
  });

  it('starts Portion Precision with the searchable recipe combobox', () => {
    render(<AppRouter />);
    expect(screen.getByTestId('kitchen-day-portion')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-recipe-select')).toHaveAttribute('placeholder', 'Type to search recipes');
    expect(screen.queryByTestId('kitchen-day-trim')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-finish-bar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-finish-challenge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-nav-review')).not.toBeInTheDocument();
  });

  it('uses the kitchen-day route without replacing v1 trim-smart', () => {
    render(<AppRouter />);
    expect(getAppMode()).toBe('kitchen-day');
    expect(screen.getByTestId('kitchen-day-page')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-live-blocked')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-nav-chef')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-nav-my-day')).not.toBeInTheDocument();
  });

  it('does not let the student leave Portion for Trim or Reuse before the recipe is saved', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    expect(screen.getByTestId('kitchen-day-nav-trim')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('kitchen-day-nav-reuse')).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByTestId('kitchen-day-nav-trim'));
    expect(screen.getByTestId('kitchen-day-portion')).toBeInTheDocument();
    setHash('#/kitchen-day/trim');
    expect(screen.getByTestId('kitchen-day-portion')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-trim')).not.toBeInTheDocument();
  });

  it('records Portion, Trim from that recipe, Reuse, then Finish', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordAnkanrintaPortion(user);
    expect(screen.getByTestId('kitchen-day-trim-progress')).toHaveTextContent('Step 1 of 7: Ingredient');
    expect(screen.getByTestId('kitchen-day-ingredient-name')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-add-more-ingredients')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-finish-challenge')).not.toBeInTheDocument();
    await recordDuckBreastTrim(user);
    expect(screen.getByTestId('kitchen-day-trim-step-result')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-add-another-ingredient')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-continue-reuse')).toBeInTheDocument();
    await user.click(screen.getByTestId('kitchen-day-continue-reuse'));
    expect(screen.getByTestId('kitchen-day-rescue-actual-waste')).toHaveTextContent('450 g');
    await user.type(screen.getByTestId('kitchen-day-reusable-waste'), '200');
    await user.type(screen.getByTestId('kitchen-day-reuse-destination'), 'Carrot soup tomorrow');
    expect(screen.getByTestId('kitchen-day-discarded-waste')).toHaveTextContent('250 g');
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    await user.click(screen.getByTestId('kitchen-day-save-rescue'));

    expect(screen.getByTestId('kitchen-day-finish-summary')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-finish-trim-headline')).toHaveTextContent('ANKKA, RINTAFILEE');
    expect(screen.getByTestId('kitchen-day-finish-reuse-headline')).toHaveTextContent('Carrot soup tomorrow');
    expect(screen.getByTestId('kitchen-day-finish-portion-headline')).toHaveTextContent('Ankanrinta FLOW');
    expect(screen.getByTestId('kitchen-day-finish-trim-section')).not.toHaveAttribute('open');
    expect(screen.getByTestId('kitchen-day-finish-portion-details-1')).not.toHaveAttribute('open');
    expect(screen.queryByTestId('kitchen-day-finish-add-more-ingredients')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-finish-challenge')).toBeInTheDocument();
    expect(postMessage).not.toHaveBeenCalled();
    await user.click(screen.getByTestId('kitchen-day-finish-challenge'));
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({ type: 'EXIT' }, '*');
  });

  it('offers another unused recipe ingredient only after the current Trim ingredient is saved', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordAnkanrintaPortion(user);
    await selectTrimIngredient(user, 'ANKKA', 'ANKKA, RINTAFILEE');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.queryByTestId('kitchen-day-add-another-ingredient')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-nav-reuse')).toHaveAttribute('aria-disabled', 'true');
    await user.type(screen.getByTestId('kitchen-day-starting-weight'), '5000');
    await user.click(screen.getByTestId('kitchen-day-weight-continue'));
    await user.click(screen.getByTestId('kitchen-day-technique-trimming'));
    await user.click(screen.getByTestId('kitchen-day-technique-continue'));
    await user.type(screen.getByTestId('kitchen-day-estimated-waste'), '600');
    await user.click(screen.getByTestId('kitchen-day-estimate-continue'));
    await user.click(screen.getByTestId('kitchen-day-start-preparation'));
    await user.click(screen.getByTestId('kitchen-day-finish-preparation'));
    await user.click(screen.getByTestId('kitchen-day-timer-continue'));
    await user.type(screen.getByTestId('kitchen-day-actual-waste'), '450');
    expect(screen.queryByTestId('kitchen-day-add-another-ingredient')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('kitchen-day-submit-trim'));
    await user.click(screen.getByTestId('kitchen-day-add-another-ingredient'));
    expect(screen.getByTestId('kitchen-day-trim-step-ingredient')).toBeInTheDocument();
    const input = screen.getByTestId('kitchen-day-ingredient-name');
    await user.click(input);
    await user.type(input, 'Rosmariini');
    expect(screen.getByRole('option', { name: 'Rosmariini tuore 100g' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'ANKKA, RINTAFILEE' })).not.toBeInTheDocument();
  });

  it('does not offer reuse inventory without Trim waste', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await user.click(screen.getByTestId('kitchen-day-nav-reuse'));
    expect(screen.getByTestId('kitchen-day-portion')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-rescue')).not.toBeInTheDocument();
  });

  it('rejects letters in gram fields at the input boundary', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordAnkanrintaPortion(user);
    await selectTrimIngredient(user, 'ANKKA', 'ANKKA, RINTAFILEE');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByTestId('kitchen-day-starting-weight'), 'erffggv');
    expect(screen.getByTestId('kitchen-day-starting-weight')).toHaveValue('');
    await user.type(screen.getByTestId('kitchen-day-starting-weight'), '12a50');
    expect(screen.getByTestId('kitchen-day-starting-weight')).toHaveValue('1250');
  });
});
