import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { loadGroupBundle } from "@/lib/group-data";
import { ExpenseForm } from "@/components/ExpenseForm";

export const metadata = { title: "Add expense" };

export default async function NewExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await loadGroupBundle(id);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href={`/groups/${id}`} className="inline-flex items-center gap-1 text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]">
          <ChevronLeft className="h-3 w-3" /> Back to {bundle.group.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Add an expense</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Log a receipt, pick who&apos;s involved, and choose how to split it.
        </p>
      </div>
      <ExpenseForm
        groupId={bundle.group.id}
        currency={bundle.group.currency}
        members={bundle.members.map((m) => ({ id: m.id, name: m.name, avatar_url: m.avatar_url }))}
        currentUserId={bundle.currentUserId}
      />
    </div>
  );
}
