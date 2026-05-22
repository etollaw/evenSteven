import "server-only";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Expense, ExpenseSplit, Group, Settlement } from "@/lib/types";

export type EnrichedMember = {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  role: "owner" | "member";
  joined_at: string;
};

export type GroupBundle = {
  group: Group;
  currentUserId: string;
  members: EnrichedMember[];
  expenses: (Expense & { splits: ExpenseSplit[] })[];
  settlements: Settlement[];
};

export async function loadGroupBundle(groupId: string): Promise<GroupBundle> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");
  const currentUserId = userData.user.id;

  const { data: group, error: gErr } = await supabase
    .from("groups")
    .select("id, name, emoji, description, currency, created_by, created_at")
    .eq("id", groupId)
    .maybeSingle();
  if (gErr) throw gErr;
  if (!group) notFound();

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("user_id, role, joined_at, profiles!inner(id, display_name, email, avatar_url)")
    .eq("group_id", groupId);

  const members: EnrichedMember[] = (memberRows ?? [])
    .map((m) => {
      const p = m.profiles as unknown as { id: string; display_name: string; email: string | null; avatar_url: string | null };
      return {
        id: p.id,
        name: p.display_name,
        email: p.email,
        avatar_url: p.avatar_url,
        role: m.role as "owner" | "member",
        joined_at: m.joined_at as string,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const [expensesRes, splitsRes, settleRes] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, group_id, payer_id, amount, currency, description, category, occurred_at, split_type, notes, created_by, created_at")
      .eq("group_id", groupId)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("expense_splits")
      .select("id, expense_id, user_id, amount_owed, shares, percentage, expenses!inner(group_id)")
      .eq("expenses.group_id", groupId),
    supabase
      .from("settlements")
      .select("id, group_id, from_user, to_user, amount, note, created_by, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false }),
  ]);

  const splitsByExpense = new Map<string, ExpenseSplit[]>();
  (splitsRes.data ?? []).forEach((s) => {
    const row: ExpenseSplit = {
      id: s.id as string,
      expense_id: s.expense_id as string,
      user_id: s.user_id as string,
      amount_owed: Number(s.amount_owed),
      shares: s.shares == null ? null : Number(s.shares),
      percentage: s.percentage == null ? null : Number(s.percentage),
    };
    if (!splitsByExpense.has(row.expense_id)) splitsByExpense.set(row.expense_id, []);
    splitsByExpense.get(row.expense_id)!.push(row);
  });

  const expenses = (expensesRes.data ?? []).map((e) => ({
    id: e.id as string,
    group_id: e.group_id as string,
    payer_id: e.payer_id as string,
    amount: Number(e.amount),
    currency: e.currency as string,
    description: e.description as string,
    category: (e.category as string | null) ?? "general",
    occurred_at: e.occurred_at as string,
    split_type: e.split_type as Expense["split_type"],
    notes: (e.notes as string | null) ?? null,
    created_by: e.created_by as string,
    created_at: e.created_at as string,
    splits: splitsByExpense.get(e.id as string) ?? [],
  }));

  const settlements = (settleRes.data ?? []).map((s) => ({
    id: s.id as string,
    group_id: s.group_id as string,
    from_user: s.from_user as string,
    to_user: s.to_user as string,
    amount: Number(s.amount),
    note: (s.note as string | null) ?? null,
    created_by: s.created_by as string,
    created_at: s.created_at as string,
  }));

  return {
    group: group as Group,
    currentUserId,
    members,
    expenses,
    settlements,
  };
}
