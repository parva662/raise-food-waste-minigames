// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '../AppRouter';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

async function reachMeasureStep(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByTestId('trim-smart-category-select'), 'vegetables');
  await user.type(screen.getByTestId('trim-smart-ingredient-name'), 'Carrot');
  await user.type(screen.getByTestId('trim-smart-starting-weight'), '1000');
  await user.click(screen.getByTestId('trim-smart-start-challenge'));
  await user.click(screen.getByTestId('trim-smart-practice-careful_trimming'));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

describe('trim smart step focus management', () => {
  beforeEach(() => {
    setHash('#/waste/trim-smart');
  });

  afterEach(() => {
    cleanup();
    setHash('');
    vi.unstubAllGlobals();
  });

  it('moves focus to the new step heading as part of the step transition', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);

    await user.selectOptions(screen.getByTestId('trim-smart-category-select'), 'vegetables');
    await user.type(screen.getByTestId('trim-smart-ingredient-name'), 'Carrot');
    await user.type(screen.getByTestId('trim-smart-starting-weight'), '1000');
    await user.click(screen.getByTestId('trim-smart-start-challenge'));

    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'Choose your approach' }),
    );

    await user.click(screen.getByTestId('trim-smart-practice-careful_trimming'));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'Measure your ingredient waste' }),
    );
  });

  it('does not defer step focus into an animation frame that could interrupt input', async () => {
    const queuedFrames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      queuedFrames.push(callback),
    );

    const user = userEvent.setup();
    render(<AppRouter />);
    await reachMeasureStep(user);

    const wasteInput = screen.getByTestId('trim-smart-waste-input') as HTMLInputElement;
    await user.click(wasteInput);
    expect(queuedFrames).toHaveLength(0);

    // Anything still pending from the transition would land here, between
    // focusing the field and typing into it.
    act(() => {
      queuedFrames.splice(0).forEach((callback) => callback(0));
    });
    await user.type(wasteInput, '110', { skipClick: true });

    expect(document.activeElement).toBe(wasteInput);
    expect(wasteInput.value).toBe('110');
    expect(screen.getByTestId('trim-smart-submit-button')).toBeEnabled();
  });
});
