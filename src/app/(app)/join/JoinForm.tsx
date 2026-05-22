"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Inputs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialCode = params.get("code") ?? "";
  const [code, setCode] = useState(initialCode);
  const [joining, setJoining] = useState(false);
  const auto = params.get("auto") === "1";

  useEffect(() => {
    if (initialCode && auto) {
      void join(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function join(useCode?: string) {
    const target = (useCode ?? code).trim().toUpperCase();
    if (!target) return toast.error("Please enter an invite code.");
    setJoining(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("accept_group_invite", { invite_code: target });
      if (error) throw error;
      toast.success("Joined!");
      router.push(`/groups/${data as string}`);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to join";
      toast.error(msg);
    } finally {
      setJoining(false);
    }
  }

  return (
    <Card>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void join();
        }}
      >
        <Field label="Invite code">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD1234"
            className="font-mono tracking-widest uppercase"
            autoFocus
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" loading={joining}>Join group</Button>
        </div>
      </form>
    </Card>
  );
}
