import { describe, expect, it } from 'vitest';
import {
  hasAnyUnsavedReviewDraft,
  isReviewDraftDirty,
  reviewDraftStorageKey,
} from '@/products/kitchen-skills-challenge/surfaces/trainer/reviewDrafts';

describe('tutor review drafts', () => {
  it('scopes draft keys by actor, session, recipe, and module', () => {
    expect(reviewDraftStorageKey('a1', 's1', 'r1', 'portionPrecision')).toBe(
      'a1::s1::r1::portionPrecision',
    );
    expect(reviewDraftStorageKey('a1', 's1', 'r1', 'trimSmart')).not.toBe(
      reviewDraftStorageKey('a1', 's1', 'r1', 'portionPrecision'),
    );
  });

  it('detects unsaved drafts across inactive modules', () => {
    expect(isReviewDraftDirty({ timeScore: '', qualityScore: '', feedback: '' })).toBe(false);
    expect(isReviewDraftDirty({ timeScore: '3', qualityScore: '', feedback: '' })).toBe(true);
    expect(
      hasAnyUnsavedReviewDraft({
        'a1::s1::r1::portionPrecision': { timeScore: '', qualityScore: '', feedback: '' },
        'a1::s1::r2::trimSmart': { timeScore: '2', qualityScore: '4', feedback: '' },
      }),
    ).toBe(true);
  });
});
