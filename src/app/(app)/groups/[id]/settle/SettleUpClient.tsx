"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Plus } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Inputs";
import { formatMoney, fromCents, toCents } from "@/lib/utils";
import { computeNetBalances, settleUpOptimizer, type Member } from "@/lib/optimizer";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  groupId: string;
  currency: string;
  currentUserId: string;
  members: { id: string; name: string; avatar_url: string | null }[];
  expenses: { payerId: string; amount: number; splits: { userId: string; amountOwed: number }[] }[];
  settlements: { fromUser: string; toUser: string; amount: number }[];
};

export function SettleUpClient({
  groupId,
  currency,
  currentUserId,
  members,
  expenses,
  settlements,
}: Props) {
  const router = useRouter();
  const memberObjs: Member[] = members.map((m) => ({ id: m.id, name: m.name, avatarUrl: m.avatar_url }));
  const balances = useMemo(
    () => computeNetBalances(memberObjs, expenses, settlements),
    [memberObjs, expenses, settlements],
  );
  const txs = useMemo(() => settleUpOptimizer(balances), [balances]);

  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const [recording, setRecording] = useState<number | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  async function record(from: string, to: string, amount: number, idx: number) {
    setRecording(idx);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("settlements").insert({
        group_id: groupId,
        from_user: from,
        to_user: to,
        amount,
        created_by: currentUserId,
      });
      if (error) throw error;
      toast.success("Payment recorded");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to record payment";
      toast.error(msg);
    } finally {
      setRecording(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCheck className="h-4 w-4 text-[color:var(--success)]" />
            <p className="text-sm font-semibold">Suggested payments</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setManualOpen((v) => !v)}>
            <Plus className="h-4 w-4" /> Manual settlement
          </Button>
        </div>
        {txs.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[color:var(--border)] p-6 text-center text-sm text-[color:var(--muted-foreground)]">
            Everyone is settled up. 🎉
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {txs.map((t, i) => {
              const from = byId.get(t.from);
              const to = byId.get(t.to);
              const amount = fromCents(t.amountCents);
              const youAreFrom = t.from === currentUserId;
              const youAreTo = t.to === currentUserId;
              return (
                <li
                  key={i}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${
                    youAreFrom || youAreTo ? "border-[color:var(--primary)] bg-[color:var(--muted)]" : "border-[color:var(--border)]"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {from && <Avatar id={from.id} name={from.name} src={from.avatar_url} size={28} />}
                    <span className="truncate text-sm font-medium">{from?.name}</span>
                    <span className="text-[color:var(--muted-foreground)]">pays</span>
                    {to && <Avatar id={to.id} name={to.name} src={to.avatar_url} size={28} />}
                    <span className="truncate text-sm font-medium">{to?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums">{formatMoney(amount, currency)}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => record(t.from, t.to, amount, i)}
                      loading={recording === i}
                    >
                      Mark paid
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {manualOpen && (
        <ManualSettleForm
          groupId={groupId}
          members={members}
          currency={currency}
          currentUserId={currentUserId}
          onDone={() => {
            setManualOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function ManualSettleForm({
  groupId,
  members,
  currency,
  currentUserId,
  onDone,
}: {
  groupId: string;
  members: { id: string; name: string; avatar_url: string | null }[];
  currency: string;
  currentUserId: string;
  onDone: () => void;
}) {
  const others = members.filter((m) => m.id !== currentUserId);
  const [fromUser, setFromUser] = useState(currentUserId);
  const [toUser, setToUser] = useState(others[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!fromUser || !toUser) return toast.error("Pick both people.");
    if (fromUser === toUser) return toast.error("Pick two different people.");
    if (!Number.isFinite(n) || n <= 0) return toast.error("Enter a positive amount.");
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("settlements").insert({
        group_id: groupId,
        from_user: fromUser,
        to_user: toUser,
        amount: fromCents(toCents(n)),
        note: note.trim() || null,
        created_by: currentUserId,
      });
      if (error) throw error;
      toast.success("Settlement recorded");
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to record settlement";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form className="space-y-3" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="From">
            <Select value={fromUser} onChange={(e) => setFromUser(e.target.value)}>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </Field>
          <Field label="To">
            <Select value={toUser} onChange={(e) => setToUser(e.target.value)}>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </Field>
          <Field label="Amount" className="sm:col-span-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[color:var(--muted-foreground)]">{currency}</span>
              <Input
                inputMode="decimal"
                className="pl-12 tabular-nums"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                required
              />
            </div>
          </Field>
          <Field label="Note (optional)" className="sm:col-span-2">
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's this for?" />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>Record settlement</Button>
        </div>
      </form>
    </Card>
  );
}
