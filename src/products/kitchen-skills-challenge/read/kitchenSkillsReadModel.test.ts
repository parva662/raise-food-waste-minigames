import { describe, expect, it } from 'vitest';
import {
  buildKitchenSkillsReadModel,
  mergeKitchenSkillsRecords,
  parsePersistedPortionEntry,
  parsePersistedRescueEntry,
  parsePersistedTrimEntry,
} from '@/products/kitchen-skills-challenge/read/kitchenSkillsReadModel';

const sessionId = 'kitchen-day:task-1:user-1:2026-09-23';

function trimActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'act-trim-1',
    start: '2026-09-23T10:00:00.000Z',
    end: '2026-09-23T10:03:00.000Z',
    actor: { id: 'user-1', name: 'Student' },
    template: { slug: 'trimSmart' },
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionId } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:03:00.000Z' } },
      { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
      { template: { slug: 'ingredientName' }, value: { value: 'Carrot' } },
      { template: { slug: 'ingredientWeightGrams' }, value: { value: 5000 } },
      { template: { slug: 'trimTechniques' }, value: { value: 'trimming' } },
      { template: { slug: 'estimatedWasteGrams' }, value: { value: 600 } },
      { template: { slug: 'actualWasteGrams' }, value: { value: 450 } },
      { template: { slug: 'duration' }, obj: { value: 3, unit: 'minutes' } },
    ],
    ...overrides,
  };
}

