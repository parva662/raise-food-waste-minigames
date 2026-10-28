// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { StudentJourneyApp } from '@/products/student-journey/StudentJourneyApp';

afterEach(() => {
  cleanup();
});

describe('My Food Journey UX', () => {
  it('shows overview participation from standalone fixtures', () => {
    render(<StudentJourneyApp />);
    expect(screen.getByRole('heading', { name: 'My Food Journey' })).toBeInTheDocument();
    expect(screen.getByTestId('journey-declaration-count')).toHaveTextContent('3');
    expect(screen.getByTestId('journey-service-date-count')).toHaveTextContent('3');
    expect(screen.getByTestId('journey-streak-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('journey-badges-unavailable')).toBeInTheDocument();
  });

  it('lists personal history including no lunch on My Progress', async () => {
    const user = userEvent.setup();
    render(<StudentJourneyApp />);
    await user.click(screen.getByRole('tab', { name: 'My Progress' }));
    expect(screen.getByTestId('journey-history-list').textContent).toMatch(/No lunch/i);
    expect(screen.getByTestId('journey-history-list').textContent).toMatch(/Soup \+ Dessert package/i);
    expect(screen.getByTestId('journey-measurements-unavailable')).toBeInTheDocument();
  });
});
