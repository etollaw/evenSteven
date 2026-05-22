import { fromCents, toCents } from "@/lib/money";
import type { ExpenseWithDetails, MemberWithProfile, SettlementWithProfiles, UserProfile } from "@/lib/types";

export type Balance = {
  user: UserProfile;
  paid: number;
  owed: number;
  received: number;
  sent: number;
  net: number;
};

export type SettlementSuggestion = {
  from: UserProfile;
  to: UserProfile;
  amount: number;
};

type RunningBalance = {
  user: UserProfile;
  paidCents: number;
  owedCents: number;
  receivedCents: number;
  sentCents: number;
  netCents: number;
};

export function calculateBalances(
  members: MemberWithProfile[],
  expenses: ExpenseWithDetails[],
  settlements: SettlementWithProfiles[]
): Balance[] {
  const balances = new Map<string, RunningBalance>();

  members.forEach((member) => {
    balances.set(member.user_id, {
      user: member.user,
      paidCents: 0,
      owedCents: 0,
      receivedCents: 0,
      sentCents: 0,
      netCents: 0
    });
  });

  expenses.forEach((expense) => {
    const payerBalance = balances.get(expense.payer_id);
    if (payerBalance) {
      payerBalance.paidCents += toCents(expense.amount);
    }

    expense.splits.forEach((split) => {
      const splitBalance = balances.get(split.user_id);
      if (splitBalance) {
        splitBalance.owedCents += toCents(split.amount_owed);
      }
    });
  });

  settlements.forEach((settlement) => {
    const amountCents = toCents(settlement.amount);
    const payerBalance = balances.get(settlement.payer_id);
    const receiverBalance = balances.get(settlement.receiver_id);

    if (payerBalance) {
      payerBalance.sentCents += amountCents;
    }

    if (receiverBalance) {
      receiverBalance.receivedCents += amountCents;
    }
  });

  return Array.from(balances.values())
    .map((balance) => {
      const netCents = balance.paidCents - balance.owedCents - balance.receivedCents + balance.sentCents;

      return {
        user: balance.user,
        paid: fromCents(balance.paidCents),
        owed: fromCents(balance.owedCents),
        received: fromCents(balance.receivedCents),
        sent: fromCents(balance.sentCents),
        net: fromCents(netCents)
      };
    })
    .sort((a, b) => b.net - a.net);
}

export function optimizeSettlements(balances: Balance[]): SettlementSuggestion[] {
  const debtors = balances
    .filter((balance) => toCents(balance.net) < 0)
    .map((balance) => ({ user: balance.user, cents: Math.abs(toCents(balance.net)) }))
    .sort((a, b) => b.cents - a.cents);

  const creditors = balances
    .filter((balance) => toCents(balance.net) > 0)
    .map((balance) => ({ user: balance.user, cents: toCents(balance.net) }))
    .sort((a, b) => b.cents - a.cents);

  const suggestions: SettlementSuggestion[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountCents = Math.min(debtor.cents, creditor.cents);

    if (amountCents > 0) {
      suggestions.push({
        from: debtor.user,
        to: creditor.user,
        amount: fromCents(amountCents)
      });
    }

    debtor.cents -= amountCents;
    creditor.cents -= amountCents;

    if (debtor.cents === 0) {
      debtorIndex += 1;
    }

    if (creditor.cents === 0) {
      creditorIndex += 1;
    }
  }

  return suggestions;
}
