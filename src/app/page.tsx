import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers3, ShieldCheck, Sparkles } from "lucide-react";

import { getSupabaseConfig } from "@/lib/env";

const features = [
  "Google OAuth with Supabase Auth",
  "Groups, members, expenses, splits, and settlements",
  "Equal and custom split modes",
  "Net-balance math with optimized settle-up instructions",
  "Mobile-first glass UI ready for Vercel"
];

export default function Home() {
  const { isConfigured } = getSupabaseConfig();

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:pt-16">
      <section className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100">
            <Sparkles className="h-4 w-4" />
            The debt optimizer for friend groups
          </div>
          <h1 className="max-w-4xl text-balance text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            Track the tab, split the chaos, settle in the fewest moves.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            EvenSteven is a polished IOU tracker for trips, roommates, dinners, and group projects. Add expenses,
            see who is up or down, and generate a clean payment plan that clears the whole group.
          </p>
          {!isConfigured ? (
            <div className="mt-8 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-5 text-sm leading-6 text-amber-100">
              Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel or
              <code> .env.local</code> before signing in.
            </div>
          ) : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 py-3 font-black text-slate-950 shadow-xl shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:bg-cyan-200"
            >
              Open dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 font-bold text-white transition hover:bg-white/10"
            >
              Sign in with Google
            </Link>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-5 sm:p-7">
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-200">Weekend Trip</p>
                <h2 className="mt-2 text-2xl font-black text-white">$1,248.80 tracked</h2>
              </div>
              <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-200">
                <ShieldCheck className="h-7 w-7" />
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                ["Alex paid dinner", "+$184.20", "text-emerald-200"],
                ["Ben owes the group", "-$92.10", "text-rose-200"],
                ["Charlie settled gas", "$38.00", "text-cyan-200"]
              ].map(([label, amount, color]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl bg-white/[0.06] p-4">
                  <span className="font-semibold text-slate-200">{label}</span>
                  <span className={`font-black ${color}`}>{amount}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-cyan-300 p-5 text-slate-950">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em]">
                <Layers3 className="h-4 w-4" />
                Optimized plan
              </div>
              <p className="mt-3 text-2xl font-black">Ben pays Alex $92.10</p>
              <p className="mt-1 text-sm font-bold text-slate-700">One payment instead of three confusing Venmo asks.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {features.map((feature) => (
          <div key={feature} className="glass-card rounded-3xl p-5">
            <CheckCircle2 className="mb-4 h-6 w-6 text-cyan-200" />
            <p className="text-sm font-bold leading-6 text-slate-100">{feature}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
