"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function DeleteExpenseButton({ expenseId, groupId }: { expenseId: string; groupId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handle() {
    if (!window.confirm("Delete this expense? This can't be undone.")) return;
    setDeleting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
      if (error) throw error;
      toast.success("Expense deleted");
      router.push(`/groups/${groupId}`);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button variant="destructive" onClick={handle} loading={deleting}>
      <Trash2 className="h-4 w-4" /> Delete
    </Button>
  );
}
