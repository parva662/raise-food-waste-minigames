import { describe, expect, it } from 'vitest';
import {
  hasAnyUnsavedReviewDraft,
  isReviewDraftDirty,
  reviewDraftStorageKey,
} from '@/products/kitchen-skills-challenge/surfaces/trainer/reviewDrafts';

describe('tutor review drafts', () => {
  it('scopes draft keys by actor and session', () => {
    expect(reviewDraftStorageKey('a1', 's1')).toBe('a1::s1::session');
    expect(reviewDraftStorageKey('a1', 's1')).not.toBe(reviewDraftStorageKey('a1', 's2'));
  });

  it('detects unsaved drafts across sessions', () => {
    expect(isReviewDraftDirty({ timeScore: '', qualityScore: '', feedback: '' })).toBe(false);
    expect(isReviewDraftDirty({ timeScore: '3', qualityScore: '', feedback: '' })).toBe(true);
    expect(
      hasAnyUnsavedReviewDraft({
        'a1::s1::session': { timeScore: '', qualityScore: '', feedback: '' },
        'a1::s2::session': { timeScore: '2', qualityScore: '4', feedback: '' },
      }),
    ).toBe(true);
  });
});
