import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AvatarStack } from "@/components/ui/Avatar";
import { formatMoney, formatSignedMoney, relativeDate } from "@/lib/utils";
import { computeNetBalances } from "@/lib/optimizer";
import { PostLoginRedirector } from "@/components/PostLoginRedirector";

type GroupRow = {
  id: string;
  name: string;
  emoji: string | null;
  currency: string;
  created_at: string;
};

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user!.id;

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("group_id, groups(id, name, emoji, currency, created_at)")
    .eq("user_id", userId);

  const groups: GroupRow[] = (memberRows ?? [])
    .map((m) => m.groups as unknown as GroupRow)
    .filter(Boolean)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  // Pull stats per group
  const groupIds = groups.map((g) => g.id);

  const [expensesRes, splitsRes, settleRes, membersRes] = await Promise.all([
    groupIds.length
      ? supabase
          .from("expenses")
          .select("id, group_id, payer_id, amount, occurred_at")
          .in("group_id", groupIds)
      : Promise.resolve({ data: [] as Array<{ id: string; group_id: string; payer_id: string; amount: number; occurred_at: string }> }),
    groupIds.length
      ? supabase
          .from("expense_splits")
          .select("expense_id, user_id, amount_owed, expenses!inner(group_id)")
          .in("expenses.group_id", groupIds)
      : Promise.resolve({ data: [] as Array<{ expense_id: string; user_id: string; amount_owed: number; expenses: { group_id: string } | { group_id: string }[] }> }),
    groupIds.length
      ? supabase
          .from("settlements")
          .select("group_id, from_user, to_user, amount")
          .in("group_id", groupIds)
      : Promise.resolve({ data: [] as Array<{ group_id: string; from_user: string; to_user: string; amount: number }> }),
    groupIds.length
      ? supabase
          .from("group_members")
          .select("group_id, user_id")
          .in("group_id", groupIds)
      : Promise.resolve({ data: [] as Array<{ group_id: string; user_id: string }> }),
  ]);

  const allMemberIds = new Set<string>();
  (membersRes.data ?? []).forEach((m) => allMemberIds.add(m.user_id));

  const { data: profilesData } = allMemberIds.size
    ? await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", Array.from(allMemberIds))
    : { data: [] as Array<{ id: string; display_name: string; avatar_url: string | null }> };

  const profileMap = new Map<string, { id: string; name: string; avatar_url: string | null }>();
  (profilesData ?? []).forEach((p) => profileMap.set(p.id, { id: p.id, name: p.display_name, avatar_url: p.avatar_url }));

  // Per-group: balance for current user
  const balancesByGroup = new Map<string, number>();
  const totalsByGroup = new Map<string, number>();
  const lastByGroup = new Map<string, string | null>();
  const membersByGroup = new Map<string, { id: string; name: string; avatar_url: string | null }[]>();

  for (const g of groups) {
    membersByGroup.set(g.id, []);
    totalsByGroup.set(g.id, 0);
    lastByGroup.set(g.id, null);
    balancesByGroup.set(g.id, 0);
  }

  (membersRes.data ?? []).forEach((m) => {
    const p = profileMap.get(m.user_id);
    if (p) membersByGroup.get(m.group_id)?.push(p);
  });

  const expensesByGroup = new Map<string, Array<{ id: string; payerId: string; amount: number; occurredAt: string }>>();
  (expensesRes.data ?? []).forEach((e) => {
    if (!expensesByGroup.has(e.group_id)) expensesByGroup.set(e.group_id, []);
    expensesByGroup.get(e.group_id)!.push({ id: e.id, payerId: e.payer_id, amount: Number(e.amount), occurredAt: e.occurred_at });
    totalsByGroup.set(e.group_id, (totalsByGroup.get(e.group_id) ?? 0) + Number(e.amount));
    const cur = lastByGroup.get(e.group_id);
    if (!cur || cur < e.occurred_at) lastByGroup.set(e.group_id, e.occurred_at);
  });

  const splitsByExpense = new Map<string, Array<{ userId: string; amount: number }>>();
  (splitsRes.data ?? []).forEach((s) => {
    if (!splitsByExpense.has(s.expense_id)) splitsByExpense.set(s.expense_id, []);
    splitsByExpense.get(s.expense_id)!.push({ userId: s.user_id, amount: Number(s.amount_owed) });
  });

  const settlementsByGroup = new Map<string, Array<{ fromUser: string; toUser: string; amount: number }>>();
  (settleRes.data ?? []).forEach((s) => {
    if (!settlementsByGroup.has(s.group_id)) settlementsByGroup.set(s.group_id, []);
    settlementsByGroup.get(s.group_id)!.push({ fromUser: s.from_user, toUser: s.to_user, amount: Number(s.amount) });
  });

  for (const g of groups) {
    const members = (membersByGroup.get(g.id) ?? []).map((m) => ({ id: m.id, name: m.name }));
    const expenses = (expensesByGroup.get(g.id) ?? []).map((e) => ({
      payerId: e.payerId,
      amount: e.amount,
      splits: (splitsByExpense.get(e.id) ?? []).map((s) => ({ userId: s.userId, amountOwed: s.amount })),
    }));
    const settlements = (settlementsByGroup.get(g.id) ?? []).map((s) => ({
      fromUser: s.fromUser,
      toUser: s.toUser,
      amount: s.amount,
    }));
    const bal = computeNetBalances(members, expenses, settlements);
    balancesByGroup.set(g.id, (bal.get(userId) ?? 0) / 100);
  }

  const totalUserBalance = Array.from(balancesByGroup.values()).reduce((a, b) => a + b, 0);
  const owedTo = Array.from(balancesByGroup.values()).filter((v) => v > 0).reduce((a, b) => a + b, 0);
  const owe = Array.from(balancesByGroup.values()).filter((v) => v < 0).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <PostLoginRedirector />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your groups</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            See where you stand across every shared expense.
          </p>
        </div>
        <Link href="/groups/new" className="btn btn-primary"><Plus className="h-4 w-4" /> New group</Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="You are owed"
          value={formatMoney(owedTo)}
          accent="success"
        />
        <SummaryCard
          label="You owe"
          value={formatMoney(Math.abs(owe))}
          accent="danger"
        />
        <SummaryCard
          label="Net balance"
          value={formatSignedMoney(totalUserBalance)}
          accent={totalUserBalance > 0.005 ? "success" : totalUserBalance < -0.005 ? "danger" : "neutral"}
        />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="No groups yet"
          description="Create a group for your trip, your apartment, or your friend crew."
          action={
            <div className="flex gap-2">
              <Link href="/groups/new" className="btn btn-primary"><Plus className="h-4 w-4" /> Create group</Link>
              <Link href="/join" className="btn btn-secondary">Join with code</Link>
            </div>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => {
            const members = membersByGroup.get(g.id) ?? [];
            const total = totalsByGroup.get(g.id) ?? 0;
            const last = lastByGroup.get(g.id);
            const userBalance = balancesByGroup.get(g.id) ?? 0;
            return (
              <Link key={g.id} href={`/groups/${g.id}`} className="group">
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--muted)] text-xl">
                        {g.emoji || "✨"}
                      </span>
                      <div>
                        <h3 className="font-semibold">{g.name}</h3>
                        <p className="text-xs text-[color:var(--muted-foreground)]">
                          {last ? `Latest ${relativeDate(last)}` : "No expenses yet"}
                        </p>
                      </div>
                    </div>
                    <span className={`chip ${userBalance > 0.005 ? "chip-success" : userBalance < -0.005 ? "chip-danger" : "chip-neutral"}`}>
                      {userBalance > 0.005
                        ? `You're owed ${formatMoney(userBalance, g.currency)}`
                        : userBalance < -0.005
                          ? `You owe ${formatMoney(Math.abs(userBalance), g.currency)}`
                          : "Settled up"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--muted-foreground)]">
                    <span>{formatMoney(total, g.currency)} total · {members.length} member{members.length === 1 ? "" : "s"}</span>
                    <AvatarStack people={members} size={24} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent: "success" | "danger" | "neutral" }) {
  const color =
    accent === "success"
      ? "text-[color:var(--success)]"
      : accent === "danger"
        ? "text-[color:var(--destructive)]"
        : "text-[color:var(--foreground)]";
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}
