import { wastePercentage } from './derived';
import { getSeededReferencePercent } from './seededReference';

export type TrimReferenceSource = 'historical' | 'seed';

export interface TrimReferenceComparison {
  ingredientId: string;
  studentWastePercent: number;
  referenceWastePercent: number;
  source: TrimReferenceSource;
  performedBetterThanReference: boolean;
  percentileCopy: null;
}

export interface HistoricalTrimSample {
  ingredientId: string;
  ingredientWeightGrams: number;
  actualWasteGrams: number;
}

export function averageHistoricalWastePercent(
  samples: readonly HistoricalTrimSample[],
  ingredientId: string,
): number | null {
  const matching = samples.filter((sample) => sample.ingredientId === ingredientId);
  if (matching.length === 0) return null;
  const total = matching.reduce(
    (sum, sample) => sum + wastePercentage(sample.actualWasteGrams, sample.ingredientWeightGrams),
    0,
  );
  return total / matching.length;
}

export function compareToKitchenReference(options: {
  ingredientId: string;
  studentWastePercent: number;
  historicalSamples: readonly HistoricalTrimSample[];
}): TrimReferenceComparison | null {
  const historical = averageHistoricalWastePercent(options.historicalSamples, options.ingredientId);
  const seeded = getSeededReferencePercent(options.ingredientId);
  const referenceWastePercent = historical ?? seeded;
  if (referenceWastePercent == null) return null;

  return {
    ingredientId: options.ingredientId,
    studentWastePercent: options.studentWastePercent,
    referenceWastePercent,
    source: historical != null ? 'historical' : 'seed',
    performedBetterThanReference: options.studentWastePercent < referenceWastePercent,
    percentileCopy: null,
  };
}
