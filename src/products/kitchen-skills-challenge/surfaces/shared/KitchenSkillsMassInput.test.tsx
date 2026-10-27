/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { KitchenSkillsMassInput } from '@/products/kitchen-skills-challenge/surfaces/shared/KitchenSkillsMassInput';

function Probe({ defaultUnit }: { defaultUnit?: 'g' | 'kg' } = {}) {
  const [grams, setGrams] = useState('');
  return (
    <div>
      <KitchenSkillsMassInput
        testId="mass"
        value={grams}
        onChange={setGrams}
        defaultUnit={defaultUnit}
      />
      <span data-testid="grams">{grams}</span>
    </div>
  );
}

describe('KitchenSkillsMassInput', () => {
  afterEach(() => {
    cleanup();
  });

  it('defaults to g and converts the displayed number when switching units', async () => {
    const user = userEvent.setup();
    render(<Probe />);
    expect(screen.getByTestId('mass-unit-g')).toHaveAttribute('aria-pressed', 'true');
    await user.type(screen.getByTestId('mass'), '500');
    expect(screen.getByTestId('mass')).toHaveValue('500');
    expect(screen.getByTestId('grams')).toHaveTextContent('500');
    await user.click(screen.getByTestId('mass-unit-kg'));
    expect(screen.getByTestId('mass')).toHaveValue('0.5');
    expect(screen.getByTestId('grams')).toHaveTextContent('500');
    await user.click(screen.getByTestId('mass-unit-g'));
    expect(screen.getByTestId('mass')).toHaveValue('500');
    expect(screen.getByTestId('grams')).toHaveTextContent('500');
  });

  it('converts 1250 g ↔ 1.25 kg without changing the stored quantity', async () => {
    const user = userEvent.setup();
    render(<Probe />);
    await user.type(screen.getByTestId('mass'), '1250');
    await user.click(screen.getByTestId('mass-unit-kg'));
    expect(screen.getByTestId('mass')).toHaveValue('1.25');
    expect(screen.getByTestId('grams')).toHaveTextContent('1250');
    await user.click(screen.getByTestId('mass-unit-g'));
    expect(screen.getByTestId('mass')).toHaveValue('1250');
    expect(screen.getByTestId('grams')).toHaveTextContent('1250');
  });

  it('preserves empty and zero across unit switches', async () => {
    const user = userEvent.setup();
    render(<Probe />);
    await user.click(screen.getByTestId('mass-unit-kg'));
    expect(screen.getByTestId('mass')).toHaveValue('');
    expect(screen.getByTestId('grams')).toHaveTextContent('');
    await user.type(screen.getByTestId('mass'), '0');
    expect(screen.getByTestId('grams')).toHaveTextContent('0');
    await user.click(screen.getByTestId('mass-unit-g'));
    expect(screen.getByTestId('mass')).toHaveValue('0');
    expect(screen.getByTestId('grams')).toHaveTextContent('0');
  });

  it('lets the student start in kg when requested', async () => {
    const user = userEvent.setup();
    render(<Probe defaultUnit="kg" />);
    expect(screen.getByTestId('mass-unit-kg')).toHaveAttribute('aria-pressed', 'true');
    await user.type(screen.getByTestId('mass'), '1.25');
    expect(screen.getByTestId('grams')).toHaveTextContent('1250');
  });

  it('strips a minus sign instead of storing a negative mass', async () => {
    const user = userEvent.setup();
    render(<Probe />);
    await user.type(screen.getByTestId('mass'), '-100');
    expect(screen.getByTestId('mass')).toHaveValue('100');
    expect(screen.getByTestId('grams')).toHaveTextContent('100');
  });
});
