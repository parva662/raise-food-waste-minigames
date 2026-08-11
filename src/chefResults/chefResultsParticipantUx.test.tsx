// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FixtureCurrentUserSelector } from './components/participant/FixtureCurrentUserSelector';
import * as currentUserContext from './currentUserContext';

describe('FixtureCurrentUserSelector', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when development fixture tools are disabled', () => {
    vi.spyOn(currentUserContext, 'isDevFixtureToolsEnabled').mockReturnValue(false);
    const { container } = render(<FixtureCurrentUserSelector />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('fixture-current-user-selector')).not.toBeInTheDocument();
  });
});
