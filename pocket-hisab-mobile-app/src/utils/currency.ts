/** Formats an amount using the user's currency (Intl.NumberFormat, no extra deps). */
export function formatCurrency(amount: number | string, currency: string = 'BDT'): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Intl throws on an unrecognized currency code (e.g. a typo) — fall back
    // to a plain number rather than crashing the screen.
    return `${currency} ${value.toFixed(2)}`;
  }
}

/** Same as formatCurrency but prefixes a +/- sign, for transaction rows. */
export function formatSignedCurrency(amount: number | string, type: 'income' | 'expense', currency: string) {
  const sign = type === 'income' ? '+' : '−';
  return `${sign}${formatCurrency(Math.abs(Number(amount)), currency)}`;
}
