"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-sm uppercase tracking-widest text-[color:var(--destructive)]">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">We hit a snag</h1>
        <p className="mt-2 max-w-md text-sm text-[color:var(--muted-foreground)]">
          {error?.message || "An unexpected error occurred."}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => reset()}>Try again</Button>
          <Link className="btn btn-secondary" href="/dashboard">Go home</Link>
        </div>
      </div>
    </main>
  );
}
