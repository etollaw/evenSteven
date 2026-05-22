"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function DeleteGroupButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handle() {
    const confirmation = window.prompt('Type "delete" to permanently delete this group');
    if (confirmation?.toLowerCase().trim() !== "delete") return;
    setDeleting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("groups").delete().eq("id", groupId);
      if (error) throw error;
      toast.success("Group deleted");
      router.push("/dashboard");
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
      <Trash2 className="h-4 w-4" /> Delete group
    </Button>
  );
}
