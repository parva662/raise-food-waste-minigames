import { describe, expect, it } from 'vitest';
import {
  buildKitchenSkillsTrainerInputDebugInfo,
  describeTrainerInputShape,
  isKitchenSkillsTrainerGameBusDebugMode,
} from '@/products/kitchen-skills-challenge/read/trainerInputDebug';

const sessionId = 'kitchen-day:t:user-1:2026-09-23';

function trimActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'trim-1',
    actor: { id: 'user-1', name: 'Student One' },
    template: { slug: 'trimSmart' },
    start: '2026-09-23T10:00:00.000Z',
    end: '2026-09-23T10:03:00.000Z',
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionId } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:03:00.000Z' } },
      { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
      { template: { slug: 'ingredientName' }, value: { value: 'Carrot' } },
      { template: { slug: 'ingredientCategory' }, value: { value: 'root' } },
      { template: { slug: 'ingredientWeightGrams' }, value: { value: 5000 } },
      { template: { slug: 'trimTechniques' }, value: { value: 'trimming' } },
      { template: { slug: 'estimatedWasteGrams' }, value: { value: 600 } },
      { template: { slug: 'actualWasteGrams' }, value: { value: 450 } },
      { template: { slug: 'duration' }, obj: { value: 3, unit: 'minutes' } },
    ],
    ...overrides,
  };
}

describe('Kitchen Skills trainer input debug', () => {
  it('enables debug only on the tutor hash with gamebusDebug=1', () => {
    expect(isKitchenSkillsTrainerGameBusDebugMode('#/kitchen-day-tutor?gamebusDebug=1')).toBe(true);
    expect(isKitchenSkillsTrainerGameBusDebugMode('#/kitchen-day-tutor?sessionId=abc&gamebusDebug=1')).toBe(true);
    expect(isKitchenSkillsTrainerGameBusDebugMode('#/kitchen-day-tutor', '?gamebusDebug=1')).toBe(true);
    expect(isKitchenSkillsTrainerGameBusDebugMode('#/kitchen-day-tutor')).toBe(false);
    expect(isKitchenSkillsTrainerGameBusDebugMode('#/chef-results?gamebusDebug=1')).toBe(false);
  });

  it('reports a missing kitchenSkillsTrainerInput collection', () => {
    const info = buildKitchenSkillsTrainerInputDebugInfo({
      inputCollectionPari: { me: { id: 'user-1' } },
    });
    expect(info.collectionKeys).toEqual(['inputCollectionPari']);
    expect(info.kitchenSkillsTrainerInputShape).toBe('undefined');
    expect(info.kitchenSkillsTrainerActivitiesShape).toBe('undefined');
    expect(info.activityCount).toBe(0);
    expect(info.trainerSessionCount).toBe(0);
  });

  it('reports an attached empty activities array', () => {
    const info = buildKitchenSkillsTrainerInputDebugInfo({
      kitchenSkillsTrainerInput: { activities: [] },
    });
    expect(info.kitchenSkillsTrainerInputKeys).toEqual(['activities']);
    expect(info.kitchenSkillsTrainerInputShape).toBe('object');
    expect(info.kitchenSkillsTrainerActivitiesShape).toBe('array');
    expect(info.activityCount).toBe(0);
    expect(info.templateCounts).toEqual({});
    expect(info.kitchenSkillsActivityActors).toEqual([]);
    expect(info.parsedTrimCount).toBe(0);
    expect(info.parsedRescueCount).toBe(0);
    expect(info.parsedPortionCount).toBe(0);
    expect(info.parsedReviewCount).toBe(0);
    expect(info.trainerSessionCount).toBe(0);
  });

  it('reveals a docs envelope on the collection when activities is missing', () => {
    const info = buildKitchenSkillsTrainerInputDebugInfo({
      kitchenSkillsTrainerInput: { docs: [trimActivity()], totalDocs: 1 },
    });
    expect(info.kitchenSkillsTrainerInputKeys).toEqual(['docs', 'totalDocs']);
    expect(info.kitchenSkillsTrainerInputShape).toBe('docs-envelope');
    expect(info.kitchenSkillsTrainerActivitiesShape).toBe('undefined');
    expect(info.activityCount).toBe(0);
    expect(info.trainerSessionCount).toBe(0);
    expect(info.kitchenSkillsTrainerInputPreview).toMatchObject({
      _shape: 'docs-envelope',
      _keys: ['docs', 'totalDocs'],
    });
  });

  it('extracts a docs envelope under activities', () => {
    const info = buildKitchenSkillsTrainerInputDebugInfo({
      kitchenSkillsTrainerInput: { activities: { docs: [trimActivity()], totalDocs: 1 } },
    });
    expect(describeTrainerInputShape({ docs: [] })).toBe('docs-envelope');
    expect(info.kitchenSkillsTrainerActivitiesShape).toBe('docs-envelope');
    expect(info.activityCount).toBe(1);
    expect(info.parsedTrimCount).toBe(1);
    expect(info.kitchenSkillsActivityActors).toEqual([
      { template: 'trimSmart', actorId: 'user-1', actorName: 'Student One' },
    ]);
    expect(info.trainerSessionCount).toBe(1);
  });

  it('counts parsed templates, missing actors, and trainer sessions', () => {
    const info = buildKitchenSkillsTrainerInputDebugInfo({
      kitchenSkillsTrainerInput: {
        activities: [
          trimActivity(),
          { ...trimActivity({ id: 'trim-no-actor' }), actor: undefined },
          {
            id: 'review-1',
            actor: { id: 'tutor-1', name: 'Tutor' },
            template: { slug: 'wastePracticeReview' },
            properties: [
              { template: { slug: 'sessionId' }, value: { value: sessionId } },
              { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
              { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T11:00:00.000Z' } },
              { template: { slug: 'timeEfficiencyScore' }, value: { value: 4 } },
              { template: { slug: 'preparationQualityScore' }, value: { value: 5 } },
              { template: { slug: 'chefFeedback' }, value: { value: 'Good work' } },
            ],
          },
        ],
      },
    });
    expect(info.activityCount).toBe(3);
    expect(info.templateCounts).toEqual({ trimSmart: 2, wastePracticeReview: 1 });
    expect(info.parsedTrimCount).toBe(2);
    expect(info.parsedRescueCount).toBe(0);
    expect(info.parsedPortionCount).toBe(0);
    expect(info.parsedReviewCount).toBe(1);
    expect(info.parsedEvidenceMissingActorCount).toBe(1);
    expect(info.trainerSessionCount).toBe(1);
    expect(info.kitchenSkillsActivityActors).toEqual([
      { template: 'trimSmart', actorId: 'user-1', actorName: 'Student One' },
      { template: 'trimSmart', actorId: null, actorName: null },
      { template: 'wastePracticeReview', actorId: 'tutor-1', actorName: 'Tutor' },
    ]);
  });
});
