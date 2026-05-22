import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_FORMATTERS = new Map<string, Intl.NumberFormat>();

export function formatMoney(amount: number, currency: string = "USD"): string {
  const key = currency.toUpperCase();
  let fmt = CURRENCY_FORMATTERS.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: key,
        maximumFractionDigits: 2,
      });
    } catch {
      fmt = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      });
    }
    CURRENCY_FORMATTERS.set(key, fmt);
  }
  return fmt.format(amount);
}

export function formatSignedMoney(amount: number, currency: string = "USD"): string {
  const v = formatMoney(Math.abs(amount), currency);
  if (amount > 0.005) return `+${v}`;
  if (amount < -0.005) return `−${v}`;
  return v;
}

export function relativeDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return "just now";
  if (abs < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (abs < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (abs < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: abs > 86400 * 365 ? "numeric" : undefined });
}

export function initialsFromName(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function colorForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 65% 55%)`;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function randomInviteCode(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * Splits a total of `cents` into `n` near-equal integer parts that sum exactly
 * to the total. Remainder cents are distributed one per leading bucket.
 */
export function distributeCents(totalCents: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;
  const out = new Array<number>(n).fill(base);
  for (let i = 0; i < remainder; i++) out[i] += 1;
  return out;
}

export const CURRENCY_OPTIONS = [
  "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR", "BRL", "MXN", "ILS",
  "ZAR", "SGD", "HKD", "CHF", "SEK", "NOK", "DKK", "NZD", "AED", "TRY",
];

export const EXPENSE_CATEGORIES: { value: string; label: string; emoji: string }[] = [
  { value: "general", label: "General", emoji: "💸" },
  { value: "food", label: "Food & Drink", emoji: "🍕" },
  { value: "groceries", label: "Groceries", emoji: "🛒" },
  { value: "transport", label: "Transport", emoji: "🚕" },
  { value: "lodging", label: "Lodging", emoji: "🏨" },
  { value: "entertainment", label: "Entertainment", emoji: "🎬" },
  { value: "utilities", label: "Utilities", emoji: "💡" },
  { value: "rent", label: "Rent", emoji: "🏠" },
  { value: "travel", label: "Travel", emoji: "✈️" },
  { value: "shopping", label: "Shopping", emoji: "🛍️" },
  { value: "health", label: "Health", emoji: "💊" },
  { value: "gift", label: "Gift", emoji: "🎁" },
  { value: "other", label: "Other", emoji: "📦" },
];

export function categoryFor(value: string | null | undefined) {
  return EXPENSE_CATEGORIES.find((c) => c.value === value) ?? EXPENSE_CATEGORIES[0];
}
