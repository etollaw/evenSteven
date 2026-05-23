import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // Honor an explicit ?next= override if present, but default to /dashboard.
  // Client-side post-login redirects are stored in sessionStorage and read on /dashboard.
  const next = url.searchParams.get("next") || "/dashboard";

  if (!code) {
    // Nothing to exchange — bounce home so the user can re-initiate.
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const errUrl = new URL("/login", request.url);
    errUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(errUrl);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
