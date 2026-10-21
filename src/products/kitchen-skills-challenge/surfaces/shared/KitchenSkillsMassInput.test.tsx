/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { KitchenSkillsMassInput } from '@/products/kitchen-skills-challenge/surfaces/shared/KitchenSkillsMassInput';

function Probe() {
  const [grams, setGrams] = useState('');
  return (
    <div>
      <KitchenSkillsMassInput testId="mass" value={grams} onChange={setGrams} />
      <span data-testid="grams">{grams}</span>
    </div>
  );
}

describe('KitchenSkillsMassInput', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps the typed number when switching g/kg and reinterprets it', async () => {
    const user = userEvent.setup();
    render(<Probe />);
    await user.type(screen.getByTestId('mass'), '1.25');
    expect(screen.getByTestId('grams')).toHaveTextContent('1.25');
    await user.click(screen.getByTestId('mass-unit-kg'));
    expect(screen.getByTestId('mass')).toHaveValue('1.25');
    expect(screen.getByTestId('grams')).toHaveTextContent('1250');
    await user.click(screen.getByTestId('mass-unit-g'));
    expect(screen.getByTestId('mass')).toHaveValue('1.25');
    expect(screen.getByTestId('grams')).toHaveTextContent('1.25');
  });

  it('strips a minus sign instead of storing a negative mass', async () => {
    const user = userEvent.setup();
    render(<Probe />);
    await user.type(screen.getByTestId('mass'), '-100');
    expect(screen.getByTestId('mass')).toHaveValue('100');
    expect(screen.getByTestId('grams')).toHaveTextContent('100');
  });
});
