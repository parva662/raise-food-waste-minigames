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

function Harness({
  placeholder = 'Select recipe…',
}: {
  placeholder?: string;
} = {}) {
  const [value, setValue] = useState('');
  return (
    <div>
      <KitchenSkillsRecipeCombobox
        options={options}
        value={value}
        onChange={setValue}
        placeholder={placeholder}
      />
      <p data-testid="selected-id">{value || 'none'}</p>
    </div>
  );
}

function optionNames() {
  return screen.getAllByRole('option').map((option) => option.textContent);
}

describe('KitchenSkillsRecipeCombobox', () => {
  afterEach(() => {
    cleanup();
  });

  it('lists ordered options immediately when opened with an empty query', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByTestId('kitchen-day-recipe-select');
    expect(input).toHaveAttribute('placeholder', 'Select recipe…');
    await user.click(input);
    expect(optionNames()).toEqual(['Ankanrinta FLOW', 'Uuniperuna L,G', 'Vihreä powersmoothie M,G']);
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'false');
    expect(screen.queryByText('Type to search recipes')).not.toBeInTheDocument();
    expect(screen.queryByText('Select recipe…', { selector: '[role="presentation"]' })).not.toBeInTheDocument();
    expect(screen.getByTestId('selected-id')).toHaveTextContent('none');
  });

  it('uses the ingredient placeholder without rendering it as a dropdown row', async () => {
    const user = userEvent.setup();
    render(<Harness placeholder="Select ingredient…" />);
    const input = screen.getByTestId('kitchen-day-recipe-select');
    expect(input).toHaveAttribute('placeholder', 'Select ingredient…');
    await user.click(input);
    expect(optionNames()).toEqual(['Ankanrinta FLOW', 'Uuniperuna L,G', 'Vihreä powersmoothie M,G']);
    expect(screen.queryByText('Type to search ingredients')).not.toBeInTheDocument();
    expect(screen.queryByText('Select ingredient…', { selector: '[role="presentation"]' })).not.toBeInTheDocument();
  });

  it('filters the already-visible list when typing, then restores it when cleared', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByTestId('kitchen-day-recipe-select');
    await user.click(input);
    await user.type(input, 'peruna');
    expect(optionNames()).toEqual(['Uuniperuna L,G']);
    await user.clear(input);
    expect(optionNames()).toEqual(['Ankanrinta FLOW', 'Uuniperuna L,G', 'Vihreä powersmoothie M,G']);
  });

  it('filters by substring anywhere in the name', () => {
    expect(filterRecipeOptions(options, 'FLOW').map((item) => item.id)).toEqual(['1']);
    expect(filterRecipeOptions(options, 'peruna').map((item) => item.id)).toEqual(['2']);
    expect(filterRecipeOptions(options, '').map((item) => item.id)).toEqual(['1', '2', '3']);
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
