import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadGroupBundle } from "@/lib/group-data";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { categoryFor, formatMoney, relativeDate } from "@/lib/utils";
import { ExpenseForm } from "@/components/ExpenseForm";
import { CommentsSection } from "@/components/CommentsSection";
import { DeleteExpenseButton } from "@/components/DeleteExpenseButton";

export const metadata = { title: "Expense" };

export default async function ExpenseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; expenseId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id, expenseId } = await params;
  const sp = await searchParams;
  const edit = sp.edit === "1";

  const bundle = await loadGroupBundle(id);
  const expense = bundle.expenses.find((e) => e.id === expenseId);
  if (!expense) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: commentsData } = await supabase
    .from("expense_comments")
    .select("id, expense_id, user_id, body, created_at")
    .eq("expense_id", expenseId)
    .order("created_at", { ascending: true });

  const memberMap = new Map(bundle.members.map((m) => [m.id, m]));
  const payer = memberMap.get(expense.payer_id);
  const cat = categoryFor(expense.category);

  if (edit) {
    if (expense.created_by !== bundle.currentUserId) {
      return (
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-[color:var(--destructive)]">
            Only the person who created this expense can edit it.
          </p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <Link href={`/groups/${id}/expenses/${expenseId}`} className="inline-flex items-center gap-1 text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]">
            <ChevronLeft className="h-3 w-3" /> Back to expense
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit expense</h1>
        </div>
        <ExpenseForm
          groupId={id}
          currency={bundle.group.currency}
          members={bundle.members.map((m) => ({ id: m.id, name: m.name, avatar_url: m.avatar_url }))}
          currentUserId={bundle.currentUserId}
          initial={{
            expenseId: expense.id,
            description: expense.description,
            amount: expense.amount,
            payerId: expense.payer_id,
            category: expense.category ?? "general",
            splitType: expense.split_type,
            notes: expense.notes,
            occurredAt: expense.occurred_at,
            splits: expense.splits.map((s) => ({
              userId: s.user_id,
              amountOwed: s.amount_owed,
              percentage: s.percentage,
              shares: s.shares,
            })),
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href={`/groups/${id}`} className="inline-flex items-center gap-1 text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]">
          <ChevronLeft className="h-3 w-3" /> Back to {bundle.group.name}
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[color:var(--muted)] text-2xl">{cat.emoji}</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{expense.description}</h1>
              <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                {cat.label} · {relativeDate(expense.occurred_at)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums">
              {formatMoney(expense.amount, expense.currency)}
            </p>
            <p className="text-xs text-[color:var(--muted-foreground)]">{expense.currency}</p>
          </div>
        </div>
      </div>

      <Card>
        <div className="mb-3 flex items-center gap-3">
          {payer && <Avatar id={payer.id} name={payer.name} src={payer.avatar_url} size={32} />}
          <div>
            <p className="text-sm">
              <span className="font-medium">{payer?.name ?? "Unknown"}</span> paid{" "}
              <span className="font-medium tabular-nums">{formatMoney(expense.amount, expense.currency)}</span>
            </p>
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Split {expense.split_type} between {expense.splits.length} people
            </p>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">Split</p>
          <ul className="mt-2 divide-y divide-[color:var(--border)]">
            {expense.splits.map((s) => {
              const u = memberMap.get(s.user_id);
              return (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {u && <Avatar id={u.id} name={u.name} src={u.avatar_url} size={24} />}
                    <span className="truncate text-sm">{u?.name ?? "Unknown"}</span>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {formatMoney(s.amount_owed, expense.currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        {expense.notes ? (
          <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-3">
            <p className="text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{expense.notes}</p>
          </div>
        ) : null}

        {expense.created_by === bundle.currentUserId && (
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Link href={`/groups/${id}/expenses/${expense.id}?edit=1`} className="btn btn-secondary">
              Edit
            </Link>
            <DeleteExpenseButton expenseId={expense.id} groupId={id} />
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Comments</CardTitle>
        <CardDescription>Discuss this expense with the group.</CardDescription>
        <div className="mt-3">
          <CommentsSection
            expenseId={expense.id}
            currentUserId={bundle.currentUserId}
            members={bundle.members.map((m) => ({ id: m.id, name: m.name, avatar_url: m.avatar_url }))}
            initial={(commentsData ?? []).map((c) => ({
              id: c.id as string,
              user_id: c.user_id as string,
              body: c.body as string,
              created_at: c.created_at as string,
            }))}
          />
        </div>
      </Card>
    </div>
  );
}
