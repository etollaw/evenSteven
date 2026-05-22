import { Suspense } from "react";
import { JoinForm } from "./JoinForm";

export const metadata = { title: "Join a group" };

export default function JoinPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Join a group</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Paste an invite code or use a link your friend shared.
        </p>
      </div>
      <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[color:var(--muted)]" />}>
        <JoinForm />
      </Suspense>
    </div>
  );
}
