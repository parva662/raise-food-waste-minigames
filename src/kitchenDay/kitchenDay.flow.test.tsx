/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppRouter } from '../AppRouter';
import { getAppMode } from '../gamebus/appMode';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

async function recordCarrot(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('kitchen-day-category-root'));
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
    const sessionLabel = screen.getByTestId('kitchen-day-header-session').textContent;
    await recordCarrot(user);
    expect(screen.getByTestId('kitchen-day-waste-percent')).toHaveTextContent('9.0%');
    expect(screen.getByTestId('kitchen-day-reference-comparison')).toHaveTextContent(
      /percentage points/,
    );
    expect(screen.queryByText(/idle|percentile|LIVE E2E/i)).not.toBeInTheDocument();

    await user.click(screen.getByTestId('kitchen-day-nav-reuse'));
    expect(screen.getByTestId('kitchen-day-rescue-actual-waste')).toHaveTextContent('450 g');
    await user.type(screen.getByTestId('kitchen-day-reusable-waste'), '200');
    await user.type(screen.getByTestId('kitchen-day-reuse-destination'), 'Carrot soup tomorrow');
    expect(screen.getByTestId('kitchen-day-discarded-waste')).toHaveTextContent('250 g');
    await user.click(screen.getByTestId('kitchen-day-save-rescue'));

    await user.click(screen.getByTestId('kitchen-day-nav-portion'));
    await user.selectOptions(screen.getByTestId('kitchen-day-recipe-select'), 'mayonnaise');
    await user.type(screen.getByTestId('kitchen-day-actual-yogurt'), '1000');
    await user.type(screen.getByTestId('kitchen-day-actual-lemon-juice'), '100');
    await user.type(screen.getByTestId('kitchen-day-actual-salt'), '8');
    await user.type(screen.getByTestId('kitchen-day-actual-pepper'), '2');
    await user.type(screen.getByTestId('kitchen-day-final-recipe-weight'), '1850');
    await user.click(screen.getByTestId('kitchen-day-submit-portion'));

    await user.click(screen.getByTestId('kitchen-day-nav-review'));
    expect(screen.getByTestId('kitchen-day-trim-carrot')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-rescue-carrot')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-portion-mayonnaise')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-header-session')).toHaveTextContent(sessionLabel ?? '');
  });

  it('blocks a second carrot and allows potato', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordCarrot(user);
    await user.click(screen.getByTestId('kitchen-day-add-another-ingredient'));
    await user.click(screen.getByTestId('kitchen-day-category-root'));
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
});
