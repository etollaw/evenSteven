import Link from "next/link";
import { Plus, Settings, Receipt, ArrowLeftRight, Users, FileDown } from "lucide-react";
import { loadGroupBundle } from "@/lib/group-data";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BalanceList, SettleUpList } from "@/components/BalanceList";
import { formatMoney, relativeDate, categoryFor } from "@/lib/utils";
import { ExpenseRow } from "@/components/ExpenseRow";
import { computeNetBalances } from "@/lib/optimizer";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const bundle = await loadGroupBundle(id);
    return { title: bundle.group.name };
  } catch {
    return { title: "Group" };
  }
}

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await loadGroupBundle(id);
  const { group, members, expenses, settlements, currentUserId } = bundle;

  const optimizerInput = expenses.map((e) => ({
    payerId: e.payer_id,
    amount: e.amount,
    splits: e.splits.map((s) => ({ userId: s.user_id, amountOwed: s.amount_owed })),
  }));
  const settlementsInput = settlements.map((s) => ({ fromUser: s.from_user, toUser: s.to_user, amount: s.amount }));
  const memberObjs = members.map((m) => ({ id: m.id, name: m.name, avatarUrl: m.avatar_url }));

  const totalSpent = expenses.reduce((a, e) => a + Number(e.amount), 0);
  const userBalanceCents = computeNetBalances(memberObjs, optimizerInput, settlementsInput).get(currentUserId) ?? 0;
  const userBalance = userBalanceCents / 100;

  // Merge expense and settlement activity for the recent activity feed
  type Activity =
    | { kind: "expense"; date: string; data: typeof expenses[number] }
    | { kind: "settlement"; date: string; data: typeof settlements[number] };
  const activity: Activity[] = [
    ...expenses.map((e) => ({ kind: "expense" as const, date: e.occurred_at, data: e })),
    ...settlements.map((s) => ({ kind: "settlement" as const, date: s.created_at, data: s })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[color:var(--muted)] text-2xl">
            {group.emoji || "✨"}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
            {group.description ? (
              <p className="mt-1 max-w-xl text-sm text-[color:var(--muted-foreground)]">{group.description}</p>
            ) : null}
            <div className="mt-2 flex items-center gap-3 text-xs text-[color:var(--muted-foreground)]">
              <span>{formatMoney(totalSpent, group.currency)} total</span>
              <span>·</span>
              <span>{members.length} member{members.length === 1 ? "" : "s"}</span>
              <span>·</span>
              <span>{expenses.length} expense{expenses.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button as="link" variant="secondary" href={`/groups/${group.id}/settle`}>
            <ArrowLeftRight className="h-4 w-4" /> Settle up
          </Button>
          <Button as="link" href={`/groups/${group.id}/expenses/new`}>
            <Plus className="h-4 w-4" /> Add expense
          </Button>
          <Button as="link" variant="ghost" href={`/groups/${group.id}/settings`} size="icon" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className={`rounded-2xl border p-4 ${
          userBalance > 0.005
            ? "border-[color:var(--success)] bg-[color:color-mix(in_oklab,var(--success)_8%,transparent)]"
            : userBalance < -0.005
              ? "border-[color:var(--destructive)] bg-[color:color-mix(in_oklab,var(--destructive)_8%,transparent)]"
              : "border-[color:var(--border)] bg-[color:var(--muted)]"
        }`}
      >
        <p className="text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">Your balance in this group</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">
          {userBalance > 0.005
            ? `You're owed ${formatMoney(userBalance, group.currency)}`
            : userBalance < -0.005
              ? `You owe ${formatMoney(Math.abs(userBalance), group.currency)}`
              : "You're settled up"}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <CardTitle>Activity</CardTitle>
                <CardDescription>All expenses and settlements in this group.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button as="link" variant="ghost" size="sm" href={`/api/groups/${group.id}/export`}>
                  <FileDown className="h-4 w-4" /> Export CSV
                </Button>
              </div>
            </div>
            {activity.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[color:var(--border)] p-6 text-center">
                <Receipt className="mx-auto h-6 w-6 text-[color:var(--muted-foreground)]" />
                <p className="mt-3 text-sm">No expenses yet — log your first one to see the magic.</p>
                <Button as="link" className="mt-3" href={`/groups/${group.id}/expenses/new`}>
                  <Plus className="h-4 w-4" /> Add expense
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-[color:var(--border)]">
                {activity.map((item) => {
                  if (item.kind === "expense") {
                    const e = item.data;
                    const payer = memberMap.get(e.payer_id);
                    const yourSplit = e.splits.find((s) => s.user_id === currentUserId)?.amount_owed ?? 0;
                    return (
                      <li key={`e-${e.id}`} className="py-3">
                        <Link
                          href={`/groups/${group.id}/expenses/${e.id}`}
                          className="flex items-center justify-between gap-3 rounded-lg p-2 -mx-2 hover:bg-[color:var(--muted)]"
                        >
                          <ExpenseRow
                            description={e.description}
                            category={e.category ?? "general"}
                            currency={e.currency}
                            amount={e.amount}
                            payerName={payer?.name ?? "Unknown"}
                            payerId={payer?.id ?? "?"}
                            payerAvatar={payer?.avatar_url ?? null}
                            occurredAt={e.occurred_at}
                            participantCount={e.splits.length}
                            yourShare={yourSplit}
                            isYouPayer={e.payer_id === currentUserId}
                          />
                        </Link>
                      </li>
                    );
                  } else {
                    const s = item.data;
                    const from = memberMap.get(s.from_user);
                    const to = memberMap.get(s.to_user);
                    return (
                      <li key={`s-${s.id}`} className="py-3">
                        <div className="flex items-center justify-between gap-3 rounded-lg p-2 -mx-2">
                          <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--accent)] text-lg">💸</span>
                            <div>
                              <p className="text-sm font-medium">
                                {from?.name ?? "Someone"} paid {to?.name ?? "someone"}
                              </p>
                              <p className="text-xs text-[color:var(--muted-foreground)]">
                                Settlement · {relativeDate(s.created_at)}
                                {s.note ? ` · ${s.note}` : ""}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-[color:var(--success)]">
                            {formatMoney(s.amount, group.currency)}
                          </span>
                        </div>
                      </li>
                    );
                  }
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <CardTitle>Balances</CardTitle>
            </div>
            <BalanceList
              members={memberObjs}
              expenses={optimizerInput}
              settlements={settlementsInput}
              currency={group.currency}
              currentUserId={currentUserId}
            />
          </Card>

          <Card>
            <div className="mb-2 flex items-center justify-between">
              <CardTitle>Suggested payments</CardTitle>
              <Button as="link" variant="ghost" size="sm" href={`/groups/${group.id}/settle`}>Open</Button>
            </div>
            <CardDescription>Fewest payments to settle up everyone.</CardDescription>
            <div className="mt-3">
              <SettleUpList
                members={memberObjs}
                expenses={optimizerInput}
                settlements={settlementsInput}
                currency={group.currency}
                currentUserId={currentUserId}
              />
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[color:var(--muted-foreground)]" />
                <CardTitle>Members</CardTitle>
              </div>
              <AvatarStack people={members} size={24} />
            </div>
            <ul className="divide-y divide-[color:var(--border)]">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar id={m.id} name={m.name} src={m.avatar_url} size={26} />
                    <span className="truncate text-sm font-medium">{m.name}</span>
                    {m.role === "owner" && <span className="chip chip-neutral">Owner</span>}
                    {m.id === currentUserId && <span className="text-xs text-[color:var(--muted-foreground)]">(you)</span>}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <Button as="link" variant="secondary" size="sm" href={`/groups/${group.id}/settings`} className="w-full justify-center">
                Manage members & invites
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

void categoryFor;
