import { describe, expect, it } from 'vitest';
import { getDocumentTitleForMode } from '@/app/documentTitle';

describe('document title routing', () => {
  it('maps each app mode to the expected browser title', () => {
    expect(getDocumentTitleForMode('student')).toBe('Student Lunch');
    expect(getDocumentTitleForMode('chef')).toBe('Kitchen Forecast');
    expect(getDocumentTitleForMode('service-closeout')).toBe('Service Closeout');
    expect(getDocumentTitleForMode('chef-results')).toBe('Forecast Results');
    expect(getDocumentTitleForMode('chef-results-admin')).toBe('Kitchen Management Dashboard');
    expect(getDocumentTitleForMode('kitchen-day')).toBe('Kitchen Skills Challenge');
    expect(getDocumentTitleForMode('kitchen-day-progress')).toBe('Kitchen Skills Challenge Progress');
    expect(getDocumentTitleForMode('kitchen-day-tutor')).toBe('Kitchen Skills Challenge Trainer');
  });
});
