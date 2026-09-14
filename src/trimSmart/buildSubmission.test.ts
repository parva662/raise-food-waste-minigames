import { describe, expect, it } from 'vitest';
import { buildTrimSmartSubmission } from './buildSubmission';
import { mapTrimSmart, orderedTrimSmartPropertyRefs } from '../gamebus/mapTrimSmart';

describe('buildTrimSmartSubmission', () => {
  const session = {
    sessionId: 'trim-smart:task-123:2026-09-14',
    sessionDate: '2026-09-14',
  };

  const attempt = {
    ingredientCategory: 'vegetables' as const,
    ingredientName: 'Carrot',
    ingredientWeightGrams: 1000,
  };

  it('uses locked session identity and derives ingredientId', () => {
    const submission = buildTrimSmartSubmission({
      session,
      attempt,
      practice: 'careful_trimming',
      participantWasteGrams: 125,
      submittedAt: '2026-09-14T10:00:00.000Z',
    });
    expect(submission.sessionId).toBe('trim-smart:task-123:2026-09-14');
    expect(submission.sessionDate).toBe('2026-09-14');
    expect(submission.ingredientId).toBe('carrot');
    expect(submission.ingredientName).toBe('Carrot');
  });

  it('maps only canonical GameBus properties', () => {
    const submission = buildTrimSmartSubmission({
      session: {
        sessionId: 'trim-smart:standalone:2026-09-14',
        sessionDate: '2026-09-14',
      },
      attempt,
      practice: 'standard_practice',
      participantWasteGrams: 0,
      submittedAt: '2026-09-14T10:00:00.000Z',
    });
    const values = mapTrimSmart(submission);
    expect(Object.keys(values).sort()).toEqual([...orderedTrimSmartPropertyRefs()].sort());
    expect(values).not.toHaveProperty('participantId');
    expect(values).not.toHaveProperty('chefPerformanceScore');
    expect(values).not.toHaveProperty('sessionCategoryWasteGrams');
  });
});
