import { describe, it, expect } from 'vitest';
import {
  CHEF_CONFIDENCE_OPTIONS,
  parseChefConfidence,
  hasChefConfidenceAnswer,
  hasChefNotesAnswer,
  trimChefNotes,
  CONFIDENCE_MIN,
  CONFIDENCE_MAX,
} from './optionalFields';

describe('optionalFields', () => {
  describe('CHEF_CONFIDENCE_OPTIONS', () => {
    it('maps five labels to schema values', () => {
      expect(CHEF_CONFIDENCE_OPTIONS).toEqual([
        { label: 'Very low', value: 0 },
        { label: 'Low', value: 0.25 },
        { label: 'Moderate', value: 0.5 },
        { label: 'High', value: 0.75 },
        { label: 'Very high', value: 1 },
      ]);
    });
  });

  describe('parseChefConfidence', () => {
    it('returns null for empty input', () => {
      expect(parseChefConfidence('')).toEqual({ ok: true, value: null });
      expect(parseChefConfidence('   ')).toEqual({ ok: true, value: null });
    });

    it('accepts values within schema range', () => {
      expect(parseChefConfidence('0')).toEqual({ ok: true, value: 0 });
      expect(parseChefConfidence('0.75')).toEqual({ ok: true, value: 0.75 });
      expect(parseChefConfidence('1')).toEqual({ ok: true, value: 1 });
    });

    it('rejects values outside schema range', () => {
      expect(parseChefConfidence('-0.1').ok).toBe(false);
      expect(parseChefConfidence('1.01').ok).toBe(false);
    });

    it('rejects non-numeric input', () => {
      expect(parseChefConfidence('high').ok).toBe(false);
    });
  });

  describe('hasChefConfidenceAnswer', () => {
    it('is false when unanswered', () => {
      expect(hasChefConfidenceAnswer(null)).toBe(false);
    });

    it('is true when a number was entered (including zero)', () => {
      expect(hasChefConfidenceAnswer(0)).toBe(true);
      expect(hasChefConfidenceAnswer(0.5)).toBe(true);
    });
  });

  describe('hasChefNotesAnswer', () => {
    it('is false for empty or whitespace-only notes', () => {
      expect(hasChefNotesAnswer('')).toBe(false);
      expect(hasChefNotesAnswer('   ')).toBe(false);
    });

    it('is true for non-empty trimmed text', () => {
      expect(hasChefNotesAnswer('Staff shortage')).toBe(true);
    });
  });

  describe('trimChefNotes', () => {
    it('trims surrounding whitespace', () => {
      expect(trimChefNotes('  event day  ')).toBe('event day');
    });
  });

  it('uses export schema bounds', () => {
    expect(CONFIDENCE_MIN).toBe(0);
    expect(CONFIDENCE_MAX).toBe(1);
  });
});
