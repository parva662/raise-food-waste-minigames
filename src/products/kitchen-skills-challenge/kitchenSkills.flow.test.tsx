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

  it('starts Portion Precision on Kitchen Day', () => {
    render(<AppRouter />);
    expect(screen.getByTestId('kitchen-day-portion')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-trim')).not.toBeInTheDocument();
  });

  it('uses the kitchen-day route without replacing v1 trim-smart', () => {
    render(<AppRouter />);
    expect(getAppMode()).toBe('kitchen-day');
    expect(screen.getByTestId('kitchen-day-page')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-live-blocked')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-nav-chef')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-nav-my-day')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-nav-review')).toBeInTheDocument();
  });

  it('blocks Trim until a recipe is recorded', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await user.click(screen.getByTestId('kitchen-day-nav-trim'));
    expect(screen.getByTestId('kitchen-day-trim-needs-recipe')).toBeInTheDocument();
  });

  it('records Portion, Trim from that recipe, Reuse, then Finish', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordAnkanrintaPortion(user);
    expect(screen.getByTestId('kitchen-day-trim-progress')).toHaveTextContent('Step 1 of 7: Ingredient');
    expect(screen.getByTestId('kitchen-day-trim-step-ingredient')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-trim-step-category')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-category-list')).not.toBeInTheDocument();
    await recordDuckBreastTrim(user);
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
    expect(screen.getByTestId('kitchen-day-finish-challenge').closest('.kitchen-day-finish-dialog__actions')).toBeTruthy();
    expect(screen.getByTestId('kitchen-day-finish-add-more-ingredients')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-finish-trim-ankka-rintafilee')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-finish-rescue-ankka-rintafilee')).toBeInTheDocument();
    expect(postMessage).not.toHaveBeenCalled();
    await user.click(screen.getByTestId('kitchen-day-finish-challenge'));
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({ type: 'EXIT' }, '*');
  });

  it('keeps unused recipe ingredients available and hides recorded ones', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordAnkanrintaPortion(user);
    await recordDuckBreastTrim(user, 'another');
    expect(screen.getByTestId('kitchen-day-trim-step-ingredient')).toBeInTheDocument();
    const options = screen.getByTestId('kitchen-day-ingredient-name') as HTMLSelectElement;
    expect([...options.options].map((option) => option.value)).not.toContain('ankka-rintafilee');
    expect([...options.options].map((option) => option.value)).toContain('rosmariini-tuore-100g');
  });

  it('returns to Trim from the finish summary without closing the challenge', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordAnkanrintaPortion(user);
    await recordDuckBreastTrim(user);
    await user.type(screen.getByTestId('kitchen-day-reusable-waste'), '200');
    await user.type(screen.getByTestId('kitchen-day-reuse-destination'), 'Stock');
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    await user.click(screen.getByTestId('kitchen-day-save-rescue'));
    await user.click(screen.getByTestId('kitchen-day-finish-add-more-ingredients'));
    expect(screen.queryByTestId('kitchen-day-finish-summary')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-trim-step-ingredient')).toBeInTheDocument();
    expect(postMessage).not.toHaveBeenCalled();
    expect(screen.getByTestId('kitchen-day-finish-challenge')).toBeInTheDocument();
  });

  it('does not offer reuse inventory without Trim waste', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await user.click(screen.getByTestId('kitchen-day-nav-reuse'));
    expect(screen.getByTestId('kitchen-day-rescue-empty')).toBeInTheDocument();
  });

  it('rejects letters in gram fields at the input boundary', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordAnkanrintaPortion(user);
    await selectTrimIngredient(user, 'ankka-rintafilee');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByTestId('kitchen-day-starting-weight'), 'erffggv');
    expect(screen.getByTestId('kitchen-day-starting-weight')).toHaveValue('');
    await user.type(screen.getByTestId('kitchen-day-starting-weight'), '12a50');
    expect(screen.getByTestId('kitchen-day-starting-weight')).toHaveValue('1250');
  });
});
