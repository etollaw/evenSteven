import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  HandCoins,
  Plus,
  Receipt,
  Trash2,
  UsersRound
} from "lucide-react";

import { addExpense, addGroupMember, deleteExpense, recordSettlement } from "@/app/actions";
import { calculateBalances, optimizeSettlements } from "@/lib/balances";
import { getGroupData } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import type { Balance, SettlementSuggestion } from "@/lib/balances";
import type { ExpenseWithDetails, Group, MemberWithProfile, SettlementWithProfiles, UserProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const { profile, group, members, expenses, settlements } = await getGroupData(groupId);
  const balances = calculateBalances(members, expenses, settlements);
  const suggestions = optimizeSettlements(balances);
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const totalSettled = settlements.reduce((sum, settlement) => sum + Number(settlement.amount), 0);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-6 sm:px-8">
      <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-100">
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <section className="glass-card rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-200">{group.currency} group tab</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">{group.name}</h1>
            <p className="mt-3 max-w-2xl text-slate-300">{group.description || "Add expenses and watch the debt map update."}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <HeroStat icon={<UsersRound className="h-5 w-5" />} label="Members" value={members.length} />
            <HeroStat icon={<Receipt className="h-5 w-5" />} label="Expenses" value={expenses.length} />
            <HeroStat icon={<CircleDollarSign className="h-5 w-5" />} label="Tracked" value={formatMoney(totalSpent, group.currency)} />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <BalanceBoard balances={balances} group={group} />
          <OptimizerPanel suggestions={suggestions} group={group} />
          <ExpenseHistory expenses={expenses} group={group} />
          <SettlementHistory settlements={settlements} group={group} totalSettled={totalSettled} />
        </div>

        <aside className="space-y-5">
          <MemberPanel members={members} groupId={group.id} />
          <ExpenseForm members={members} group={group} />
          <SettlementForm members={members} group={group} suggestions={suggestions} />
          <CurrentUserCard profile={profile} />
        </aside>
      </section>
    </main>
  );
}

function HeroStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-24 rounded-3xl bg-white/[0.07] p-4">
      <div className="text-cyan-200">{icon}</div>
      <p className="mt-3 text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-lg font-black text-white">{value}</p>
    </div>
  );
}

