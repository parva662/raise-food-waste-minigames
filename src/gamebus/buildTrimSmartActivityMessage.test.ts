import { describe, expect, it } from 'vitest';
import { buildTrimSmartActivityMessage } from './buildTrimSmartActivityMessage';
import { trimSmartTaskFixture } from './trimSmartTaskFixtures';
import type { TrimSmartSubmission } from '../trimSmart/types';

const submission: TrimSmartSubmission = {
  sessionId: 'session-001',
  sessionDate: '2026-09-14',
  ingredientCategory: 'vegetables',
  ingredientId: 'carrot',
  ingredientName: 'Carrot',
  ingredientWeightGrams: 1000,
  participantWasteGrams: 0,
  practice: 'standard_practice',
  submittedAt: '2026-09-14T12:30:00.000Z',
};

describe('buildTrimSmartActivityMessage', () => {
  it('builds trimSmart ACTIVITY with canonical properties', () => {
    const message = buildTrimSmartActivityMessage(trimSmartTaskFixture, submission);
    expect(message.type).toBe('ACTIVITY');
    expect(message.data.template).toBe('trimSmart');
    expect(message.data.properties.map((property) => property.template)).toEqual([
      'sessionId',
      'sessionDate',
      'ingredientCategory',
      'ingredientId',
      'ingredientName',
      'ingredientWeightGrams',
      'participantWasteGrams',
      'practice',
      'submittedAt',
    ]);
    expect(message.data.properties.find((p) => p.template === 'participantWasteGrams')?.obj).toEqual({
      value: 0,
    });
    expect(message.data.properties.find((p) => p.template === 'submittedAt')?.obj.value).toBe(
      submission.submittedAt,
    );
  });

  it('blocks submission when required linked property is missing', () => {
    const brokenTask = {
      ...trimSmartTaskFixture,
      activityTemplates: [
        {
          ...trimSmartTaskFixture.activityTemplates[0]!,
          linkedProperties: trimSmartTaskFixture.activityTemplates[0]!.linkedProperties!.filter(
            (property) => property.ref !== 'practice',
          ),
        },
      ],
    };
    expect(() => buildTrimSmartActivityMessage(brokenTask, submission)).toThrow(
      /missing linked property refs: practice/,
    );
  });

  it('reports unsupported required chefPerformanceScore as template mismatch', () => {
    const mismatchTask = {
      ...trimSmartTaskFixture,
      activityTemplates: [
        {
          ...trimSmartTaskFixture.activityTemplates[0]!,
          linkedProperties: [
            ...(trimSmartTaskFixture.activityTemplates[0]!.linkedProperties ?? []),
            { order: 99, name: 'chefPerformanceScore', required: true, ref: 'chefPerformanceScore' },
          ],
        },
      ],
    };
    expect(() => buildTrimSmartActivityMessage(mismatchTask, submission)).toThrow(
      /chefPerformanceScore/,
    );
  });
});
