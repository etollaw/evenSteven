"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Inputs";

export default function LoginForm() {
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", redirect);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callback.toString(),
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Magic link sent — check your inbox.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send magic link";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", redirect);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callback.toString(),
        },
      });
      if (error) throw error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to sign in with Google";
      toast.error(msg);
      setGoogleLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-4 text-sm">
        <p className="font-medium">Check your email</p>
        <p className="mt-1 text-[color:var(--muted-foreground)]">
          We sent a magic link to <span className="font-mono">{email}</span>. Open it on this device
          to finish signing in.
        </p>
        <button
          type="button"
          className="mt-3 text-xs underline"
          onClick={() => setSent(false)}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <Button
        variant="secondary"
        className="w-full justify-center"
        onClick={signInWithGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </Button>

      <div className="relative flex items-center">
        <div className="h-px flex-1 bg-[color:var(--border)]" />
        <span className="px-3 text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">or</span>
        <div className="h-px flex-1 bg-[color:var(--border)]" />
      </div>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full justify-center" loading={sending} disabled={!email || sending}>
          <Mail className="h-4 w-4" /> Send magic link
        </Button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.12A6.6 6.6 0 0 1 5.49 12c0-.74.13-1.46.35-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.78.43 3.47 1.18 4.96l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.4c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.07 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.33 9.14 5.4 12 5.4z"/>
    </svg>
  );
}
