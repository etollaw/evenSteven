"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

const sizeClasses: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3.5 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
  icon: "h-9 w-9 p-0",
};

const variantClasses: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  destructive: "btn-destructive",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  loading?: boolean;
  children?: React.ReactNode;
};

type ButtonAsButton = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };

type ButtonAsLink = BaseProps &
  Omit<React.ComponentProps<typeof Link>, "className"> & { as: "link" };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const {
    variant = "primary",
    size = "md",
    className,
    loading,
    children,
    as,
    ...rest
  } = props as BaseProps & { as?: "button" | "link" } & Record<string, unknown>;
  const classes = cn("btn", variantClasses[variant], sizeClasses[size], className);

  if (as === "link") {
    const linkProps = rest as unknown as Omit<React.ComponentProps<typeof Link>, "className">;
    return (
      <Link className={classes} {...linkProps}>
        {loading ? <Spinner /> : null}
        {children}
      </Link>
    );
  }
  const btnProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} disabled={btnProps.disabled || loading} {...btnProps}>
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}
