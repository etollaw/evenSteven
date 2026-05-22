"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Inputs";
import {
  CURRENCY_OPTIONS,
  EXPENSE_CATEGORIES,
  formatMoney,
  fromCents,
  toCents,
} from "@/lib/utils";
import {
  equalSplit,
  exactSplit,
  percentageSplit,
  sharesSplit,
} from "@/lib/optimizer";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Member = { id: string; name: string; avatar_url: string | null };
type SplitType = "equal" | "exact" | "percentage" | "shares";

type Props = {
  groupId: string;
  currency: string;
  members: Member[];
  currentUserId: string;
  initial?: {
    expenseId: string;
    description: string;
    amount: number;
    payerId: string;
    category: string;
    splitType: SplitType;
    notes: string | null;
    occurredAt: string;
    splits: { userId: string; amountOwed: number; percentage: number | null; shares: number | null }[];
  };
};

export function ExpenseForm({ groupId, currency, members, currentUserId, initial }: Props) {
  const router = useRouter();
  const isEditing = !!initial;
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amountStr, setAmountStr] = useState(initial ? initial.amount.toString() : "");
  const [payerId, setPayerId] = useState(initial?.payerId ?? currentUserId);
  const [category, setCategory] = useState(initial?.category ?? "general");
  const [splitType, setSplitType] = useState<SplitType>(initial?.splitType ?? "equal");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [expCurrency, setExpCurrency] = useState(currency);
  const [date, setDate] = useState<string>(() => {
    const d = initial ? new Date(initial.occurredAt) : new Date();
    return d.toISOString().slice(0, 10);
  });
  const [participants, setParticipants] = useState<Set<string>>(
    () =>
      new Set(
        initial?.splits.length
          ? initial.splits.map((s) => s.userId)
          : members.map((m) => m.id),
      ),
  );
  const [exactValues, setExactValues] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    if (initial?.splits.length && initial.splitType === "exact") {
      initial.splits.forEach((s) => (m[s.userId] = s.amountOwed.toString()));
    }
    return m;
  });
  const [percentValues, setPercentValues] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    if (initial?.splits.length && initial.splitType === "percentage") {
      initial.splits.forEach((s) => (m[s.userId] = (s.percentage ?? 0).toString()));
    }
    return m;
  });
  const [shareValues, setShareValues] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    if (initial?.splits.length && initial.splitType === "shares") {
      initial.splits.forEach((s) => (m[s.userId] = (s.shares ?? 1).toString()));
    } else {
      members.forEach((m2) => (m[m2.id] = "1"));
    }
    return m;
  });
  const [saving, setSaving] = useState(false);

  const amount = useMemo(() => {
    const n = Number(amountStr);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [amountStr]);

  const includedMembers = useMemo(
    () => members.filter((m) => participants.has(m.id)),
    [members, participants],
  );

  const computedSplits: { userId: string; amountOwed: number; percentage: number | null; shares: number | null }[] = useMemo(() => {
    if (!amount || includedMembers.length === 0) return [];
    if (splitType === "equal") {
      return equalSplit(amount, includedMembers.map((m) => m.id)).map((s) => ({
        ...s,
        percentage: null,
        shares: null,
      }));
    }
    if (splitType === "exact") {
      const entries = includedMembers.map((m) => ({
        userId: m.id,
        amount: Number(exactValues[m.id] ?? 0),
      }));
      return exactSplit(amount, entries).map((s) => ({ ...s, percentage: null, shares: null }));
    }
    if (splitType === "percentage") {
      const entries = includedMembers.map((m) => ({
        userId: m.id,
        percentage: Number(percentValues[m.id] ?? 0),
      }));
      return percentageSplit(amount, entries).map((s, i) => ({
        ...s,
        percentage: Number(entries[i].percentage),
        shares: null,
      }));
    }
    // shares
    const entries = includedMembers.map((m) => ({
      userId: m.id,
      shares: Number(shareValues[m.id] ?? 0),
    }));
    return sharesSplit(amount, entries).map((s, i) => ({
      ...s,
      percentage: null,
      shares: Number(entries[i].shares),
    }));
  }, [amount, splitType, includedMembers, exactValues, percentValues, shareValues]);

  const splitsSum = computedSplits.reduce((a, b) => a + b.amountOwed, 0);
  const sumDelta = fromCents(toCents(amount) - toCents(splitsSum));
  const percentSum = includedMembers.reduce((a, m) => a + (Number(percentValues[m.id]) || 0), 0);
  const shareSum = includedMembers.reduce((a, m) => a + (Number(shareValues[m.id]) || 0), 0);

  function toggleParticipant(id: string) {
    setParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return toast.error("Please add a description.");
    if (amount <= 0) return toast.error("Amount must be greater than zero.");
    if (includedMembers.length === 0) return toast.error("Pick at least one person to split with.");
    if (!participants.has(payerId)) {
      // Allow payer to not be a participant — they may have paid for others only.
    }

    if (splitType === "exact" && Math.abs(sumDelta) > 0.01) {
      return toast.error(
        `Exact amounts don't add up. Remaining: ${formatMoney(sumDelta, expCurrency)}`,
      );
    }
    if (splitType === "percentage" && Math.abs(percentSum - 100) > 0.05) {
      return toast.error(`Percentages must total 100% (currently ${percentSum.toFixed(2)}%).`);
    }
    if (splitType === "shares" && shareSum <= 0) {
      return toast.error("Total shares must be greater than zero.");
    }

    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const occurredAt = new Date(date).toISOString();

      if (isEditing && initial) {
        const { error: upErr } = await supabase
          .from("expenses")
          .update({
            description: description.trim(),
            amount,
            currency: expCurrency,
            payer_id: payerId,
            category,
            split_type: splitType,
            notes: notes.trim() || null,
            occurred_at: occurredAt,
          })
          .eq("id", initial.expenseId);
        if (upErr) throw upErr;

        const { error: delErr } = await supabase
          .from("expense_splits")
          .delete()
          .eq("expense_id", initial.expenseId);
        if (delErr) throw delErr;

        const rows = computedSplits.map((s) => ({
          expense_id: initial.expenseId,
          user_id: s.userId,
          amount_owed: s.amountOwed,
          shares: s.shares,
          percentage: s.percentage,
        }));
        const { error: insErr } = await supabase.from("expense_splits").insert(rows);
        if (insErr) throw insErr;

        toast.success("Expense updated");
        router.push(`/groups/${groupId}/expenses/${initial.expenseId}`);
        router.refresh();
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from("expenses")
          .insert({
            group_id: groupId,
            description: description.trim(),
            amount,
            currency: expCurrency,
            payer_id: payerId,
            category,
            split_type: splitType,
            notes: notes.trim() || null,
            occurred_at: occurredAt,
            created_by: currentUserId,
          })
          .select("id")
          .single();
        if (insErr) throw insErr;

        const rows = computedSplits.map((s) => ({
          expense_id: inserted.id,
          user_id: s.userId,
          amount_owed: s.amountOwed,
          shares: s.shares,
          percentage: s.percentage,
        }));
        const { error: splitErr } = await supabase.from("expense_splits").insert(rows);
        if (splitErr) throw splitErr;

        toast.success("Expense added");
        router.push(`/groups/${groupId}`);
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save expense";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Description" htmlFor="description" className="sm:col-span-2">
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dinner at the noodle place"
              required
              autoFocus
              maxLength={120}
            />
          </Field>

          <Field label="Amount" htmlFor="amount">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[color:var(--muted-foreground)]">
                {expCurrency}
              </span>
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="0.00"
                className="pl-12 tabular-nums"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ""))}
                required
              />
            </div>
          </Field>

          <Field label="Currency" htmlFor="currency">
            <Select id="currency" value={expCurrency} onChange={(e) => setExpCurrency(e.target.value)}>
              {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>

          <Field label="Paid by" htmlFor="payer">
            <Select id="payer" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}{m.id === currentUserId ? " (you)" : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Date" htmlFor="date">
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>

          <Field label="Category" htmlFor="category" className="sm:col-span-2">
            <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Split between</h3>
            <div className="flex flex-wrap gap-1 rounded-xl bg-[color:var(--muted)] p-1 text-xs">
              {(["equal", "exact", "percentage", "shares"] as SplitType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSplitType(t)}
                  className={`rounded-lg px-2.5 py-1 capitalize ${
                    splitType === t
                      ? "bg-[color:var(--card)] shadow-sm"
                      : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <ul className="rounded-xl border border-[color:var(--border)] divide-y divide-[color:var(--border)]">
            {members.map((m) => {
              const included = participants.has(m.id);
              const split = computedSplits.find((s) => s.userId === m.id);
              return (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <label className="flex min-w-0 grow items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={included}
                      onChange={() => toggleParticipant(m.id)}
                    />
                    <Avatar id={m.id} name={m.name} src={m.avatar_url} size={26} />
                    <span className="truncate text-sm font-medium">
                      {m.name}{m.id === currentUserId ? <span className="ml-1 text-[color:var(--muted-foreground)]">(you)</span> : null}
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    {included && splitType === "exact" && (
                      <div className="relative">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[color:var(--muted-foreground)]">{expCurrency}</span>
                        <Input
                          inputMode="decimal"
                          className="w-32 pl-10 tabular-nums"
                          placeholder="0.00"
                          value={exactValues[m.id] ?? ""}
                          onChange={(e) =>
                            setExactValues((v) => ({ ...v, [m.id]: e.target.value.replace(/[^0-9.]/g, "") }))
                          }
                        />
                      </div>
                    )}
                    {included && splitType === "percentage" && (
                      <div className="relative">
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[color:var(--muted-foreground)]">%</span>
                        <Input
                          inputMode="decimal"
                          className="w-24 pr-7 tabular-nums"
                          placeholder="0"
                          value={percentValues[m.id] ?? ""}
                          onChange={(e) =>
                            setPercentValues((v) => ({ ...v, [m.id]: e.target.value.replace(/[^0-9.]/g, "") }))
                          }
                        />
                      </div>
                    )}
                    {included && splitType === "shares" && (
                      <Input
                        inputMode="numeric"
                        className="w-20 tabular-nums"
                        placeholder="1"
                        value={shareValues[m.id] ?? ""}
                        onChange={(e) =>
                          setShareValues((v) => ({ ...v, [m.id]: e.target.value.replace(/[^0-9.]/g, "") }))
                        }
                      />
                    )}
                    {included && (
                      <span className="w-24 text-right text-sm font-medium tabular-nums text-[color:var(--muted-foreground)]">
                        {split ? formatMoney(split.amountOwed, expCurrency) : formatMoney(0, expCurrency)}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between text-xs text-[color:var(--muted-foreground)]">
            <div>
              {splitType === "exact" && (
                <span className={`${Math.abs(sumDelta) < 0.005 ? "" : "text-[color:var(--destructive)]"}`}>
                  Total of splits: {formatMoney(splitsSum, expCurrency)} / {formatMoney(amount, expCurrency)}
                  {Math.abs(sumDelta) > 0.005 ? ` · remaining ${formatMoney(sumDelta, expCurrency)}` : ""}
                </span>
              )}
              {splitType === "percentage" && (
                <span className={Math.abs(percentSum - 100) < 0.05 ? "" : "text-[color:var(--destructive)]"}>
                  Total: {percentSum.toFixed(2)}% / 100%
                </span>
              )}
              {splitType === "shares" && (
                <span>Total shares: {shareSum}</span>
              )}
              {splitType === "equal" && includedMembers.length > 0 && (
                <span>
                  {includedMembers.length} ways · {formatMoney(amount / includedMembers.length, expCurrency)} each
                </span>
              )}
            </div>
          </div>
        </div>

        <Field label="Notes (optional)" htmlFor="notes">
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else?"
            rows={2}
          />
        </Field>

        <div className="flex justify-end gap-2">
          <Button
            as="link"
            variant="ghost"
            href={isEditing && initial ? `/groups/${groupId}/expenses/${initial.expenseId}` : `/groups/${groupId}`}
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEditing ? "Save changes" : "Add expense"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
