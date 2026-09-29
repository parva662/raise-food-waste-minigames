/** Keeps only digits and at most one decimal separator. Rejects letters, signs, and exponents. */
export function sanitizeNonNegativeDecimalInput(raw: string): string {
  const normalized = raw.replace(/,/g, '.');
  let next = '';
  let seenDecimal = false;
  for (const character of normalized) {
    if (character >= '0' && character <= '9') {
      next += character;
      continue;
    }
    if (character === '.' && !seenDecimal) {
      next += '.';
      seenDecimal = true;
    }
  }
  return next;
}
