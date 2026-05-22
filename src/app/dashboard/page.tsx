import Link from "next/link";
import { CalendarDays, CircleDollarSign, Plus, Settings2, UsersRound } from "lucide-react";

import { createGroup, updateProfile } from "@/app/actions";
import { getDashboardData } from "@/lib/data";
import { getSupabaseConfig } from "@/lib/env";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return <SetupMissing />;
  }

  const { profile, groups } = await getDashboardData();
  const totalTracked = groups.reduce((sum, group) => sum + group.total_spend, 0);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-6 sm:px-8">
      <section className="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <div className="glass-card rounded-[2rem] p-6 sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-200">Dashboard</p>
          <div className="mt-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Hey, {profile.name}.</h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Create a tab, add your friends, log expenses, and let the optimizer turn messy balances into a short
                settle-up list.
              </p>
            </div>
            <div className="rounded-3xl bg-cyan-300 p-5 text-slate-950">
              <p className="text-sm font-black uppercase tracking-[0.2em]">Tracked</p>
              <p className="mt-1 text-3xl font-black">{formatMoney(totalTracked)}</p>
            </div>
          </div>
        </div>

        <form action={updateProfile} className="glass-card rounded-[2rem] p-6">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-cyan-200" />
            <h2 className="text-xl font-black text-white">Profile</h2>
          </div>
          <label className="mt-5 block text-sm font-bold text-slate-300" htmlFor="name">
            Display name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={profile.name}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200"
          />
          <button className="mt-4 w-full rounded-full bg-white px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-50">
            Save profile
          </button>
        </form>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[24rem_1fr]">
        <form action={createGroup} className="glass-card rounded-[2rem] p-6">
          <div className="flex items-center gap-3">
            <Plus className="h-5 w-5 text-cyan-200" />
            <h2 className="text-xl font-black text-white">Create group</h2>
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-300" htmlFor="group-name">
                Group name
              </label>
              <input
                id="group-name"
                name="name"
                required
                placeholder="Weekend Trip"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-300" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Cabin, groceries, gas, dinners..."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-300" htmlFor="currency">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                defaultValue="USD"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-200"
              >
                <option>USD</option>
                <option>CAD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>AUD</option>
              </select>
            </div>
          </div>
          <button className="mt-5 w-full rounded-full bg-cyan-300 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-200">
            Start a tab
          </button>
        </form>

        <div className="grid gap-4 sm:grid-cols-2">
          {groups.length === 0 ? (
            <div className="glass-card rounded-[2rem] p-8 sm:col-span-2">
              <h2 className="text-2xl font-black text-white">No groups yet</h2>
              <p className="mt-2 text-slate-300">Create your first group and EvenSteven will handle the math.</p>
            </div>
          ) : (
            groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="glass-card group rounded-[2rem] p-6 transition hover:-translate-y-1 hover:border-cyan-200/60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-white">{group.name}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                      {group.description || "No description yet."}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-cyan-100">
                    {group.currency}
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <Stat icon={<UsersRound className="h-4 w-4" />} label="Members" value={group.member_count} />
                  <Stat icon={<CalendarDays className="h-4 w-4" />} label="Expenses" value={group.expense_count} />
                  <Stat
                    icon={<CircleDollarSign className="h-4 w-4" />}
                    label="Total"
                    value={formatMoney(group.total_spend, group.currency)}
                  />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-3">
      <div className="mb-2 text-cyan-200">{icon}</div>
      <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function SetupMissing() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-7rem)] w-full max-w-3xl place-items-center px-5 py-10 sm:px-8">
      <section className="glass-card rounded-[2rem] p-8">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-200">Setup required</p>
        <h1 className="mt-4 text-4xl font-black text-white">Connect Supabase env vars.</h1>
        <p className="mt-4 leading-7 text-slate-300">
          Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> locally or in Vercel,
          then run the migration in <code>supabase/migrations</code>.
        </p>
      </section>
    </main>
  );
}
