"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/data";
import { getSiteUrl } from "@/lib/env";
import { splitEvenly, toCents } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function requireString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }

  return value.trim();
}

function parseAmount(value: FormDataEntryValue | null) {
  const amount = Number.parseFloat(typeof value === "string" ? value : "");
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid amount greater than zero.");
  }

  return Math.round(amount * 100) / 100;
}

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback`
    }
  });

  if (error || !data.url) {
    throw new Error(error?.message ?? "Unable to start Google sign-in.");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createGroup(formData: FormData) {
  const { supabase, user } = await getCurrentUser();
  const groupId = crypto.randomUUID();
  const name = requireString(formData, "name");
  const description = (formData.get("description")?.toString() ?? "").trim() || null;
  const currency = (formData.get("currency")?.toString() ?? "USD").trim().toUpperCase() || "USD";

  const { error: groupError } = await supabase.from("groups").insert({
    id: groupId,
    name,
    description,
    currency,
    created_by: user.id
  });

  if (groupError) {
    throw new Error(groupError.message);
  }

  const { error: membershipError } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: user.id,
    role: "owner"
  });

  if (membershipError) {
    await supabase.from("groups").delete().eq("id", groupId);
    throw new Error(membershipError.message);
  }

  revalidatePath("/dashboard");
  redirect(`/groups/${groupId}`);
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await getCurrentUser();
  const name = requireString(formData, "name");

  const { error } = await supabase.from("users").update({ name }).eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function addGroupMember(formData: FormData) {
  const { supabase } = await getCurrentUser();
  const groupId = requireString(formData, "groupId");
  const email = requireString(formData, "email").toLowerCase();

  const { data: invitedUser, error: invitedUserError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (invitedUserError || !invitedUser) {
    throw new Error("That friend needs to sign in once before they can be added.");
  }

  const { error } = await supabase.from("group_members").upsert(
    {
      group_id: groupId,
      user_id: invitedUser.id,
      role: "member"
    },
    { onConflict: "group_id,user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/groups/${groupId}`);
}

export async function addExpense(formData: FormData) {
  const { supabase, user } = await getCurrentUser();
  const groupId = requireString(formData, "groupId");
  const description = requireString(formData, "description");
  const payerId = requireString(formData, "payerId");
  const amount = parseAmount(formData.get("amount"));
  const category = (formData.get("category")?.toString() ?? "General").trim() || "General";
  const paidAt = (formData.get("paidAt")?.toString() ?? new Date().toISOString().slice(0, 10)).trim();
  const splitMethod = formData.get("splitMethod") === "custom" ? "custom" : "equal";
  const participantIds = formData
    .getAll("participantIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  if (participantIds.length === 0) {
    throw new Error("Choose at least one person to split with.");
  }

  const splits =
    splitMethod === "equal"
      ? splitEvenly(amount, participantIds)
      : participantIds.map((userId) => ({
          user_id: userId,
          amount_owed: parseAmount(formData.get(`custom-${userId}`))
        }));

  const splitTotal = splits.reduce((sum, split) => sum + toCents(split.amount_owed), 0);
  if (splitTotal !== toCents(amount)) {
    throw new Error("Custom split amounts must add up to the expense total.");
  }

  const expenseId = crypto.randomUUID();
  const { error: expenseError } = await supabase.from("expenses").insert({
    id: expenseId,
    group_id: groupId,
    payer_id: payerId,
    amount,
    description,
    category,
    split_method: splitMethod,
    paid_at: paidAt,
    created_by: user.id
  });

  if (expenseError) {
    throw new Error(expenseError.message);
  }

  const { error: splitError } = await supabase.from("splits").insert(
    splits.map((split) => ({
      expense_id: expenseId,
      ...split
    }))
  );

  if (splitError) {
    await supabase.from("expenses").delete().eq("id", expenseId);
    throw new Error(splitError.message);
  }

  revalidatePath(`/groups/${groupId}`);
}

export async function deleteExpense(formData: FormData) {
  const { supabase } = await getCurrentUser();
  const groupId = requireString(formData, "groupId");
  const expenseId = requireString(formData, "expenseId");

  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/groups/${groupId}`);
}

export async function recordSettlement(formData: FormData) {
  const { supabase, user } = await getCurrentUser();
  const groupId = requireString(formData, "groupId");
  const payerId = requireString(formData, "payerId");
  const receiverId = requireString(formData, "receiverId");
  const amount = parseAmount(formData.get("amount"));
  const note = (formData.get("note")?.toString() ?? "").trim() || null;

  const { error } = await supabase.from("settlements").insert({
    group_id: groupId,
    payer_id: payerId,
    receiver_id: receiverId,
    amount,
    note,
    created_by: user.id
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/groups/${groupId}`);
}
