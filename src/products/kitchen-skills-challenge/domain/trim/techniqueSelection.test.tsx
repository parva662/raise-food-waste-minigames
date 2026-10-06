/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppRouter } from '@/app/AppRouter';
import { TRIM_TECHNIQUES } from '@/products/kitchen-skills-challenge/domain/types';
import { TRIM_TECHNIQUE_LABELS } from '@/products/kitchen-skills-challenge/domain/trim/techniques';
import {
  recordAnkanrintaPortion,
  selectTrimIngredient,
} from '@/products/kitchen-skills-challenge/kitchenSkills.testSupport';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

async function openTechniqueStep(user: ReturnType<typeof userEvent.setup>) {
  await recordAnkanrintaPortion(user);
  await selectTrimIngredient(user, 'ANKKA', 'ANKKA, RINTAFILEE');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.type(screen.getByTestId('kitchen-day-starting-weight'), '5000');
  await user.click(screen.getByTestId('kitchen-day-weight-continue'));
}

describe('Trim Smart technique selection', () => {
  beforeEach(() => {
    setHash('#/kitchen-day');
  });

  afterEach(() => {
    cleanup();
    setHash('');
  });

  it('does not render a category step', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordAnkanrintaPortion(user);
    expect(screen.getByTestId('kitchen-day-trim-step-ingredient')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-category-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-category-root')).not.toBeInTheDocument();
  });

  it('renders all ten techniques as compact buttons and stores the same enum value', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await openTechniqueStep(user);

    const grid = screen.getByTestId('kitchen-day-technique-list');
    expect(grid).toHaveClass('kitchen-day-chip-grid');
    expect(grid).toHaveClass('kitchen-day-chip-grid--techniques');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    for (const value of TRIM_TECHNIQUES) {
      const button = screen.getByTestId(`kitchen-day-technique-${value}`);
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveClass('kitchen-day-chip--compact');
      expect(button).toHaveTextContent(TRIM_TECHNIQUE_LABELS[value]);
      expect(button).toHaveAttribute('aria-pressed', 'false');
    }

    await user.click(screen.getByTestId('kitchen-day-technique-julienne'));
    expect(screen.getByTestId('kitchen-day-technique-julienne')).toHaveClass('kitchen-day-chip--active');
    expect(screen.getByTestId('kitchen-day-technique-julienne')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('kitchen-day-technique-trimming')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('kitchen-day-technique-continue')).toBeEnabled();

    await user.click(screen.getByTestId('kitchen-day-technique-continue'));
    expect(screen.getByTestId('kitchen-day-trim-step-estimate')).toBeInTheDocument();
    await user.type(screen.getByTestId('kitchen-day-estimated-waste'), '600');
    await user.click(screen.getByTestId('kitchen-day-estimate-continue'));
    await user.click(screen.getByTestId('kitchen-day-start-preparation'));
    await user.click(screen.getByTestId('kitchen-day-finish-preparation'));
    await user.click(screen.getByTestId('kitchen-day-timer-continue'));
    await user.type(screen.getByTestId('kitchen-day-actual-waste'), '450');
    await user.click(screen.getByTestId('kitchen-day-submit-trim'));
    await user.click(screen.getByTestId('kitchen-day-continue-reuse'));
    await user.type(screen.getByTestId('kitchen-day-reusable-waste'), '200');
    await user.type(screen.getByTestId('kitchen-day-reuse-destination'), 'Stock');
    await user.click(screen.getByTestId('kitchen-day-save-rescue'));
    expect(screen.getByTestId('kitchen-day-finish-trim-ankka-rintafilee')).toHaveTextContent('Julienne');
  });
});
