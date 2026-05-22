"use client";

import { useMemo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { formatMoney, fromCents } from "@/lib/utils";
import { computeNetBalances, settleUpOptimizer, type Member } from "@/lib/optimizer";

type Props = {
  members: Member[];
  expenses: { payerId: string; amount: number; splits: { userId: string; amountOwed: number }[] }[];
  settlements: { fromUser: string; toUser: string; amount: number }[];
  currency: string;
  currentUserId: string;
};

export function BalanceList({ members, expenses, settlements, currency, currentUserId }: Props) {
  const balances = useMemo(
    () => computeNetBalances(members, expenses, settlements),
    [members, expenses, settlements],
  );
  const sorted = useMemo(() => {
    return members
      .map((m) => ({ ...m, cents: balances.get(m.id) ?? 0 }))
      .sort((a, b) => b.cents - a.cents);
  }, [members, balances]);

  const maxAbs = useMemo(
    () => Math.max(1, ...sorted.map((s) => Math.abs(s.cents))),
    [sorted],
  );

  return (
    <ul className="divide-y divide-[color:var(--border)]">
      {sorted.map((m) => {
        const amount = fromCents(m.cents);
        const isYou = m.id === currentUserId;
        const positive = m.cents > 0;
        const zero = Math.abs(m.cents) < 1; // less than a cent
        return (
          <li key={m.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar id={m.id} name={m.name} src={m.avatarUrl} size={32} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {m.name}{isYou && <span className="ml-1 text-[color:var(--muted-foreground)]">(you)</span>}
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  {zero ? "Settled up" : positive ? "Gets back" : "Owes"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-[color:var(--muted)] sm:block" aria-hidden>
                <div
                  className={`h-full ${positive ? "bg-[color:var(--success)]" : zero ? "bg-[color:var(--muted)]" : "bg-[color:var(--destructive)]"}`}
                  style={{ width: `${Math.min(100, (Math.abs(m.cents) / maxAbs) * 100)}%` }}
                />
              </div>
              <span className={`text-sm font-semibold tabular-nums ${zero ? "text-[color:var(--muted-foreground)]" : positive ? "text-[color:var(--success)]" : "text-[color:var(--destructive)]"}`}>
                {zero ? formatMoney(0, currency) : formatMoney(Math.abs(amount), currency)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function SettleUpList({ members, expenses, settlements, currency, currentUserId }: Props) {
  const tx = useMemo(() => {
    const b = computeNetBalances(members, expenses, settlements);
    return settleUpOptimizer(b);
  }, [members, expenses, settlements]);

  const byId = useMemo(() => {
    const m = new Map<string, Member>();
    members.forEach((mm) => m.set(mm.id, mm));
    return m;
  }, [members]);

  if (tx.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--border)] p-6 text-center text-sm text-[color:var(--muted-foreground)]">
        Everyone&apos;s settled up. 🎉
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {tx.map((t, i) => {
        const from = byId.get(t.from);
        const to = byId.get(t.to);
        const youOwe = t.from === currentUserId;
        const youReceive = t.to === currentUserId;
        return (
          <li
            key={i}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
              youOwe || youReceive ? "border-[color:var(--primary)] bg-[color:var(--muted)]" : "border-[color:var(--border)]"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              {from && <Avatar id={from.id} name={from.name} src={from.avatarUrl} size={26} />}
              <span className="truncate text-sm font-medium">{from?.name ?? "Unknown"}</span>
              <span className="text-[color:var(--muted-foreground)]">→</span>
              {to && <Avatar id={to.id} name={to.name} src={to.avatarUrl} size={26} />}
              <span className="truncate text-sm font-medium">{to?.name ?? "Unknown"}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {formatMoney(fromCents(t.amountCents), currency)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
