import { TRIM_TECHNIQUES, type TrimTechnique } from '../types';

export const TRIM_TECHNIQUE_LABELS: Record<TrimTechnique, string> = {
  peeling: 'Peeling',
  trimming: 'Trimming',
  julienne: 'Julienne',
  batonnet: 'Batonnet',
  mince: 'Mince',
  dice: 'Dice',
  brunoise: 'Brunoise',
  slice: 'Slice',
  chiffonade: 'Chiffonade',
  other: 'Other',
};

export function isTrimTechnique(value: string): value is TrimTechnique {
  return (TRIM_TECHNIQUES as readonly string[]).includes(value);
}
