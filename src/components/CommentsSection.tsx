"use client";

import { useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Inputs";
import { relativeDate } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Comment = { id: string; user_id: string; body: string; created_at: string };

export function CommentsSection({
  expenseId,
  currentUserId,
  members,
  initial,
}: {
  expenseId: string;
  currentUserId: string;
  members: { id: string; name: string; avatar_url: string | null }[];
  initial: Comment[];
}) {
  const [comments, setComments] = useState<Comment[]>(initial);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const userMap = new Map(members.map((m) => [m.id, m]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("expense_comments")
        .insert({ expense_id: expenseId, user_id: currentUserId, body: body.trim() })
        .select("id, user_id, body, created_at")
        .single();
      if (error) throw error;
      setComments((prev) => [...prev, data as Comment]);
      setBody("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to post comment";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    const prev = comments;
    setComments((c) => c.filter((x) => x.id !== id));
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("expense_comments").delete().eq("id", id);
      if (error) throw error;
    } catch (err) {
      setComments(prev);
      const msg = err instanceof Error ? err.message : "Failed to delete comment";
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {comments.length === 0 ? (
          <li className="rounded-xl border border-dashed border-[color:var(--border)] p-4 text-center text-xs text-[color:var(--muted-foreground)]">
            No comments yet — be the first.
          </li>
        ) : (
          comments.map((c) => {
            const u = userMap.get(c.user_id);
            return (
              <li key={c.id} className="flex items-start gap-3">
                {u ? (
                  <Avatar id={u.id} name={u.name} src={u.avatar_url} size={28} />
                ) : (
                  <Avatar id={c.user_id} name="?" size={28} />
                )}
                <div className="flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs">
                      <span className="font-medium">{u?.name ?? "Someone"}</span>{" "}
                      <span className="text-[color:var(--muted-foreground)]">· {relativeDate(c.created_at)}</span>
                    </p>
                    {c.user_id === currentUserId && (
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        className="text-[color:var(--muted-foreground)] hover:text-[color:var(--destructive)]"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
                </div>
              </li>
            );
          })
        )}
      </ul>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Textarea
          rows={2}
          placeholder="Write a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" loading={sending} disabled={!body.trim()}>
          <Send className="h-4 w-4" /> Post
        </Button>
      </form>
    </div>
  );
}
