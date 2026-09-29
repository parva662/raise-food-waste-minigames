/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRouter } from '@/app/AppRouter';
import { getAppMode } from '@/app/routes';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

async function recordCarrot(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId('kitchen-day-ingredient-name'), 'Carrot');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
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
  await user.click(screen.getByTestId('kitchen-day-submit-trim'));
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

  it('starts Trim on Ingredient with no category UI', () => {
    render(<AppRouter />);
    expect(screen.getByTestId('kitchen-day-trim-progress')).toHaveTextContent('Step 1 of 7: Ingredient');
    expect(screen.getByTestId('kitchen-day-trim-step-ingredient')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-trim-step-category')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-category-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-category-root')).not.toBeInTheDocument();
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

  it('records Trim, reuse, and Portion on the same session', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordCarrot(user);
    expect(screen.getByTestId('kitchen-day-rescue-actual-waste')).toHaveTextContent('450 g');
    await user.type(screen.getByTestId('kitchen-day-reusable-waste'), '200');
    await user.type(screen.getByTestId('kitchen-day-reuse-destination'), 'Carrot soup tomorrow');
    expect(screen.getByTestId('kitchen-day-discarded-waste')).toHaveTextContent('250 g');
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    await user.click(screen.getByTestId('kitchen-day-save-rescue'));

    expect(screen.getByTestId('kitchen-day-portion')).toBeInTheDocument();
    const recipeInput = screen.getByTestId('kitchen-day-recipe-select');
    await user.click(recipeInput);
    await user.type(recipeInput, 'Ankanrinta FLOW');
    await user.click(screen.getByRole('option', { name: 'Ankanrinta FLOW' }));
    await user.type(screen.getByTestId('kitchen-day-actual-ankka-rintafilee'), '11250');
    await user.type(screen.getByTestId('kitchen-day-actual-rosmariini-tuore-100g'), '450');
    await user.type(screen.getByTestId('kitchen-day-actual-berner-merisuola-keskikarkea-25'), '900');
    await user.type(screen.getByTestId('kitchen-day-actual-meira-luomu-mustapippuri'), '900');
    await user.type(screen.getByTestId('kitchen-day-final-recipe-weight'), '13500');
    await user.click(screen.getByTestId('kitchen-day-submit-portion'));

    expect(screen.getByTestId('kitchen-day-finish-summary')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-finish-trim-headline')).toHaveTextContent('Carrot');
    expect(screen.getByTestId('kitchen-day-finish-reuse-headline')).toHaveTextContent('Carrot soup tomorrow');
    expect(screen.getByTestId('kitchen-day-finish-portion-headline')).toHaveTextContent('Ankanrinta FLOW');
    expect(screen.getByTestId('kitchen-day-finish-trim-section')).not.toHaveAttribute('open');
    expect(screen.getByTestId('kitchen-day-finish-portion-details-1')).not.toHaveAttribute('open');
    expect(screen.getByTestId('kitchen-day-finish-challenge').closest('.kitchen-day-finish-dialog__actions')).toBeTruthy();
    expect(screen.getByTestId('kitchen-day-finish-trim-carrot')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-finish-rescue-carrot')).toBeInTheDocument();
    expect(postMessage).not.toHaveBeenCalled();
    await user.click(screen.getByTestId('kitchen-day-finish-challenge'));
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({ type: 'EXIT' }, '*');
  });

  it('blocks a second carrot and allows potato', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordCarrot(user);
    await user.click(screen.getByTestId('kitchen-day-nav-trim'));
    await user.type(screen.getByTestId('kitchen-day-ingredient-name'), 'Carrot');
    expect(screen.getByTestId('kitchen-day-duplicate-ingredient')).toBeInTheDocument();
    await user.clear(screen.getByTestId('kitchen-day-ingredient-name'));
    await user.type(screen.getByTestId('kitchen-day-ingredient-name'), 'Potato');
    expect(screen.queryByTestId('kitchen-day-duplicate-ingredient')).not.toBeInTheDocument();
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
    await user.type(screen.getByTestId('kitchen-day-ingredient-name'), 'Carrot');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByTestId('kitchen-day-starting-weight'), 'erffggv');
    expect(screen.getByTestId('kitchen-day-starting-weight')).toHaveValue('');
    await user.type(screen.getByTestId('kitchen-day-starting-weight'), '12a50');
    expect(screen.getByTestId('kitchen-day-starting-weight')).toHaveValue('1250');
  });
});
