import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { Card, PageHeader, cx } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { endOfTodayBerlin, startOfTodayBerlin } from "@/lib/format";

export const dynamic = "force-dynamic";

const include = {
  assignee: { select: { name: true } },
  lead: { select: { id: true, company: true, firstName: true, lastName: true, phone: true } },
} satisfies Prisma.TaskInclude;

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ who?: string }> }) {
  const user = await requireUser();
  const { who } = await searchParams;
  const all = who === "all";
  const base: Prisma.TaskWhereInput = all ? {} : { assigneeId: user.id };
  const start = startOfTodayBerlin();
  const end = endOfTodayBerlin();

  const [overdue, today, upcoming, done, users] = await Promise.all([
    prisma.task.findMany({ where: { ...base, done: false, dueDate: { lt: start } }, orderBy: { dueDate: "asc" }, include }),
    prisma.task.findMany({ where: { ...base, done: false, dueDate: { gte: start, lte: end } }, orderBy: { dueDate: "asc" }, include }),
    prisma.task.findMany({ where: { ...base, done: false, dueDate: { gt: end } }, orderBy: { dueDate: "asc" }, include, take: 200 }),
    prisma.task.findMany({ where: { ...base, done: true }, orderBy: { completedAt: "desc" }, include, take: 20 }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const section = (title: string, tasks: typeof overdue, tone?: string) => (
    <Card title={<span className={tone}>{`${title} (${tasks.length})`}</span>}>
      {tasks.length ? <TaskList tasks={tasks} showLead showAssignee={all} /> : <p className="text-sm text-zinc-400">Keine.</p>}
    </Card>
  );

  return (
    <>
      <PageHeader
        title="Wiedervorlagen"
        actions={
          <div className="flex rounded-md border border-zinc-300 bg-white p-0.5 text-sm">
            {[["", "Meine"], ["all", "Ganzes Team"]].map(([v, l]) => (
              <Link
                key={v}
                href={v ? `/tasks?who=${v}` : "/tasks"}
                className={cx("rounded px-3 py-1.5", (all ? "all" : "") === v ? "bg-indigo-600 text-white" : "text-zinc-600")}
              >
                {l}
              </Link>
            ))}
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {section("Überfällig", overdue, "text-red-600")}
          {section("Heute", today, "text-amber-600")}
          {section("Demnächst", upcoming)}
          {section("Zuletzt erledigt", done, "text-zinc-500")}
        </div>
        <Card title="Neue Wiedervorlage (ohne Lead)">
          <TaskForm users={users} defaultAssignee={user.id} />
          <p className="mt-3 text-xs text-zinc-500">
            Tipp: Wiedervorlagen zu einem Lead legst du am besten direkt auf der Lead-Seite an.
          </p>
        </Card>
      </div>
    </>
  );
}
