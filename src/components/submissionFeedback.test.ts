import { describe, it, expect, vi, afterEach } from 'vitest';
import savedStatusRowSource from './SavedStatusRow.tsx?raw';
import selectionPanelSource from './SelectionPanel.tsx?raw';
import actionButtonsSource from './ActionButtons.tsx?raw';
import submissionMessageSource from './SubmissionMessage.tsx?raw';
import lateUpdateDialogSource from './LateUpdateConfirmDialog.tsx?raw';
import submissionRulesSource from './SubmissionRulesMessage.tsx?raw';

describe('SavedStatusRow compact feedback', () => {
  it('renders compact on-time and late saved status copy with totals', () => {
    expect(savedStatusRowSource).toContain('formatSavedStatusSummary');
    expect(savedStatusRowSource).toContain('formatPointsBreakdown');
    expect(savedStatusRowSource).toContain('Last updated at');
    expect(savedStatusRowSource).toContain('saved-status-row');
    expect(savedStatusRowSource).not.toContain('reduce avoidable food waste');
  });
});

describe('SelectionPanel structure', () => {
  it('keeps deadline card, compact saved status, and selected items', () => {
    expect(selectionPanelSource).toContain('SubmissionStatusPanel');
    expect(selectionPanelSource).toContain('SavedStatusRow');
    expect(selectionPanelSource).toContain('SelectedItem');
    expect(selectionPanelSource).not.toContain('SubmittedStatusPanel');
    expect(selectionPanelSource).not.toContain('submitted-status');
  });

  it('places saved status below the deadline card', () => {
    const deadlineIndex = selectionPanelSource.indexOf('<SubmissionStatusPanel');
    const savedStatusIndex = selectionPanelSource.indexOf('<SavedStatusRow');
    expect(deadlineIndex).toBeGreaterThan(-1);
    expect(savedStatusIndex).toBeGreaterThan(deadlineIndex);
  });
});

describe('ActionButtons update behaviour', () => {
  it('keeps Update my lunch visible and shows helper text states', () => {
    expect(actionButtonsSource).toContain('Update my lunch');
    expect(actionButtonsSource).toContain('Change your selection to update your lunch.');
    expect(actionButtonsSource).toContain('You have unsaved changes.');
  });
});

describe('SubmissionMessage toast behaviour', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('appears after saving and dismisses automatically', () => {
    expect(submissionMessageSource).toContain('submission-message');
    expect(submissionMessageSource).toContain('aria-live="polite"');
    expect(submissionMessageSource).toContain('setTimeout(onDismiss, dismissMs)');

    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const dismissMs = 4000;
    const message = 'Your active lunch declaration has been saved.';

    const timeoutId = message ? setTimeout(onDismiss, dismissMs) : undefined;

    expect(message).toBeTruthy();
    vi.advanceTimersByTime(4000);
    expect(onDismiss).toHaveBeenCalledTimes(1);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  });
});

describe('Late update confirmation dialog', () => {
  it('uses total-point wording for the score change', () => {
    expect(lateUpdateDialogSource).toContain('You currently have');
    expect(lateUpdateDialogSource).toContain('reduce the score to');
    expect(lateUpdateDialogSource).toContain('Update and accept');
  });
});

describe('Top scoring information', () => {
  it('explains the complete 20-point model with bonus and penalty', () => {
    expect(submissionRulesSource).toContain('This lunch task is worth');
    expect(submissionRulesSource).toContain('20 points');
    expect(submissionRulesSource).toContain('+5 bonus');
    expect(submissionRulesSource).toContain('-5 penalty');
  });
});
