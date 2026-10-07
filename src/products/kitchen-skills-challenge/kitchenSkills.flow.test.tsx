/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRouter } from '@/app/AppRouter';
import { getAppMode } from '@/app/routes';
import {
  completeTrimAfterIngredient,
  recordAnkanrintaPortion,
  recordBanaaniTrim,
  recordHedelmatPortion,
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
    expect(screen.getByTestId('kitchen-day-recipe-select')).toHaveAttribute('placeholder', 'Select recipe…');
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
    await recordHedelmatPortion(user);
    expect(screen.getByTestId('kitchen-day-trim-progress')).toHaveTextContent('Step 1 of 7: Ingredient');
    expect(screen.getByTestId('kitchen-day-ingredient-name')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-add-more-ingredients')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-finish-challenge')).not.toBeInTheDocument();
    await recordBanaaniTrim(user);
    expect(screen.getByTestId('kitchen-day-trim-step-result')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-trim-recipe')).toHaveTextContent('Hedelmät M,G');
    expect(screen.queryByTestId('kitchen-day-waste-percent')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-reference-comparison')).not.toBeInTheDocument();
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
    expect(screen.getByTestId('kitchen-day-finish-trim-headline')).toHaveTextContent('Banaani');
    expect(screen.getByTestId('kitchen-day-finish-trim-headline')).toHaveTextContent('450 g');
    expect(screen.getByTestId('kitchen-day-finish-trim-headline')).not.toHaveTextContent('%');
    expect(screen.getByTestId('kitchen-day-finish-reuse-headline')).toHaveTextContent('Carrot soup tomorrow');
    expect(screen.getByTestId('kitchen-day-finish-portion-headline')).toHaveTextContent('Hedelmät M,G');
    expect(screen.getByTestId('kitchen-day-finish-trim-section')).not.toHaveAttribute('open');
    expect(screen.getByTestId('kitchen-day-finish-portion-details-42')).not.toHaveAttribute('open');
    expect(screen.queryByTestId('kitchen-day-finish-add-more-ingredients')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-finish-waste-percent-banaani')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-finish-add-another-ingredient')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-finish-challenge')).toBeInTheDocument();
    expect(postMessage).not.toHaveBeenCalled();
    await user.click(screen.getByTestId('kitchen-day-finish-challenge'));
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({ type: 'EXIT' }, '*');
  });

  it('offers another unused recipe ingredient only after the current Trim ingredient is saved', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordHedelmatPortion(user);
    await selectTrimIngredient(user, 'Banaani', 'Banaani');
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
    expect(screen.getByRole('option', { name: 'Omena' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Viinirypäle, tumma, kivetön' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Banaani' })).not.toBeInTheDocument();
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
    await recordHedelmatPortion(user);
    await selectTrimIngredient(user, 'Banaani', 'Banaani');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByTestId('kitchen-day-starting-weight'), 'erffggv');
    expect(screen.getByTestId('kitchen-day-starting-weight')).toHaveValue('');
    await user.type(screen.getByTestId('kitchen-day-starting-weight'), '12a50');
    expect(screen.getByTestId('kitchen-day-starting-weight')).toHaveValue('1250');
  });

  it('lets the student go back inside Trim and correct values before save', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordHedelmatPortion(user);
    await selectTrimIngredient(user, 'Banaani', 'Banaani');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByTestId('kitchen-day-starting-weight'), '5000');
    await user.click(screen.getByTestId('kitchen-day-trim-back'));
    expect(screen.getByTestId('kitchen-day-trim-step-ingredient')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-ingredient-name')).toHaveValue('Banaani');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByTestId('kitchen-day-starting-weight')).toHaveValue('5000');
  });

  it('opens recipe and ingredient comboboxes with ordered options before typing', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await user.click(screen.getByTestId('kitchen-day-recipe-select'));
    expect(screen.getByRole('option', { name: 'Ankanrinta FLOW' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Hedelmät M,G' })).toBeInTheDocument();
    expect(screen.queryByText('Type to search recipes')).not.toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Hedelmät M,G' }));
    await user.type(screen.getByTestId('kitchen-day-actual-banaani'), '1500');
    await user.type(screen.getByTestId('kitchen-day-actual-omena'), '1200');
    await user.type(screen.getByTestId('kitchen-day-actual-viinirypale-tumma-kiveton'), '1000');
    await user.type(screen.getByTestId('kitchen-day-final-recipe-weight'), '3700');
    await user.click(screen.getByTestId('kitchen-day-submit-portion'));
    const ingredientInput = screen.getByTestId('kitchen-day-ingredient-name');
    expect(ingredientInput).toHaveAttribute('placeholder', 'Select ingredient…');
    expect(screen.queryByTestId('kitchen-day-trim-no-eligible')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-trim-no-remaining')).not.toBeInTheDocument();
    await user.click(ingredientInput);
    expect(screen.getByRole('option', { name: 'Banaani' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Omena' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Viinirypäle, tumma, kivetön' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Hunaja, juokseva, Hunajainen' })).not.toBeInTheDocument();
    expect(screen.queryByText('Type to search ingredients')).not.toBeInTheDocument();
  });

  it('shows no eligible Trim ingredients for Ankanrinta and lets the session complete', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordAnkanrintaPortion(user);
    expect(screen.getByTestId('kitchen-day-trim-no-eligible')).toHaveTextContent(
      'No Trim Smart ingredients for this recipe',
    );
    expect(screen.queryByTestId('kitchen-day-trim-no-remaining')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-ingredient-name')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-continue-reuse')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-nav-reuse')).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByTestId('kitchen-day-open-finish-summary'));
    expect(screen.getByTestId('kitchen-day-finish-summary')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-finish-trim-headline')).toHaveTextContent('No trim recorded');
    expect(screen.getByTestId('kitchen-day-finish-reuse-headline')).toHaveTextContent('No reuse recorded');
    expect(screen.queryByTestId('kitchen-day-finish-add-another-ingredient')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-finish-challenge')).toBeInTheDocument();
  });

  it('opens Reuse from Record reuse after a saved Trim ingredient with reusable waste', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordHedelmatPortion(user);
    await recordBanaaniTrim(user);
    await user.click(screen.getByTestId('kitchen-day-continue-reuse'));
    expect(screen.getByTestId('kitchen-day-rescue')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-rescue-ingredient')).toHaveDisplayValue('Banaani');
  });

  it('does not offer Reuse when saved Trim has no reusable waste', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordHedelmatPortion(user);
    await recordBanaaniTrim(user, '0');
    expect(screen.getByTestId('kitchen-day-add-another-ingredient')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-continue-reuse')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-nav-reuse')).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByTestId('kitchen-day-nav-reuse'));
    expect(screen.getByTestId('kitchen-day-trim')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-rescue')).not.toBeInTheDocument();
  });

  it('opens Reuse from Record reuse after every recipe ingredient is recorded', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordHedelmatPortion(user);
    await recordBanaaniTrim(user);
    await user.click(screen.getByTestId('kitchen-day-add-another-ingredient'));
    await selectTrimIngredient(user, 'Omena', 'Omena');
    await completeTrimAfterIngredient(user);
    await user.click(screen.getByTestId('kitchen-day-add-another-ingredient'));
    await selectTrimIngredient(user, 'Viinirypäle', 'Viinirypäle, tumma, kivetön');
    await completeTrimAfterIngredient(user);
    expect(screen.queryByTestId('kitchen-day-add-another-ingredient')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('kitchen-day-nav-portion'));
    await user.click(screen.getByTestId('kitchen-day-nav-trim'));
    expect(screen.getByTestId('kitchen-day-trim-no-remaining')).toHaveTextContent(
      'All recipe ingredients for this session are already recorded.',
    );
    await user.click(screen.getByTestId('kitchen-day-continue-reuse'));
    expect(screen.getByTestId('kitchen-day-rescue')).toBeInTheDocument();
  });

  it('allows backward navigation to Portion and from Reuse back to Trim', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordHedelmatPortion(user);
    expect(screen.getByTestId('kitchen-day-nav-portion').tagName).toBe('A');
    await user.click(screen.getByTestId('kitchen-day-nav-portion'));
    expect(screen.getByTestId('kitchen-day-portion')).toBeInTheDocument();
    await user.click(screen.getByTestId('kitchen-day-nav-trim'));
    expect(screen.getByTestId('kitchen-day-trim')).toBeInTheDocument();
    await recordBanaaniTrim(user);
    await user.click(screen.getByTestId('kitchen-day-continue-reuse'));
    expect(screen.getByTestId('kitchen-day-rescue')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-finish-challenge')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('kitchen-day-nav-trim'));
    expect(screen.getByTestId('kitchen-day-trim')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-trim-step-ingredient')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-finish-challenge')).not.toBeInTheDocument();
  });

  it('hides Finish while adding another ingredient from the summary', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordHedelmatPortion(user);
    await recordBanaaniTrim(user);
    await user.click(screen.getByTestId('kitchen-day-continue-reuse'));
    await user.type(screen.getByTestId('kitchen-day-reusable-waste'), '200');
    await user.type(screen.getByTestId('kitchen-day-reuse-destination'), 'Stock');
    await user.click(screen.getByTestId('kitchen-day-save-rescue'));
    expect(screen.getByTestId('kitchen-day-finish-challenge')).toBeInTheDocument();
    await user.click(screen.getByTestId('kitchen-day-finish-add-another-ingredient'));
    expect(screen.queryByTestId('kitchen-day-finish-summary')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-finish-challenge')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-trim-step-ingredient')).toBeInTheDocument();
  });
});
