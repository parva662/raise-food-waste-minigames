import { CHEF_CONFIG } from '../config/chef';

export type IntegerValidationResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

export const CHEF_INTEGER_RANGE_ERROR = `Enter a whole number from 0 to ${CHEF_CONFIG.maxForecastQuantity}.`;

export function validateChefInteger(
  raw: string | number,
  fieldLabel: string,
): IntegerValidationResult {
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) {
    return { ok: false, error: `${fieldLabel} is required.` };
  }

  if (!/^-?\d+$/.test(trimmed)) {
    return { ok: false, error: CHEF_INTEGER_RANGE_ERROR };
  }

  const value = Number(trimmed);
  if (!Number.isInteger(value)) {
    return { ok: false, error: CHEF_INTEGER_RANGE_ERROR };
  }

  if (value < 0) {
    return { ok: false, error: CHEF_INTEGER_RANGE_ERROR };
  }

  if (value > CHEF_CONFIG.maxForecastQuantity) {
    return { ok: false, error: CHEF_INTEGER_RANGE_ERROR };
  }

  return { ok: true, value };
}

export function clampChefInteger(value: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(value)) return 0;
  return Math.min(Math.max(0, value), CHEF_CONFIG.maxForecastQuantity);
}
