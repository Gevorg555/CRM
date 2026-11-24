import type { LeadStatus } from "@prisma/client";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/labels";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export const inputCls =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-zinc-50";

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50",
  danger:
    "inline-flex items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50",
  ghost: "inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-lg border border-zinc-200 bg-white shadow-sm", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-800">{title}</h2>
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Field({ label, error, children, className }: { label: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1 block text-xs font-medium text-zinc-600">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function ButtonLink({ variant = "primary", ...props }: ComponentProps<typeof Link> & { variant?: keyof typeof btn }) {
  return <Link {...props} className={cx(btn[variant], props.className)} />;
}

export function Alert({ kind, children }: { kind: "error" | "ok" | "warn"; children: ReactNode }) {
  const cls = {
    error: "border-red-200 bg-red-50 text-red-700",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
  }[kind];
  return <div className={cx("rounded-md border px-3 py-2 text-sm", cls)}>{children}</div>;
}
