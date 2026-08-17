import { describe, expect, it } from 'vitest';
import { getDocumentTitleForMode } from './documentTitle';

describe('document title routing', () => {
  it('maps each app mode to the expected browser title', () => {
    expect(getDocumentTitleForMode('student')).toBe("Tomorrow's Lunch");
    expect(getDocumentTitleForMode('chef')).toBe('Kitchen Forecast');
    expect(getDocumentTitleForMode('service-closeout')).toBe('Service Closeout');
    expect(getDocumentTitleForMode('chef-results')).toBe('Chef Results');
    expect(getDocumentTitleForMode('chef-results-admin')).toBe('Chef Results Admin');
  });
});
