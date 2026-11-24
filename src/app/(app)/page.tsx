import Link from "next/link";
import { TaskList } from "@/components/task-list";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { endOfTodayBerlin, fmtDateTime, leadName } from "@/lib/format";
import { ACTIVITY_ICONS, ACTIVITY_LABELS, OUTCOME_LABELS, STATUS_LABELS, entries } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireUser();
  const [byStatus, dueTasks, recent, total] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], _count: true }),
    prisma.task.findMany({
      where: { done: false, assigneeId: user.id, dueDate: { lte: endOfTodayBerlin() } },
      orderBy: { dueDate: "asc" },
      include: { lead: { select: { id: true, company: true, firstName: true, lastName: true, phone: true } } },
      take: 50,
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        user: { select: { name: true } },
        lead: { select: { id: true, company: true, firstName: true, lastName: true } },
      },
    }),
    prisma.lead.count(),
  ]);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;

  return (
    <>
      <PageHeader
        title={`Hallo ${user.name.split(" ")[0]} 👋`}
        subtitle={`${total} Leads im System`}
        actions={<ButtonLink href="/leads/new">+ Neuer Lead</ButtonLink>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {entries(STATUS_LABELS).map(([s, label]) => (
          <Link
            key={s}
            href={`/leads?status=${s}`}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-indigo-300"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{count(s)}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title={`Heute fällig & überfällig (${dueTasks.length})`}
          actions={<Link href="/tasks" className="text-xs text-indigo-600 hover:underline">Alle Wiedervorlagen →</Link>}
        >
          {dueTasks.length === 0 ? (
            <p className="text-sm text-zinc-500">Nichts fällig – sauber! ✅</p>
          ) : (
            <TaskList tasks={dueTasks} showLead />
          )}
        </Card>

        <Card title="Letzte Aktivitäten im Team">
          {recent.length === 0 ? (
            <p className="text-sm text-zinc-500">Noch keine Aktivitäten.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {recent.map((a) => (
                <li key={a.id} className="flex gap-3 py-2 text-sm">
                  <span aria-hidden>{ACTIVITY_ICONS[a.type]}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/leads/${a.lead.id}`} className="font-medium hover:underline">
                      {leadName(a.lead)}
                    </Link>
                    <span className="text-zinc-500">
                      {" · "}
                      {a.outcome ? OUTCOME_LABELS[a.outcome] : ACTIVITY_LABELS[a.type]}
                      {a.type === "STATUS" && a.note ? `: ${a.note}` : ""}
                    </span>
                    <div className="text-xs text-zinc-400">
                      {fmtDateTime(a.createdAt)} · {a.user?.name ?? "—"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
