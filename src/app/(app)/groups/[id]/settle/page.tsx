import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { loadGroupBundle } from "@/lib/group-data";
import { SettleUpClient } from "./SettleUpClient";

export const metadata = { title: "Settle up" };

export default async function SettleUpPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await loadGroupBundle(id);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href={`/groups/${id}`} className="inline-flex items-center gap-1 text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]">
          <ChevronLeft className="h-3 w-3" /> Back to {bundle.group.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Settle up</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          The optimizer suggests the fewest payments. Tap a row to record one as paid.
        </p>
      </div>
      <SettleUpClient
        groupId={bundle.group.id}
        currency={bundle.group.currency}
        currentUserId={bundle.currentUserId}
        members={bundle.members.map((m) => ({ id: m.id, name: m.name, avatar_url: m.avatar_url }))}
        expenses={bundle.expenses.map((e) => ({
          payerId: e.payer_id,
          amount: e.amount,
          splits: e.splits.map((s) => ({ userId: s.user_id, amountOwed: s.amount_owed })),
        }))}
        settlements={bundle.settlements.map((s) => ({
          fromUser: s.from_user,
          toUser: s.to_user,
          amount: s.amount,
        }))}
      />
    </div>
  );
}
