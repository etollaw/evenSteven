"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, LinkIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Inputs";
import { randomInviteCode, relativeDate } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Group = { id: string; name: string; description: string; emoji: string; currency: string };
type Member = { id: string; name: string; email: string | null; avatar_url: string | null; role: "owner" | "member" };
type Invite = {
  id: string;
  code: string;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
};

export function GroupSettingsForms({
  group,
  members,
  currentUserId,
  isOwner,
  invites,
}: {
  group: Group;
  members: Member[];
  currentUserId: string;
  isOwner: boolean;
  invites: Invite[];
}) {
  return (
    <div className="space-y-4">
      <DetailsCard group={group} isOwner={isOwner} />
      <MembersCard members={members} groupId={group.id} currentUserId={currentUserId} isOwner={isOwner} />
      <InvitesCard groupId={group.id} invites={invites} />
    </div>
  );
}

function DetailsCard({ group, isOwner }: { group: Group; isOwner: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(group.name);
  const [emoji, setEmoji] = useState(group.emoji);
  const [description, setDescription] = useState(group.description);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("groups")
        .update({ name: name.trim(), emoji, description: description.trim() || null })
        .eq("id", group.id);
      if (error) throw error;
      toast.success("Group updated");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardTitle>Details</CardTitle>
      <CardDescription>Update the group name, icon, and description.</CardDescription>
      <form className="mt-3 space-y-3" onSubmit={save}>
        <div className="grid gap-3 sm:grid-cols-[88px_1fr]">
          <Field label="Icon">
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
              className="text-center text-xl"
              disabled={!isOwner}
            />
          </Field>
          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              disabled={!isOwner}
            />
          </Field>
        </div>
        <Field label="Description">
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isOwner}
          />
        </Field>
        {isOwner && (
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        )}
      </form>
    </Card>
  );
}

function MembersCard({
  members,
  groupId,
  currentUserId,
  isOwner,
}: {
  members: Member[];
  groupId: string;
  currentUserId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);

  async function remove(userId: string) {
    if (!window.confirm("Remove this member from the group?")) return;
    setRemoving(userId);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);
      if (error) throw error;
      toast.success("Removed");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove";
      toast.error(msg);
    } finally {
      setRemoving(null);
    }
  }

  async function leave() {
    if (!window.confirm("Leave this group?")) return;
    setRemoving(currentUserId);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", currentUserId);
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to leave";
      toast.error(msg);
      setRemoving(null);
    }
  }

  return (
    <Card>
      <CardTitle>Members</CardTitle>
      <CardDescription>People in this group.</CardDescription>
      <ul className="mt-3 divide-y divide-[color:var(--border)]">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between py-2">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar id={m.id} name={m.name} src={m.avatar_url} size={32} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {m.name}{m.id === currentUserId ? <span className="ml-1 text-[color:var(--muted-foreground)]">(you)</span> : null}
                </p>
                <p className="truncate text-xs text-[color:var(--muted-foreground)]">{m.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="chip chip-neutral">{m.role}</span>
              {m.id === currentUserId && m.role !== "owner" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={leave}
                  loading={removing === m.id}
                >
                  Leave
                </Button>
              ) : null}
              {isOwner && m.id !== currentUserId ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(m.id)}
                  loading={removing === m.id}
                  aria-label={`Remove ${m.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function InvitesCard({ groupId, invites }: { groupId: string; invites: Invite[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [now] = useState(() => Date.now());

  async function createInvite() {
    setCreating(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const code = randomInviteCode();
      const { error } = await supabase.from("group_invites").insert({
        group_id: groupId,
        code,
        created_by: userData.user.id,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
        max_uses: null,
      });
      if (error) throw error;
      toast.success("Invite created");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create invite";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  }

  async function revoke(inviteId: string) {
    if (!window.confirm("Revoke this invite link?")) return;
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("group_invites").delete().eq("id", inviteId);
      if (error) throw error;
      toast.success("Invite revoked");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to revoke";
      toast.error(msg);
    }
  }

  async function copy(code: string) {
    const url = `${window.location.origin}/join?code=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't copy — paste this link: " + url);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Invite people</CardTitle>
          <CardDescription>Share a link to add anyone to this group.</CardDescription>
        </div>
        <Button onClick={createInvite} loading={creating}>
          <LinkIcon className="h-4 w-4" /> New invite link
        </Button>
      </div>
      {invites.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-[color:var(--border)] p-4 text-center text-xs text-[color:var(--muted-foreground)]">
          No active invites — create one above.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[color:var(--border)]">
          {invites.map((iv) => {
            const expired = iv.expires_at ? new Date(iv.expires_at).getTime() < now : false;
            return (
              <li key={iv.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium">{iv.code}</p>
                  <p className="text-xs text-[color:var(--muted-foreground)]">
                    Created {relativeDate(iv.created_at)} · {iv.uses} use{iv.uses === 1 ? "" : "s"}
                    {iv.expires_at ? ` · ${expired ? "expired " : "expires "}${relativeDate(iv.expires_at)}` : " · never expires"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => copy(iv.code)}>
                    <Copy className="h-3.5 w-3.5" /> Copy link
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => revoke(iv.id)} aria-label="Revoke">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
