"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";

type Props = {
  user: { id: string; name: string; email: string | null; avatar_url: string | null };
};

export function AppHeader({ user }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border)] glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[color:var(--primary)] text-[color:var(--primary-foreground)]">⚖️</span>
          <span>evenSteven</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          <Link href="/dashboard" className="btn btn-ghost">Dashboard</Link>
          <Link href="/groups/new" className="btn btn-ghost">New group</Link>
          <Link href="/join" className="btn btn-ghost">Join group</Link>
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          <div className="relative">
            <UserMenu user={user} />
          </div>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="btn btn-ghost h-9 w-9 p-0 sm:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="sm:hidden border-t border-[color:var(--border)] bg-[color:var(--card)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar id={user.id} name={user.name} src={user.avatar_url} size={36} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-[color:var(--muted-foreground)]">{user.email}</span>
                </div>
              </div>
              <ThemeToggle />
            </div>
            <div className="mt-2 flex flex-col gap-1">
              <Link href="/dashboard" onClick={() => setOpen(false)} className="btn btn-ghost justify-start">Dashboard</Link>
              <Link href="/groups/new" onClick={() => setOpen(false)} className="btn btn-ghost justify-start">New group</Link>
              <Link href="/join" onClick={() => setOpen(false)} className="btn btn-ghost justify-start">Join group</Link>
              <form action="/auth/signout" method="post">
                <Button type="submit" variant="ghost" className="w-full justify-start">
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function UserMenu({ user }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full p-0.5 hover:bg-[color:var(--muted)]"
        aria-label="User menu"
      >
        <Avatar id={user.id} name={user.name} src={user.avatar_url} size={32} />
      </button>
      {open && (
        <>
          <button
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg">
            <div className="border-b border-[color:var(--border)] px-3 py-3">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-[color:var(--muted-foreground)]">{user.email}</p>
            </div>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" className="w-full justify-start rounded-none">
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
