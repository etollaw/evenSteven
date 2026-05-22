import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadGroupBundle } from "@/lib/group-data";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { GroupSettingsForms } from "./GroupSettingsForms";

export const metadata = { title: "Group settings" };

export default async function GroupSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await loadGroupBundle(id);

  const supabase = await createSupabaseServerClient();
  const { data: invites } = await supabase
    .from("group_invites")
    .select("id, code, created_at, expires_at, max_uses, uses, created_by")
    .eq("group_id", id)
    .order("created_at", { ascending: false });

  const isOwner = bundle.members.some(
    (m) => m.id === bundle.currentUserId && m.role === "owner",
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/groups/${id}`}
          className="inline-flex items-center gap-1 text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
        >
          <ChevronLeft className="h-3 w-3" /> Back to {bundle.group.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Group settings</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Manage members, invites, and group details.
        </p>
      </div>

      <GroupSettingsForms
        group={{
          id: bundle.group.id,
          name: bundle.group.name,
          description: bundle.group.description ?? "",
          emoji: bundle.group.emoji ?? "✨",
          currency: bundle.group.currency,
        }}
        members={bundle.members.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          avatar_url: m.avatar_url,
          role: m.role,
        }))}
        currentUserId={bundle.currentUserId}
        isOwner={isOwner}
        invites={(invites ?? []).map((iv) => ({
          id: iv.id as string,
          code: iv.code as string,
          created_at: iv.created_at as string,
          expires_at: (iv.expires_at as string | null) ?? null,
          max_uses: (iv.max_uses as number | null) ?? null,
          uses: iv.uses as number,
        }))}
      />

      <Card>
        <CardTitle>Danger zone</CardTitle>
        <CardDescription>Deleting a group is permanent and removes all its expenses and settlements.</CardDescription>
        <DangerZone groupId={id} isOwner={isOwner} />
      </Card>
    </div>
  );
}

import { DeleteGroupButton } from "./DeleteGroupButton";

function DangerZone({ groupId, isOwner }: { groupId: string; isOwner: boolean }) {
  if (!isOwner) {
    return (
      <p className="mt-3 text-xs text-[color:var(--muted-foreground)]">
        Only owners can delete this group.
      </p>
    );
  }
  return (
    <div className="mt-3">
      <DeleteGroupButton groupId={groupId} />
    </div>
  );
}
