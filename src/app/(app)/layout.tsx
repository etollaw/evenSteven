import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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
