import { redirect } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";

import { signInWithGoogle } from "@/app/actions";
import { getOptionalUser } from "@/lib/data";
import { getSupabaseConfig } from "@/lib/env";

export default async function LoginPage() {
  const { isConfigured } = getSupabaseConfig();

  if (isConfigured) {
    const { user } = await getOptionalUser();
    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-7rem)] w-full max-w-5xl place-items-center px-5 py-10 sm:px-8">
      <section className="glass-card w-full max-w-xl rounded-[2rem] p-6 text-center sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-300 text-slate-950">
          <LockKeyhole className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-white">Welcome back.</h1>
        <p className="mt-3 text-slate-300">
          Sign in with Google to create groups, invite friends who have joined, and keep every tab synced through
          Supabase.
        </p>

        {!isConfigured ? (
          <div className="mt-8 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-5 text-left text-sm leading-6 text-amber-100">
            Supabase environment variables are missing. Copy <code>.env.example</code> to <code>.env.local</code> or set
            the same values in Vercel, then configure Google OAuth in Supabase Auth.
          </div>
        ) : (
          <form action={signInWithGoogle} className="mt-8">
            <button className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-4 font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-50">
              <LogIn className="h-5 w-5" />
              Continue with Google
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