describe('Kitchen Day read model', () => {
  it('parses target Trim / Rescue / Portion properties', () => {
    expect(parsePersistedTrimEntry(trimActivity())?.ingredientId).toBe('carrot');
    expect(
      parsePersistedRescueEntry({
        id: 'act-rescue-1',
        actor: { id: 'user-1' },
        template: { slug: 'rescueAndReuse' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: sessionId } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
          { template: { slug: 'reusableWasteGrams' }, value: { value: 200 } },
          { template: { slug: 'reuseDestination' }, value: { value: 'Soup' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:10:00.000Z' } },
        ],
      })?.reuseDestination,
    ).toBe('Soup');
    expect(
      parsePersistedPortionEntry({
        id: 'act-portion-1',
        actor: { id: 'user-1' },
        template: { slug: 'portionPrecision' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: sessionId } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T11:00:00.000Z' } },
          { template: { slug: 'recipeId' }, value: { value: 'mayonnaise' } },
          { template: { slug: 'recipeName' }, value: { value: 'Mayonnaise' } },
          { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 1850 } },
          {
            template: { slug: 'recipeComposition' },
            value: {
              value: [
                { ingredientId: 'yogurt', ingredientName: 'Yogurt', actualAmount: 1000, unit: 'g' },
              ],
            },
          },
        ],
      })?.recipeId,
    ).toBe('mayonnaise');
  });

  it('hydrates a live GameBus Portion activity when recipeId is numeric and recipeComposition is absent', () => {
    const entry = parsePersistedPortionEntry({
      id: 'act-portion-live',
      template: { slug: 'portionPrecision', name: 'Portion Precision' },
      properties: [
        {
          template: { slug: 'sessionId' },
          value: { value: 'kitchen-day:01e0e772-76e6-791e-078e-be4009eab14f:019ff626-7720-7e60-8547-da4ab1243c79:2026-09-30' },
        },
        { template: { slug: 'sessionDate' }, value: { value: '2026-09-30' } },
        { template: { slug: 'submittedAt' }, value: { value: '2026-09-30T09:43:56.955Z' } },
        { template: { slug: 'recipeId' }, value: { value: 143 } },
        { template: { slug: 'recipeName' }, value: { value: 'Pottuvoi FLOW SYKSY - KOPIO' } },
        { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 3200 } },
      ],
    });
    expect(entry?.recipeId).toBe('143');
    expect(entry?.recipeName).toBe('Pottuvoi FLOW SYKSY - KOPIO');
    expect(entry?.finalRecipeWeightGrams).toBe(3200);
    expect(entry?.recipeComposition).toEqual([]);
  });

  it('ignores malformed, historical v1, and unrelated activities', () => {
    expect(parsePersistedTrimEntry({ template: { slug: 'chefForecast' } })).toBeNull();
    expect(
      parsePersistedTrimEntry({
        template: { slug: 'trimSmart' },
        properties: [
          { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
          { template: { slug: 'practice' }, value: { value: 'careful_trimming' } },
        ],
      }),
    ).toBeNull();
    const model = buildKitchenSkillsReadModel(
      [trimActivity(), { template: { slug: 'trimSmart' }, properties: [] }, trimActivity({ actor: { id: 'user-2' } })],
      { sessionId, actorId: 'user-1' },
    );
    expect(model.trimEntries).toHaveLength(1);
  });

  it('accepts a matching actor when participant-scoped reading requests actorId', () => {
    const model = buildKitchenSkillsReadModel([trimActivity()], { sessionId, actorId: 'user-1' });
    expect(model.trimEntries).toHaveLength(1);
  });

  it('rejects another actor when participant-scoped reading requests actorId', () => {
    const model = buildKitchenSkillsReadModel([trimActivity({ actor: { id: 'user-2', name: 'Other' } })], {
      sessionId,
      actorId: 'user-1',
    });
    expect(model.trimEntries).toHaveLength(0);
  });

  it('rejects a missing actor when participant-scoped reading requests actorId', () => {
    const model = buildKitchenSkillsReadModel([trimActivity({ actor: undefined })], {
      sessionId,
      actorId: 'user-1',
    });
    expect(model.trimEntries).toHaveLength(0);
  });

  it('rejects a malformed actor when participant-scoped reading requests actorId', () => {
    const model = buildKitchenSkillsReadModel([trimActivity({ actor: { name: 'Student' } })], {
      sessionId,
      actorId: 'user-1',
    });
    expect(model.trimEntries).toHaveLength(0);
  });

  it('deduplicates local copies once the persisted record exists', () => {
    const persisted = [parsePersistedTrimEntry(trimActivity())!];
    const local = [{ ...persisted[0]!, source: 'local' as const, persistId: undefined }];
    const merged = mergeKitchenSkillsRecords(local, persisted, (left, right) => left.ingredientId === right.ingredientId);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.source).toBe('persisted');
  });

  it('parses persisted Trim when ingredientCategory is absent', () => {
    const parsed = parsePersistedTrimEntry(trimActivity());
    expect(parsed?.ingredientId).toBe('carrot');
    expect(parsed).not.toHaveProperty('ingredientCategory');
  });

  it('parses persisted Trim when an obsolete ingredientCategory property is present', () => {
    const parsed = parsePersistedTrimEntry(
      trimActivity({
        properties: [
          ...(trimActivity().properties as object[]),
          { template: { slug: 'ingredientCategory' }, value: { value: 'root' } },
        ],
      }),
    );
    expect(parsed?.ingredientId).toBe('carrot');
    expect(parsed).not.toHaveProperty('ingredientCategory');
  });

  it('hydrates Trim for Rescue join without a category field', () => {
    const model = buildKitchenSkillsReadModel(
      [
        trimActivity(),
        {
          id: 'act-rescue-1',
          actor: { id: 'user-1' },
          template: { slug: 'rescueAndReuse' },
          properties: [
            { template: { slug: 'sessionId' }, value: { value: sessionId } },
            { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
            { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
            { template: { slug: 'reusableWasteGrams' }, value: { value: 200 } },
            { template: { slug: 'reuseDestination' }, value: { value: 'Soup' } },
            { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:10:00.000Z' } },
          ],
        },
      ],
      { sessionId, actorId: 'user-1' },
    );
    expect(model.trimEntries).toHaveLength(1);
    expect(model.rescueEntries).toHaveLength(1);
    expect(model.rescueEntries[0]?.ingredientId).toBe(model.trimEntries[0]?.ingredientId);
  });

  it('hydrates persisted Trim for Rescue without actor equality filtering', () => {
    const model = buildKitchenSkillsReadModel(
      [
        trimActivity({ actor: { id: 'other-actor', name: 'Other' } }),
        {
          id: 'act-rescue-1',
          actor: { id: 'other-actor' },
          template: { slug: 'rescueAndReuse' },
          properties: [
            { template: { slug: 'sessionId' }, value: { value: sessionId } },
            { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
            { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
            { template: { slug: 'reusableWasteGrams' }, value: { value: 200 } },
            { template: { slug: 'reuseDestination' }, value: { value: 'Soup' } },
            { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:10:00.000Z' } },
          ],
        },
      ],
      { sessionId },
    );
    expect(model.trimEntries).toHaveLength(1);
    expect(model.rescueEntries).toHaveLength(1);
    expect(model.rescueEntries[0]?.ingredientId).toBe(model.trimEntries[0]?.ingredientId);
  });
});
