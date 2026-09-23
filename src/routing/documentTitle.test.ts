import { describe, expect, it } from 'vitest';
import { getDocumentTitleForMode } from './documentTitle';

describe('document title routing', () => {
  it('maps each app mode to the expected browser title', () => {
    expect(getDocumentTitleForMode('student')).toBe('Student Lunch');
    expect(getDocumentTitleForMode('chef')).toBe('Kitchen Forecast');
    expect(getDocumentTitleForMode('service-closeout')).toBe('Service Closeout');
    expect(getDocumentTitleForMode('chef-results')).toBe('Chef Results');
    expect(getDocumentTitleForMode('chef-results-admin')).toBe('Kitchen Management Dashboard');
    expect(getDocumentTitleForMode('kitchen-day')).toBe('Kitchen Day');
    expect(getDocumentTitleForMode('kitchen-day-progress')).toBe('Kitchen Day Progress');
    expect(getDocumentTitleForMode('kitchen-day-tutor')).toBe('Kitchen Day Tutor');
  });
});
