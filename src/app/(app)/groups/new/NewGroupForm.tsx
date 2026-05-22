"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field, Input, Select, Textarea } from "@/components/ui/Inputs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CURRENCY_OPTIONS } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const EMOJIS = ["✨", "🏖️", "🏠", "✈️", "🍕", "🎉", "🎬", "⚽", "🚗", "🛒", "🎓", "💼", "🎂", "🏔️"];

export function NewGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please give your group a name.");
      return;
    }
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: userData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !userData.user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("groups")
        .insert({
          name: name.trim(),
          emoji,
          description: description.trim() || null,
          currency,
          created_by: userData.user.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Group created");
      router.push(`/groups/${data.id}`);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create group";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Name" htmlFor="name">
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Weekend Trip"
            maxLength={60}
            autoFocus
            required
          />
        </Field>
        <Field label="Icon">
          <div className="flex flex-wrap gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`h-10 w-10 rounded-xl border text-xl transition-colors ${
                  emoji === e
                    ? "border-[color:var(--primary)] bg-[color:var(--muted)]"
                    : "border-[color:var(--border)] hover:bg-[color:var(--muted)]"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Default currency" htmlFor="currency">
          <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description (optional)" htmlFor="description">
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Anything to remember about this group?"
            rows={3}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button as="link" variant="ghost" href="/dashboard">Cancel</Button>
          <Button type="submit" loading={saving}>Create group</Button>
        </div>
      </form>
    </Card>
  );
}
