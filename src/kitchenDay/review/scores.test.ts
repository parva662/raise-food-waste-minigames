import { describe, expect, it } from 'vitest';
import { parseKitchenDayReviewScore } from './scores';

describe('Kitchen Day chef review scores', () => {
  it.each([0, 1, 2, 3, 4, 5])('accepts score %s', (score) => {
    expect(parseKitchenDayReviewScore(String(score))).toEqual({ ok: true, value: score });
  });

  it('treats a blank score as unanswered, not zero', () => {
    expect(parseKitchenDayReviewScore('')).toEqual({ ok: false, reason: 'blank' });
    expect(parseKitchenDayReviewScore('0')).toEqual({ ok: true, value: 0 });
  });

  it('rejects out-of-range and non-integer scores', () => {
    expect(parseKitchenDayReviewScore('6')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseKitchenDayReviewScore('-1')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseKitchenDayReviewScore('2.5')).toEqual({ ok: false, reason: 'invalid' });
  });
});
