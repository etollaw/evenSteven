import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "./LoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(800px 460px at 50% -10%, color-mix(in oklab, var(--primary) 22%, transparent), transparent)",
        }}
      />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[color:var(--primary)] text-[color:var(--primary-foreground)]">⚖️</span>
          <span>evenSteven</span>
        </Link>
        <ThemeToggle />
      </header>
      <section className="mx-auto flex max-w-md flex-col px-6 pb-16 pt-8">
        <div className="card p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Sign in to manage your shared expenses.
          </p>
          <Suspense fallback={<div className="mt-6 h-10 animate-pulse rounded-xl bg-[color:var(--muted)]" />}>
            <LoginForm />
          </Suspense>
          <p className="mt-6 text-xs text-[color:var(--muted-foreground)]">
            By continuing you agree to our friendly terms: don&apos;t be a jerk to your friends about money.
          </p>
        </div>
      </section>
    </main>
  );
}
