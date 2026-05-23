import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Banknote, Calculator, Sparkles, Users } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type PageProps = {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string; next?: string }>;
};

export default async function Home({ searchParams }: PageProps) {
  const sp = await searchParams;

  // Self-healing OAuth fallback: if Supabase fell back to the project's Site URL
  // (because the production /auth/callback wasn't on the Redirect URL allow-list)
  // we still complete the exchange instead of leaving the user stuck on the
  // landing page with ?code=... hanging in the URL.
  if (sp.code) {
    const target = new URL("/auth/callback", "http://placeholder");
    target.searchParams.set("code", sp.code);
    if (sp.next) target.searchParams.set("next", sp.next);
    redirect(target.pathname + target.search);
  }
  if (sp.error) {
    const target = new URL("/login", "http://placeholder");
    target.searchParams.set("error", sp.error_description || sp.error);
    redirect(target.pathname + target.search);
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 500px at 80% -10%, color-mix(in oklab, var(--primary) 22%, transparent), transparent), radial-gradient(700px 400px at -10% 30%, color-mix(in oklab, #8b5cf6 18%, transparent), transparent)",
        }}
      />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow">⚖️</span>
          <span>evenSteven</span>
        </Link>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn btn-ghost">Log in</Link>
          <Link href="/login" className="btn btn-primary">Get started <ArrowRight className="h-4 w-4" /></Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-14 pb-20 text-center">
        <span className="chip mx-auto mb-5">
          <Sparkles className="h-3 w-3" /> Now in beta
        </span>
        <h1 className="mx-auto max-w-3xl text-balance text-5xl font-bold tracking-tight sm:text-6xl">
          Split bills with friends.
          <br />
          <span className="bg-gradient-to-r from-teal-500 to-violet-500 bg-clip-text text-transparent">
            Settle up in the fewest payments.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-[color:var(--muted-foreground)]">
          A delightfully simple IOU tracker for trips, roommates, and dinner crews. Log a
          receipt, choose how to split it, and let the optimizer minimize the cash flow.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className="btn btn-primary btn-lg" style={{ padding: "0.75rem 1.25rem" }}>
            Start splitting <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#features" className="btn btn-secondary" style={{ padding: "0.75rem 1.25rem" }}>
            See features
          </a>
        </div>
      </section>

      <section id="features" className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        <Feature
          icon={<Users className="h-5 w-5" />}
          title="Group expenses"
          body="Create a group for a trip, your apartment, or your friend crew. Invite friends with a single link."
        />
        <Feature
          icon={<Banknote className="h-5 w-5" />}
          title="Flexible splits"
          body="Split equally, by exact amounts, by percentages, or by shares. Cents are distributed exactly."
        />
        <Feature
          icon={<Calculator className="h-5 w-5" />}
          title="Settle-up optimizer"
          body="A greedy min-cash-flow algorithm produces the fewest possible payments to clear everyone’s debts."
        />
        <Feature
          icon={<span className="text-base">💬</span>}
          title="Comments & notes"
          body="Add notes to expenses, comment on receipts, and keep your group's history searchable."
        />
        <Feature
          icon={<span className="text-base">📦</span>}
          title="CSV export"
          body="Download a full expense history of any group as CSV for your records or taxes."
        />
        <Feature
          icon={<span className="text-base">🌗</span>}
          title="Dark mode + mobile"
          body="Looks great on any device. Built with Tailwind v4 and a delightful, accessible UI."
        />
      </section>

      <footer className="border-t border-[color:var(--border)] py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-[color:var(--muted-foreground)]">
          <span>© {new Date().getFullYear()} evenSteven</span>
          <span>Built with Next.js, Supabase, and Tailwind v4</span>
        </div>
      </footer>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card flex gap-3 p-5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color:var(--muted)] text-[color:var(--foreground)]">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">{body}</p>
      </div>
    </div>
  );
}
