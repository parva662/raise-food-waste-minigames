/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppRouter } from '@/app/AppRouter';
import {
  recordAnkanrintaPortion,
  recordDuckBreastTrim,
  selectTrimIngredient,
} from '@/products/kitchen-skills-challenge/kitchenSkills.testSupport';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('Kitchen Skills compact data-entry layout', () => {
  beforeEach(() => {
    setHash('#/kitchen-day');
  });

  afterEach(() => {
    cleanup();
    setHash('');
  });

  it('keeps Trim gram fields content-width and primary actions in a sticky footer', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordAnkanrintaPortion(user);
    await selectTrimIngredient(user, 'ANKKA', 'ANKKA, RINTAFILEE');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    const gramRow = screen.getByTestId('kitchen-day-starting-weight').closest('.kitchen-day-input-row');
    expect(gramRow).toHaveClass('kitchen-day-input-row--grams');
    expect(screen.getByTestId('kitchen-day-weight-continue').closest('.kitchen-day-form-actions--sticky')).toBeTruthy();
  });

  it('keeps Reuse compact: grams stay short, destination is two rows, meta shares a row', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordAnkanrintaPortion(user);
    await recordDuckBreastTrim(user);
    await user.click(screen.getByTestId('kitchen-day-continue-reuse'));
    expect(screen.getByTestId('kitchen-day-rescue-ingredient').closest('.kitchen-day-reuse-meta')).toBeTruthy();
    expect(screen.getByTestId('kitchen-day-rescue-actual-waste').closest('.kitchen-day-reuse-meta')).toBeTruthy();
    expect(screen.getByTestId('kitchen-day-reusable-waste').closest('.kitchen-day-input-row')).toHaveClass(
      'kitchen-day-input-row--grams',
    );
    expect(screen.getByTestId('kitchen-day-reuse-destination')).toHaveAttribute('rows', '2');
    expect(screen.getByTestId('kitchen-day-save-rescue').closest('.kitchen-day-form-actions--sticky')).toBeTruthy();
  });

  it('lays out Portion ingredients as Ingredient | Target | Actual | Result, not a card per line', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    const recipeInput = screen.getByTestId('kitchen-day-recipe-select');
    await user.click(recipeInput);
    await user.type(recipeInput, 'Ankanrinta FLOW');
    await user.click(screen.getByRole('option', { name: 'Ankanrinta FLOW' }));

    const table = screen.getByRole('table', { name: 'Recipe ingredients' });
    expect(table).toHaveClass('kitchen-day-portion-entry');
    expect(screen.getByRole('columnheader', { name: 'Ingredient' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Target' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Actual' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Result' })).toBeInTheDocument();

    const line = screen.getByTestId('kitchen-day-recipe-line-ankka-rintafilee');
    expect(line.tagName).toBe('TR');
    expect(line.querySelector('.kitchen-day-field')).toBeNull();
    expect(screen.getByTestId('kitchen-day-actual-ankka-rintafilee').closest('.kitchen-day-input-row')).toHaveClass(
      'kitchen-day-input-row--grams',
    );
    expect(screen.getByTestId('kitchen-day-required-ankka-rintafilee')).toHaveTextContent('11250 g');
    expect(screen.getByTestId('kitchen-day-deviation-ankka-rintafilee')).toHaveTextContent('—');
    expect(screen.getByTestId('kitchen-day-final-recipe-weight').closest('.kitchen-day-input-row')).toHaveClass(
      'kitchen-day-input-row--grams',
    );
    expect(screen.getByTestId('kitchen-day-submit-portion').closest('.kitchen-day-form-actions--sticky')).toBeTruthy();
  });
});
