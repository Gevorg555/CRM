"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";

const items = [
  { href: "/", label: "Übersicht", icon: "🏠" },
  { href: "/leads", label: "Leads", icon: "👥" },
  { href: "/tasks", label: "Wiedervorlagen", icon: "⏰" },
  { href: "/import", label: "CSV-Import", icon: "📥" },
];

export function Nav({ isAdmin, dueCount }: { isAdmin: boolean; dueCount: number }) {
  const path = usePathname();
  const all = isAdmin ? [...items, { href: "/team", label: "Team", icon: "🧑‍🤝‍🧑" }] : items;
  return (
    <nav className="flex flex-col gap-0.5">
      {all.map((i) => {
        const active = i.href === "/" ? path === "/" : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cx(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
              active ? "bg-indigo-50 text-indigo-700" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            <span aria-hidden>{i.icon}</span>
            <span className="flex-1">{i.label}</span>
            {i.href === "/tasks" && dueCount > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">{dueCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
