import Link from "next/link";
import { notFound } from "next/navigation";
import { addActivity, deleteActivity, deleteLead, setStatus } from "@/app/actions/leads";
import { ActivityForm } from "@/components/activity-form";
import { ConfirmSubmit } from "@/components/submit-button";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { ButtonLink, Card, StatusBadge, btn, cx } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate, fmtDateTime, leadName, personName } from "@/lib/format";
import {
  ACTIVITY_ICONS,
  ACTIVITY_LABELS,
  AGE_LABELS,
  CORE_BUSINESS_LABELS,
  OUTCOME_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  entries,
} from "@/lib/labels";
import { phoneHref } from "@/lib/normalize";

export const dynamic = "force-dynamic";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="min-w-0 break-words">{children ?? <span className="text-zinc-300">—</span>}</dd>
    </div>
  );
}

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [lead, users] = await Promise.all([
    prisma.lead.findUnique({
      where: { id },
      include: {
        owner: { select: { name: true } },
        activities: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
        tasks: { orderBy: [{ done: "asc" }, { dueDate: "asc" }], include: { assignee: { select: { name: true } } } },
      },
    }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!lead) notFound();

  const contactAttempts = lead.activities.filter((a) => a.type === "KONTAKTIERT").length;
  const website = lead.website && (lead.website.startsWith("http") ? lead.website : `https://${lead.website}`);

  return (
    <>
      <div className="mb-2 text-sm">
        <Link href="/leads" className="text-zinc-500 hover:text-zinc-800">← Alle Leads</Link>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{leadName(lead)}</h1>
            <StatusBadge status={lead.status} />
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {lead.company && personName(lead) && `${personName(lead)}${lead.position ? `, ${lead.position}` : ""} · `}
            {contactAttempts} Kontaktversuch{contactAttempts === 1 ? "" : "e"} · angelegt {fmtDate(lead.createdAt)}
          </p>
          {/* Schnellaktionen */}
          <div className="mt-3 flex flex-wrap gap-2">
            {lead.phone && (
              <a href={phoneHref(lead.phone)} className={btn.primary}>📞 {lead.phone}</a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className={btn.secondary}>✉️ E-Mail schreiben</a>
            )}
            {website && (
              <a href={website} target="_blank" rel="noreferrer" className={btn.secondary}>🌐 Website</a>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <ButtonLink href={`/leads/${lead.id}/edit`} variant="secondary">Bearbeiten</ButtonLink>
          <form action={deleteLead}>
            <input type="hidden" name="id" value={lead.id} />
            <ConfirmSubmit message="Lead inkl. aller Notizen und Wiedervorlagen endgültig löschen?" className={btn.danger}>
              Löschen
            </ConfirmSubmit>
          </form>
        </div>
      </div>

      {/* Pipeline */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
        {entries(STATUS_LABELS).map(([s, label]) => (
          <form key={s} action={setStatus} className="flex-1">
            <input type="hidden" name="id" value={lead.id} />
            <input type="hidden" name="status" value={s} />
            <button
              className={cx(
                "w-full rounded-md px-3 py-2 text-sm font-medium",
                lead.status === s
                  ? s === "VERLOREN"
                    ? "bg-zinc-600 text-white"
                    : s === "ABGESCHLOSSEN"
                      ? "bg-emerald-600 text-white"
                      : "bg-indigo-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100",
              )}
            >
              {label}
            </button>
          </form>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card title="Neuer Eintrag">
            <ActivityForm action={addActivity.bind(null, lead.id)} />
          </Card>

          <Card title={`Verlauf (${lead.activities.length})`}>
            {lead.activities.length === 0 ? (
              <p className="text-sm text-zinc-500">Noch keine Einträge.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-zinc-200 pl-6">
                {lead.activities.map((a) => (
                  <li key={a.id} className="group relative">
                    <span className="absolute -left-[2.05rem] flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs">
                      {ACTIVITY_ICONS[a.type]}
                    </span>
                    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-medium">{ACTIVITY_LABELS[a.type]}</span>
                      {a.outcome && (
                        <span
                          className={cx(
                            "rounded px-1.5 py-0.5 text-xs font-medium",
                            a.outcome.startsWith("TERMIN")
                              ? "bg-emerald-100 text-emerald-800"
                              : a.outcome === "KEIN_INTERESSE"
                                ? "bg-red-100 text-red-700"
                                : "bg-zinc-100 text-zinc-700",
                          )}
                        >
                          {OUTCOME_LABELS[a.outcome]}
                        </span>
                      )}
                      <span className="text-xs text-zinc-400">
                        {fmtDateTime(a.createdAt)} · {a.user?.name ?? "—"}
                      </span>
                      {a.type !== "STATUS" && (
                        <form action={deleteActivity} className="ml-auto opacity-0 group-hover:opacity-100">
                          <input type="hidden" name="id" value={a.id} />
                          <ConfirmSubmit message="Eintrag löschen?" className="text-xs text-zinc-400 hover:text-red-600">
                            löschen
                          </ConfirmSubmit>
                        </form>
                      )}
                    </div>
                    {a.note && <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{a.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Wiedervorlagen">
            {lead.tasks.length > 0 && (
              <div className="mb-4">
                <TaskList tasks={lead.tasks} showAssignee />
              </div>
            )}
            <TaskForm leadId={lead.id} users={users} defaultAssignee={lead.ownerId ?? user.id} />
          </Card>

          <Card title="Kontakt">
            <dl className="divide-y divide-zinc-100">
              <Row label="Ansprechpartner">{personName(lead) || null}</Row>
              <Row label="Position">{lead.position}</Row>
              <Row label="Telefon">
                {lead.phone && <a href={phoneHref(lead.phone)} className="text-indigo-600 hover:underline">{lead.phone}</a>}
              </Row>
              <Row label="E-Mail">
                {lead.email && <a href={`mailto:${lead.email}`} className="text-indigo-600 hover:underline">{lead.email}</a>}
              </Row>
              <Row label="Website">
                {website && <a href={website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{lead.website}</a>}
              </Row>
              <Row label="Adresse">
                {lead.street || lead.zip || lead.city ? (
                  <>
                    {lead.street}
                    {lead.street && <br />}
                    {[lead.zip, lead.city].filter(Boolean).join(" ")}
                  </>
                ) : null}
              </Row>
            </dl>
          </Card>

          <Card title="Herkunft">
            <dl className="divide-y divide-zinc-100">
              <Row label="Quelle">{lead.source && SOURCE_LABELS[lead.source]}</Row>
              {lead.source === "EMPFEHLUNG" && <Row label="Empfohlen von">{lead.referredBy}</Row>}
              <Row label="Zuständig">{lead.owner?.name}</Row>
            </dl>
          </Card>

          <Card title="Rahmeninformationen">
            <dl className="divide-y divide-zinc-100">
              <Row label="Kerngeschäft">
                {lead.coreBusiness.length ? lead.coreBusiness.map((c) => CORE_BUSINESS_LABELS[c]).join(", ") : null}
              </Row>
              <Row label="Mitarbeiter">{lead.employeeCount?.toLocaleString("de-DE")}</Row>
              <Row label="Verw. Objekte">{lead.propertyCount?.toLocaleString("de-DE")}</Row>
              <Row label="Einheiten">{lead.unitCount?.toLocaleString("de-DE")}</Row>
              <Row label="Alter (geschätzt)">{lead.ageRange && AGE_LABELS[lead.ageRange]}</Row>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
