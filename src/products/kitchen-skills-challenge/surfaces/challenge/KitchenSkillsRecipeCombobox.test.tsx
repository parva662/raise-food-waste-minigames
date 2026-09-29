/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  filterRecipeOptions,
  KitchenSkillsRecipeCombobox,
} from '@/products/kitchen-skills-challenge/surfaces/challenge/KitchenSkillsRecipeCombobox';

const options = [
  { id: '1', label: 'Ankanrinta FLOW' },
  { id: '2', label: 'Uuniperuna L,G' },
  { id: '3', label: 'Vihreä powersmoothie M,G' },
];

function Harness() {
  const [value, setValue] = useState('');
  return (
    <div>
      <KitchenSkillsRecipeCombobox options={options} value={value} onChange={setValue} />
      <p data-testid="selected-id">{value || 'none'}</p>
    </div>
  );
}

describe('KitchenSkillsRecipeCombobox', () => {
  afterEach(() => {
    cleanup();
  });

  it('does not list recipes until the user types a query', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByTestId('kitchen-day-recipe-select'));
    expect(screen.getByTestId('kitchen-day-recipe-list')).toHaveTextContent('Type to search recipes');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('filters by substring anywhere in the name', () => {
    expect(filterRecipeOptions(options, 'FLOW').map((item) => item.id)).toEqual(['1']);
    expect(filterRecipeOptions(options, 'peruna').map((item) => item.id)).toEqual(['2']);
    expect(filterRecipeOptions(options, 'green')).toEqual([]);
  });

  it('requires an exact list selection instead of free text', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByTestId('kitchen-day-recipe-select'), 'Ankanrinta FLOW');
    expect(screen.getByTestId('selected-id')).toHaveTextContent('none');
    await user.click(screen.getByRole('option', { name: 'Ankanrinta FLOW' }));
    expect(screen.getByTestId('selected-id')).toHaveTextContent('1');
  });

  it('supports keyboard navigation of filtered options', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByTestId('kitchen-day-recipe-select');
    await user.type(input, 'G');
    expect(screen.getByRole('option', { name: 'Uuniperuna L,G' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Vihreä powersmoothie M,G' })).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByTestId('selected-id')).toHaveTextContent('3');
  });
});
