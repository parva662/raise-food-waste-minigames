import { describe, expect, it } from 'vitest';
import { parseKitchenSkillsReviewScore } from '@/products/kitchen-skills-challenge/domain/assessment/scores';

describe('Kitchen Day chef review scores', () => {
  it.each([0, 1, 2, 3, 4, 5])('accepts score %s', (score) => {
    expect(parseKitchenSkillsReviewScore(String(score))).toEqual({ ok: true, value: score });
  });

  it('treats a blank score as unanswered, not zero', () => {
    expect(parseKitchenSkillsReviewScore('')).toEqual({ ok: false, reason: 'blank' });
    expect(parseKitchenSkillsReviewScore('0')).toEqual({ ok: true, value: 0 });
  });

  it('rejects out-of-range and non-integer scores', () => {
    expect(parseKitchenSkillsReviewScore('6')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseKitchenSkillsReviewScore('-1')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseKitchenSkillsReviewScore('2.5')).toEqual({ ok: false, reason: 'invalid' });
  });
});
