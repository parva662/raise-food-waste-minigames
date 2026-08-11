import { SERVICE_CLOSEOUT_CONFIG } from '../config/serviceCloseout';

export type IntegerValidationResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

export const CLOSEOUT_INTEGER_RANGE_ERROR = `Enter a whole number from 0 to ${SERVICE_CLOSEOUT_CONFIG.maxQuantity}.`;

export const CLOSEOUT_WASTE_RANGE_ERROR = `Enter a whole number from 0 to ${SERVICE_CLOSEOUT_CONFIG.maxWasteGrams}.`;

export const CLOSEOUT_OVERPRODUCTION_EXCEEDS_PREPARED_ERROR =
  'Overproduction cannot exceed the total prepared weight.';

export function validateCloseoutQuantity(
  raw: string | number,
  fieldLabel: string,
): IntegerValidationResult {
  return validateNonNegativeInteger(raw, fieldLabel, SERVICE_CLOSEOUT_CONFIG.maxQuantity, CLOSEOUT_INTEGER_RANGE_ERROR);
}

export function validateCloseoutWasteGrams(
  raw: string | number,
  fieldLabel: string,
): IntegerValidationResult {
  return validateNonNegativeInteger(raw, fieldLabel, SERVICE_CLOSEOUT_CONFIG.maxWasteGrams, CLOSEOUT_WASTE_RANGE_ERROR);
}

function validateNonNegativeInteger(
  raw: string | number,
  fieldLabel: string,
  max: number,
  rangeMessage: string,
): IntegerValidationResult {
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) {
    return { ok: false, error: `${fieldLabel} is required.` };
  }

  if (!/^-?\d+$/.test(trimmed)) {
    return { ok: false, error: rangeMessage };
  }

  const value = Number(trimmed);
  if (!Number.isInteger(value)) {
    return { ok: false, error: rangeMessage };
  }

  if (value < 0) {
    return { ok: false, error: rangeMessage };
  }

  if (value > max) {
    return { ok: false, error: rangeMessage };
  }

  return { ok: true, value };
}

export function preparedWeightGrams(preparedQuantity: number, portionWeightGrams: number): number {
  return preparedQuantity * portionWeightGrams;
}

export function validateOverproductionAgainstPrepared(
  preparedQuantity: number,
  portionWeightGrams: number,
  overproductionGrams: number,
): IntegerValidationResult {
  if (preparedQuantity === 0) {
    if (overproductionGrams !== 0) {
      return { ok: false, error: CLOSEOUT_OVERPRODUCTION_EXCEEDS_PREPARED_ERROR };
    }
    return { ok: true, value: 0 };
  }

  const maxWaste = preparedWeightGrams(preparedQuantity, portionWeightGrams);
  if (overproductionGrams > maxWaste) {
    return { ok: false, error: CLOSEOUT_OVERPRODUCTION_EXCEEDS_PREPARED_ERROR };
  }

  return { ok: true, value: overproductionGrams };
}