function BalanceBoard({ balances, group }: { balances: Balance[]; group: Group }) {
  return (
    <section className="glass-card rounded-[2rem] p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200">Net balances</p>
          <h2 className="mt-2 text-2xl font-black text-white">Who is owed and who owes</h2>
        </div>
        <HandCoins className="h-8 w-8 text-cyan-200" />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {balances.map((balance) => {
          const status =
            balance.net > 0.009 ? "is owed" : balance.net < -0.009 ? "owes" : "is even";
          const accent =
            balance.net > 0.009
              ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100"
              : balance.net < -0.009
                ? "border-rose-300/35 bg-rose-300/10 text-rose-100"
                : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";

          return (
            <div key={balance.user.id} className={`rounded-3xl border p-5 ${accent}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar user={balance.user} />
                  <div className="min-w-0">
                    <p className="truncate font-black text-white">{balance.user.name}</p>
                    <p className="text-sm opacity-80">{status}</p>
                  </div>
                </div>
                <p className="text-xl font-black">{formatMoney(Math.abs(balance.net), group.currency)}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-300">
                <span>Paid {formatMoney(balance.paid, group.currency)}</span>
                <span>Owed {formatMoney(balance.owed, group.currency)}</span>
                <span>Sent {formatMoney(balance.sent, group.currency)}</span>
                <span>Received {formatMoney(balance.received, group.currency)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function OptimizerPanel({ suggestions, group }: { suggestions: SettlementSuggestion[]; group: Group }) {
  return (
    <section className="glass-card rounded-[2rem] p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200">Settle up optimizer</p>
          <h2 className="mt-2 text-2xl font-black text-white">Fewest payments to zero out</h2>
        </div>
        <CheckCircle2 className="h-8 w-8 text-emerald-200" />
      </div>
      {suggestions.length === 0 ? (
        <div className="mt-5 rounded-3xl bg-emerald-300/10 p-5 text-emerald-100">
          Everyone is even. No payments needed.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={`${suggestion.from.id}-${suggestion.to.id}-${suggestion.amount}`}
              className="flex flex-col gap-3 rounded-3xl bg-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar user={suggestion.from} />
                <div>
                  <p className="font-black text-white">
                    {suggestion.from.name} pays {suggestion.to.name}
                  </p>
                  <p className="text-sm text-slate-400">Clears or reduces the largest outstanding balance.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ArrowRight className="hidden h-5 w-5 text-cyan-200 sm:block" />
                <p className="text-xl font-black text-cyan-100">{formatMoney(suggestion.amount, group.currency)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MemberPanel({ members, groupId }: { members: MemberWithProfile[]; groupId: string }) {
  return (
    <section className="glass-card rounded-[2rem] p-6">
      <div className="flex items-center gap-3">
        <UsersRound className="h-5 w-5 text-cyan-200" />
        <h2 className="text-xl font-black text-white">Members</h2>
      </div>
      <div className="mt-5 space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between rounded-2xl bg-white/[0.06] p-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar user={member.user} />
              <div className="min-w-0">
                <p className="truncate font-bold text-white">{member.user.name}</p>
                <p className="truncate text-xs text-slate-400">{member.user.email}</p>
              </div>
            </div>
            <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[0.65rem] font-black uppercase text-cyan-100">
              {member.role}
            </span>
          </div>
        ))}
      </div>
      <form action={addGroupMember} className="mt-5 space-y-3">
        <input type="hidden" name="groupId" value={groupId} />
        <label className="text-sm font-bold text-slate-300" htmlFor="member-email">
          Add by email
        </label>
        <input
          id="member-email"
          name="email"
          type="email"
          required
          placeholder="friend@example.com"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200"
        />
        <button className="w-full rounded-full bg-white px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-50">
          Add friend
        </button>
      </form>
    </section>
  );
}

function ExpenseForm({ members, group }: { members: MemberWithProfile[]; group: Group }) {
  return (
    <section className="glass-card rounded-[2rem] p-6">
      <div className="flex items-center gap-3">
        <Plus className="h-5 w-5 text-cyan-200" />
        <h2 className="text-xl font-black text-white">Add expense</h2>
      </div>
      <form action={addExpense} className="mt-5 space-y-4">
        <input type="hidden" name="groupId" value={group.id} />
        <Input label="Description" name="description" placeholder="Dinner, rideshare, groceries" required />
        <div className="grid grid-cols-2 gap-3">
          <Input label={`Amount (${group.currency})`} name="amount" type="number" step="0.01" min="0.01" placeholder="50.00" required />
          <Input label="Paid on" name="paidAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-300" htmlFor="payerId">
            Paid by
          </label>
          <select
            id="payerId"
            name="payerId"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-200"
          >
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.user.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-bold text-slate-300" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue="General"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-200"
            >
              {["General", "Food", "Drinks", "Travel", "Lodging", "Utilities", "Entertainment"].map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-300" htmlFor="splitMethod">
              Split mode
            </label>
            <select
              id="splitMethod"
              name="splitMethod"
              defaultValue="equal"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-200"
            >
              <option value="equal">Equal</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-300">Split with</p>
          <div className="mt-2 space-y-2">
            {members.map((member) => (
              <label key={member.user_id} className="grid grid-cols-[1fr_6.5rem] items-center gap-2 rounded-2xl bg-white/[0.06] p-3">
                <span className="flex items-center gap-3 font-bold text-white">
                  <input name="participantIds" type="checkbox" value={member.user_id} defaultChecked className="h-4 w-4 accent-cyan-300" />
                  {member.user.name}
                </span>
                <input
                  name={`custom-${member.user_id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Custom"
                  className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-200"
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            For equal splits, custom fields are ignored. For custom splits, checked custom amounts must match the total.
          </p>
        </div>
        <button className="w-full rounded-full bg-cyan-300 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-200">
          Add expense
        </button>
      </form>
    </section>
  );
}

function SettlementForm({
  members,
  group,
  suggestions
}: {
  members: MemberWithProfile[];
  group: Group;
  suggestions: SettlementSuggestion[];
}) {
  return (
    <section className="glass-card rounded-[2rem] p-6">
      <div className="flex items-center gap-3">
        <HandCoins className="h-5 w-5 text-cyan-200" />
        <h2 className="text-xl font-black text-white">Record payment</h2>
      </div>
      {suggestions.slice(0, 2).map((suggestion) => (
        <form key={`${suggestion.from.id}-${suggestion.to.id}`} action={recordSettlement} className="mt-4 rounded-2xl bg-cyan-300/10 p-4">
          <input type="hidden" name="groupId" value={group.id} />
          <input type="hidden" name="payerId" value={suggestion.from.id} />
          <input type="hidden" name="receiverId" value={suggestion.to.id} />
          <input type="hidden" name="amount" value={suggestion.amount} />
          <input type="hidden" name="note" value="Recorded from optimizer suggestion" />
          <p className="text-sm font-bold text-cyan-100">
            {suggestion.from.name} paid {suggestion.to.name} {formatMoney(suggestion.amount, group.currency)}?
          </p>
          <button className="mt-3 w-full rounded-full bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950">
            Mark suggestion paid
          </button>
        </form>
      ))}
      <form action={recordSettlement} className="mt-5 space-y-3">
        <input type="hidden" name="groupId" value={group.id} />
        <div className="grid grid-cols-2 gap-3">
          <MemberSelect label="From" name="payerId" members={members} />
          <MemberSelect label="To" name="receiverId" members={members} />
        </div>
        <Input label={`Amount (${group.currency})`} name="amount" type="number" step="0.01" min="0.01" placeholder="25.00" required />
        <Input label="Note" name="note" placeholder="Venmo, cash, Zelle..." />
        <button className="w-full rounded-full bg-white px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-50">
          Record manual payment
        </button>
      </form>
    </section>
  );
}

function ExpenseHistory({ expenses, group }: { expenses: ExpenseWithDetails[]; group: Group }) {
  return (
    <section className="glass-card rounded-[2rem] p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200">Receipts</p>
          <h2 className="mt-2 text-2xl font-black text-white">Expense history</h2>
        </div>
        <Receipt className="h-8 w-8 text-cyan-200" />
      </div>
      <div className="mt-5 space-y-3">
        {expenses.length === 0 ? (
          <p className="rounded-3xl bg-white/[0.06] p-5 text-slate-300">No expenses yet. Add the first receipt.</p>
        ) : (
          expenses.map((expense) => (
            <article key={expense.id} className="rounded-3xl bg-white/[0.06] p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-white">{expense.description}</h3>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-cyan-100">{expense.category}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Paid by {expense.payer.name} on {format(new Date(`${expense.paid_at}T00:00:00`), "MMM d, yyyy")} · {expense.split_method} split
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-black text-cyan-100">{formatMoney(Number(expense.amount), group.currency)}</p>
                  <form action={deleteExpense}>
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="expenseId" value={expense.id} />
                    <button aria-label="Delete expense" className="rounded-full border border-white/10 p-2 text-slate-400 transition hover:border-rose-300/50 hover:text-rose-200">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {expense.splits.map((split) => (
                  <span key={split.id} className="rounded-full bg-slate-950/60 px-3 py-1 text-xs font-bold text-slate-300">
                    {split.user.name}: {formatMoney(Number(split.amount_owed), group.currency)}
                  </span>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function SettlementHistory({
  settlements,
  group,
  totalSettled
}: {
  settlements: SettlementWithProfiles[];
  group: Group;
  totalSettled: number;
}) {
  return (
    <section className="glass-card rounded-[2rem] p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200">Payments</p>
          <h2 className="mt-2 text-2xl font-black text-white">Settlements recorded</h2>
        </div>
        <p className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-cyan-100">
          {formatMoney(totalSettled, group.currency)}
        </p>
      </div>
      <div className="mt-5 space-y-3">
        {settlements.length === 0 ? (
          <p className="rounded-3xl bg-white/[0.06] p-5 text-slate-300">No settlement payments recorded yet.</p>
        ) : (
          settlements.map((settlement) => (
            <div key={settlement.id} className="rounded-3xl bg-white/[0.06] p-4">
              <p className="font-black text-white">
                {settlement.payer.name} paid {settlement.receiver.name} {formatMoney(Number(settlement.amount), group.currency)}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {format(new Date(settlement.settled_at), "MMM d, yyyy h:mm a")}
                {settlement.note ? ` · ${settlement.note}` : ""}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function CurrentUserCard({ profile }: { profile: UserProfile }) {
  return (
    <section className="glass-card rounded-[2rem] p-6">
      <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200">Signed in</p>
      <div className="mt-4 flex items-center gap-3">
        <Avatar user={profile} />
        <div className="min-w-0">
          <p className="truncate font-black text-white">{profile.name}</p>
          <p className="truncate text-sm text-slate-400">{profile.email}</p>
        </div>
      </div>
    </section>
  );
}

function Input({
  label,
  name,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-300" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200"
        {...props}
      />
    </div>
  );
}

function MemberSelect({ label, name, members }: { label: string; name: string; members: MemberWithProfile[] }) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-300" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-200"
      >
        {members.map((member) => (
          <option key={member.user_id} value={member.user_id}>
            {member.user.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Avatar({ user }: { user: UserProfile }) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 text-sm font-black text-slate-950">
      {initials || "?"}
    </span>
  );
}
