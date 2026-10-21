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

  it('defaults to kg and keeps the typed number when switching units', async () => {
    const user = userEvent.setup();
    render(<Probe />);
    expect(screen.getByTestId('mass-unit-kg')).toHaveAttribute('aria-pressed', 'true');
    await user.type(screen.getByTestId('mass'), '1.25');
    expect(screen.getByTestId('mass')).toHaveValue('1.25');
    expect(screen.getByTestId('grams')).toHaveTextContent('1250');
    await user.click(screen.getByTestId('mass-unit-g'));
    expect(screen.getByTestId('mass')).toHaveValue('1.25');
    expect(screen.getByTestId('grams')).toHaveTextContent('1.25');
    await user.click(screen.getByTestId('mass-unit-kg'));
    expect(screen.getByTestId('mass')).toHaveValue('1.25');
    expect(screen.getByTestId('grams')).toHaveTextContent('1250');
  });

  it('lets the student select g and enter a gram amount', async () => {
    const user = userEvent.setup();
    render(<Probe />);
    await user.click(screen.getByTestId('mass-unit-g'));
    await user.type(screen.getByTestId('mass'), '500');
    expect(screen.getByTestId('mass')).toHaveValue('500');
    expect(screen.getByTestId('grams')).toHaveTextContent('500');
  });

  it('strips a minus sign instead of storing a negative mass', async () => {
    const user = userEvent.setup();
    render(<Probe />);
    await user.click(screen.getByTestId('mass-unit-g'));
    await user.type(screen.getByTestId('mass'), '-100');
    expect(screen.getByTestId('mass')).toHaveValue('100');
    expect(screen.getByTestId('grams')).toHaveTextContent('100');
  });
});
