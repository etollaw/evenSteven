import * as React from "react";
import { cn, colorForId, initialsFromName } from "@/lib/utils";

export function Avatar({
  name,
  id,
  src,
  size = 32,
  className,
}: {
  name: string;
  id: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const dimension = `${size}px`;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn(
          "inline-block shrink-0 rounded-full object-cover ring-1 ring-[color:var(--border)]",
          className,
        )}
        style={{ width: dimension, height: dimension }}
      />
    );
  }
  const bg = colorForId(id);
  return (
    <span
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-1 ring-[color:var(--border)]",
        className,
      )}
      style={{
        width: dimension,
        height: dimension,
        background: bg,
        fontSize: Math.max(10, Math.round(size * 0.4)),
      }}
    >
      {initialsFromName(name)}
    </span>
  );
}

export function AvatarStack({
  people,
  size = 28,
  max = 5,
}: {
  people: { id: string; name: string; avatar_url?: string | null }[];
  size?: number;
  max?: number;
}) {
  const visible = people.slice(0, max);
  const remaining = people.length - visible.length;
  return (
    <div className="flex items-center -space-x-2">
      {visible.map((p) => (
        <Avatar key={p.id} id={p.id} name={p.name} src={p.avatar_url} size={size} className="ring-2 ring-[color:var(--card)]" />
      ))}
      {remaining > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-[color:var(--muted)] text-[color:var(--muted-foreground)] ring-2 ring-[color:var(--card)] text-xs font-semibold"
          style={{ width: size, height: size }}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}
