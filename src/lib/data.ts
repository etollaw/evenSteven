import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ExpenseWithDetails,
  Group,
  GroupDashboard,
  MemberWithProfile,
  SettlementWithProfiles,
  UserProfile
} from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const profile = await ensureUserProfile(user);

  return { supabase, user, profile };
}

export async function getOptionalUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const profile = await ensureUserProfile(user);

  return { supabase, user, profile };
}

async function ensureUserProfile(user: User): Promise<UserProfile> {
  const supabase = await createSupabaseServerClient();
  const metadata = user.user_metadata ?? {};
  const email = user.email ?? "";
  const name =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : email.split("@")[0] || "Friend";

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        id: user.id,
        email,
        name,
        avatar_url: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getDashboardData(): Promise<{
  profile: UserProfile;
  groups: GroupDashboard[];
}> {
  const { supabase, user, profile } = await getCurrentUser();

  const { data: memberships, error: membershipsError } = await supabase
    .from("group_members")
    .select("group:groups(*)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  const groups = memberships
    .map((membership) => membership.group)
    .filter(Boolean) as unknown as Group[];
  const groupIds = groups.map((group) => group.id);

  if (groupIds.length === 0) {
    return { profile, groups: [] };
  }

  const [{ data: allMemberships }, { data: expenses }] = await Promise.all([
    supabase.from("group_members").select("group_id").in("group_id", groupIds),
    supabase.from("expenses").select("group_id, amount").in("group_id", groupIds)
  ]);

  const memberCounts = new Map<string, number>();
  allMemberships?.forEach((membership) => {
    memberCounts.set(membership.group_id, (memberCounts.get(membership.group_id) ?? 0) + 1);
  });

  const expenseStats = new Map<string, { count: number; total: number }>();
  expenses?.forEach((expense) => {
    const current = expenseStats.get(expense.group_id) ?? { count: 0, total: 0 };
    expenseStats.set(expense.group_id, {
      count: current.count + 1,
      total: current.total + Number(expense.amount)
    });
  });

  return {
    profile,
    groups: groups.map((group) => {
      const stats = expenseStats.get(group.id) ?? { count: 0, total: 0 };

      return {
        ...group,
        member_count: memberCounts.get(group.id) ?? 0,
        expense_count: stats.count,
        total_spend: stats.total
      };
    })
  };
}

export async function getGroupData(groupId: string): Promise<{
  profile: UserProfile;
  group: Group;
  members: MemberWithProfile[];
  expenses: ExpenseWithDetails[];
  settlements: SettlementWithProfiles[];
}> {
  const { supabase, profile } = await getCurrentUser();

  const [{ data: group, error: groupError }, { data: members, error: membersError }] = await Promise.all([
    supabase.from("groups").select("*").eq("id", groupId).single(),
    supabase
      .from("group_members")
      .select("*, user:users(*)")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true })
  ]);

  if (groupError || !group) {
    redirect("/dashboard");
  }

  if (membersError) {
    throw new Error(membersError.message);
  }

  const [{ data: expenses, error: expensesError }, { data: settlements, error: settlementsError }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*, payer:users!expenses_payer_id_fkey(*), splits(*, user:users(*))")
      .eq("group_id", groupId)
      .order("paid_at", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("settlements")
      .select("*, payer:users!settlements_payer_id_fkey(*), receiver:users!settlements_receiver_id_fkey(*)")
      .eq("group_id", groupId)
      .order("settled_at", { ascending: false })
  ]);

  if (expensesError) {
    throw new Error(expensesError.message);
  }

  if (settlementsError) {
    throw new Error(settlementsError.message);
  }

  return {
    profile,
    group,
    members: (members ?? []) as unknown as MemberWithProfile[],
    expenses: (expenses ?? []) as unknown as ExpenseWithDetails[],
    settlements: (settlements ?? []) as unknown as SettlementWithProfiles[]
  };
}
