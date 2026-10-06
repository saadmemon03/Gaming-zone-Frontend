import type { ReactNode } from "react";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

export default function Badge({
  children,
  variant = "neutral",
}: BadgeProps) {
  const styles = {
    success:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",

    warning:
      "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",

    danger:
      "bg-red-500/10 text-red-400 border-red-500/20",

    info:
      "bg-rose-400/10 text-rose-300 border-rose-400/20",

    neutral:
      "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <span
      className={`
        inline-flex items-center
        rounded-full border
        px-2.5 py-1
        text-xs font-medium
        ${styles[variant]}
      `}
    >
      {children}
    </span>
  );
}