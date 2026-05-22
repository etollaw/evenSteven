import { distributeCents, fromCents, toCents } from "./utils";

export type Member = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

export type ExpenseInput = {
  payerId: string;
  amount: number; // positive
  splits: { userId: string; amountOwed: number }[];
};

export type SettlementInput = {
  fromUser: string;
  toUser: string;
  amount: number;
};

export type NetBalance = {
  userId: string;
  balanceCents: number; // positive = others owe them, negative = they owe others
};

export type Transaction = {
  from: string;
  to: string;
  amountCents: number;
};

/**
 * Compute net balance per user (in integer cents) from expenses + settlements.
 * For each expense: payer gets +amount, each split owner gets -amountOwed.
 * For each settlement: from gets +amount (debt reduced), to gets -amount.
 */
export function computeNetBalances(
  members: Member[],
  expenses: ExpenseInput[],
  settlements: SettlementInput[] = [],
): Map<string, number> {
  const bal = new Map<string, number>();
  for (const m of members) bal.set(m.id, 0);

  const add = (id: string, delta: number) => {
    bal.set(id, (bal.get(id) ?? 0) + delta);
  };

  for (const exp of expenses) {
    const total = toCents(exp.amount);
    add(exp.payerId, total);
    for (const s of exp.splits) {
      add(s.userId, -toCents(s.amountOwed));
    }
  }

  for (const s of settlements) {
    const amt = toCents(s.amount);
    add(s.fromUser, amt);
    add(s.toUser, -amt);
  }

  return bal;
}

/**
 * Greedy "min cash flow" optimizer.
 * Repeatedly pair the largest creditor with the largest debtor and transfer
 * the minimum of |both| until all balances are zero.
 * Returns transactions in integer cents.
 */
export function settleUpOptimizer(balances: Map<string, number>): Transaction[] {
  type Entry = { id: string; cents: number };
  const creditors: Entry[] = [];
  const debtors: Entry[] = [];

  for (const [id, cents] of balances.entries()) {
    if (cents > 0) creditors.push({ id, cents });
    else if (cents < 0) debtors.push({ id, cents: -cents });
  }

  creditors.sort((a, b) => b.cents - a.cents);
  debtors.sort((a, b) => b.cents - a.cents);

  const tx: Transaction[] = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const c = creditors[i];
    const d = debtors[j];
    const pay = Math.min(c.cents, d.cents);
    if (pay > 0) {
      tx.push({ from: d.id, to: c.id, amountCents: pay });
      c.cents -= pay;
      d.cents -= pay;
    }
    if (c.cents === 0) i++;
    if (d.cents === 0) j++;
  }

  return tx;
}

/** Distribute a total amount equally across N users using integer cents,
 *  returning the per-user owed amount (in dollars). Last cents go to the
 *  first users to keep the sum exact. */
export function equalSplit(totalAmount: number, userIds: string[]): { userId: string; amountOwed: number }[] {
  const cents = toCents(totalAmount);
  const parts = distributeCents(cents, userIds.length);
  return userIds.map((id, i) => ({ userId: id, amountOwed: fromCents(parts[i]) }));
}

/** Split by exact amounts (must sum to total within rounding tolerance) */
export function exactSplit(
  totalAmount: number,
  entries: { userId: string; amount: number }[],
): { userId: string; amountOwed: number }[] {
  return entries
    .filter((e) => e.amount > 0 || e.amount === 0)
    .map((e) => ({ userId: e.userId, amountOwed: fromCents(toCents(e.amount)) }));
}

/** Split by percentages — distributes remainder cents to first entries */
export function percentageSplit(
  totalAmount: number,
  entries: { userId: string; percentage: number }[],
): { userId: string; amountOwed: number }[] {
  const cents = toCents(totalAmount);
  const rawCents = entries.map((e) => Math.floor((e.percentage / 100) * cents));
  let assigned = rawCents.reduce((a, b) => a + b, 0);
  let i = 0;
  while (assigned < cents && entries.length > 0) {
    rawCents[i % entries.length] += 1;
    assigned++;
    i++;
  }
  return entries.map((e, idx) => ({ userId: e.userId, amountOwed: fromCents(rawCents[idx]) }));
}

/** Split by shares (weights). */
export function sharesSplit(
  totalAmount: number,
  entries: { userId: string; shares: number }[],
): { userId: string; amountOwed: number }[] {
  const cents = toCents(totalAmount);
  const totalShares = entries.reduce((a, b) => a + (b.shares || 0), 0);
  if (totalShares <= 0) return entries.map((e) => ({ userId: e.userId, amountOwed: 0 }));
  const rawCents = entries.map((e) => Math.floor((e.shares / totalShares) * cents));
  let assigned = rawCents.reduce((a, b) => a + b, 0);
  let i = 0;
  while (assigned < cents) {
    rawCents[i % entries.length] += 1;
    assigned++;
    i++;
  }
  return entries.map((e, idx) => ({ userId: e.userId, amountOwed: fromCents(rawCents[idx]) }));
}
