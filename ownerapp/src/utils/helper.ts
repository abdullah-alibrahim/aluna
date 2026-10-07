/**
 * Formats money amounts for Syrian Pound display (ل.س).
 */
export const formatMoney = (amount: number | string | null | undefined, currency = 'ل.س') => {
  const n = Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  return `${safe.toLocaleString('ar-SY')} ${currency}`;
};
