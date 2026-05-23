import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/env";
import { AppHeader } from "@/components/AppHeader";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!SUPABASE_CONFIGURED) {
    return <MissingEnvScreen />;
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.display_name ?? user.email?.split("@")[0] ?? "Friend";

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        user={{
          id: user.id,
          name,
          email: profile?.email ?? user.email ?? null,
          avatar_url: profile?.avatar_url ?? null,
        }}
      />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}

function MissingEnvScreen() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-md space-y-4">
        <p className="text-xs uppercase tracking-widest text-[color:var(--warning)]">
          Configuration needed
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Supabase isn&apos;t connected</h1>
        <p className="text-sm text-[color:var(--muted-foreground)]">
          Add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your Vercel project
          settings, then redeploy.
        </p>
        <Link href="/" className="btn btn-secondary">Back to landing</Link>
      </div>
    </main>
  );
}
