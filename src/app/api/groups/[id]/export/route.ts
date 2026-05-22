import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", _request.url));

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, currency")
    .eq("id", id)
    .maybeSingle();

  if (!group) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, description, amount, currency, category, payer_id, occurred_at, split_type, notes")
    .eq("group_id", id)
    .order("occurred_at", { ascending: true });

  const { data: splits } = await supabase
    .from("expense_splits")
    .select("expense_id, user_id, amount_owed, expenses!inner(group_id)")
    .eq("expenses.group_id", id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, email");

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id as string, (p.display_name as string) || (p.email as string) || "Unknown"]),
  );

  const splitsByExpense = new Map<string, { user_id: string; amount: number }[]>();
  (splits ?? []).forEach((s) => {
    const eid = s.expense_id as string;
    if (!splitsByExpense.has(eid)) splitsByExpense.set(eid, []);
    splitsByExpense.get(eid)!.push({ user_id: s.user_id as string, amount: Number(s.amount_owed) });
  });

  const header = [
    "Date",
    "Description",
    "Category",
    "Amount",
    "Currency",
    "Paid by",
    "Split type",
    "Participants",
    "Notes",
  ];

  const rows: string[] = [header.map(escapeCSV).join(",")];
  for (const e of expenses ?? []) {
    const parts = splitsByExpense.get(e.id as string) ?? [];
    const participants = parts
      .map((p) => `${nameById.get(p.user_id) ?? "Unknown"}: ${p.amount.toFixed(2)}`)
      .join("; ");
    rows.push(
      [
        new Date(e.occurred_at as string).toISOString().slice(0, 10),
        e.description,
        e.category,
        Number(e.amount).toFixed(2),
        e.currency,
        nameById.get(e.payer_id as string) ?? "Unknown",
        e.split_type,
        participants,
        e.notes ?? "",
      ]
        .map(escapeCSV)
        .join(","),
    );
  }

  const body = rows.join("\n");
  const filename = `${(group.name as string).replace(/[^a-z0-9-_]+/gi, "_")}-expenses.csv`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
