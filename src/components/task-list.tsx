import Link from "next/link";
import { deleteTask, toggleTask } from "@/app/actions/tasks";
import { endOfTodayBerlin, fmtDue, leadName, startOfTodayBerlin } from "@/lib/format";
import { phoneHref } from "@/lib/normalize";
import { cx } from "./ui";

type TaskWithLead = {
  id: string;
  title: string;
  dueDate: Date;
  done: boolean;
  assignee?: { name: string } | null;
  lead?: { id: string; company: string | null; firstName: string | null; lastName: string | null; phone: string | null } | null;
};

export function TaskList({ tasks, showLead, showAssignee }: { tasks: TaskWithLead[]; showLead?: boolean; showAssignee?: boolean }) {
  const start = startOfTodayBerlin();
  const end = endOfTodayBerlin();
  return (
    <ul className="divide-y divide-zinc-100">
      {tasks.map((t) => {
        const overdue = !t.done && t.dueDate < start;
        const today = !t.done && t.dueDate >= start && t.dueDate <= end;
        return (
          <li key={t.id} className="group flex items-start gap-3 py-2">
            <form action={toggleTask} className="pt-0.5">
              <input type="hidden" name="id" value={t.id} />
              <button
                title={t.done ? "Als offen markieren" : "Erledigt"}
                className={cx(
                  "flex h-4 w-4 items-center justify-center rounded border text-[10px]",
                  t.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-400 hover:border-indigo-500",
                )}
              >
                {t.done ? "✓" : ""}
              </button>
            </form>
            <div className="min-w-0 flex-1 text-sm">
              <div className={cx("font-medium", t.done && "text-zinc-400 line-through")}>{t.title}</div>
              <div className="flex flex-wrap gap-x-3 text-xs text-zinc-500">
                <span className={cx(overdue && "font-semibold text-red-600", today && "font-semibold text-amber-600")}>
                  {overdue ? "Überfällig: " : today ? "Heute: " : ""}
                  {fmtDue(t.dueDate)}
                </span>
                {showLead && t.lead && (
                  <Link href={`/leads/${t.lead.id}`} className="text-indigo-600 hover:underline">
                    {leadName(t.lead)}
                  </Link>
                )}
                {showLead && t.lead?.phone && (
                  <a href={phoneHref(t.lead.phone)} className="text-indigo-600 hover:underline">
                    📞 {t.lead.phone}
                  </a>
                )}
                {showAssignee && <span>👤 {t.assignee?.name ?? "—"}</span>}
              </div>
            </div>
            <form action={deleteTask} className="opacity-0 group-hover:opacity-100">
              <input type="hidden" name="id" value={t.id} />
              <button title="Löschen" className="text-xs text-zinc-400 hover:text-red-600">✕</button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
