import { describe, it, expect } from 'vitest';
import selectionPanelSource from './SelectionPanel.tsx?raw';

describe('SelectionPanel submission feedback structure', () => {
  it('keeps one compact saved status row and no large submitted panel', () => {
    expect(selectionPanelSource).toContain('SavedStatusRow');
    expect(selectionPanelSource).not.toContain('SubmittedStatusPanel');
    expect(selectionPanelSource).not.toContain('submitted-status');
  });
});
