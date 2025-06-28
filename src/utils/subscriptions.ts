import { addMonths, differenceInCalendarDays } from 'date-fns';

/**
 * Given a base date (ISO or Date), and the number of months to add,
 * returns a new ISO‐date string ("YYYY-MM-DD").
 */
export function extendByMonths(
  base: string | Date,
  monthsToAdd: number
): string {
  const baseDate = typeof base === 'string' ? new Date(base) : base;
  const updated = addMonths(baseDate, monthsToAdd);
  return updated.toISOString().split('T')[0];
}

/**
 * Based on a paidUntil date, returns:
 * - null, if > 10 days out
 * - "Subscription will expire in X day(s)", if 0 ≤ days ≤ 10
 * - "Subscription expired X day(s) ago", if days < 0
 */
export function getExpiryNote(paidUntil?: string | null): string | null {
  if (!paidUntil) return null;
  const days = differenceInCalendarDays(new Date(paidUntil), new Date());
  if (days < 0) {
    return `Subscription expired ${-days} day(s) ago.`;
  }
  if (days <= 10) {
    return `Subscription will expire in ${days} day(s).`;
  }
  return null;
}
