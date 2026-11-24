"use server";

import type { ContactOutcome, LeadStatus } from "@prisma/client";
import { ActivityType, LeadStatus as LeadStatusEnum, ContactOutcome as OutcomeEnum } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findDuplicates, type DuplicateMatch } from "@/lib/duplicates";
import { STATUS_LABELS } from "@/lib/labels";
import { leadFromFormData, withNormalized } from "@/lib/lead-input";

export type LeadFormState =
  | { error?: string; fieldErrors?: Record<string, string>; duplicates?: DuplicateMatch[] }
  | undefined;

function zodErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const i of issues) fieldErrors[String(i.path[0] ?? "form")] = i.message;
  return { error: "Bitte die markierten Felder prüfen", fieldErrors };
}

export async function createLead(_: LeadFormState, fd: FormData): Promise<LeadFormState> {
  const user = await requireUser();
  const parsed = leadFromFormData(fd);
  if (!parsed.success) return zodErrors(parsed.error.issues);

  // Duplikat-Prüfung – kann bewusst übersprungen werden ("Trotzdem anlegen")
  if (fd.get("ignoreDuplicates") !== "1") {
    const duplicates = await findDuplicates(parsed.data);
    if (duplicates.length > 0) return { duplicates };
  }

  const lead = await prisma.lead.create({
    data: { ...withNormalized(parsed.data), ownerId: parsed.data.ownerId ?? user.id },
  });
  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

export async function updateLead(id: string, _: LeadFormState, fd: FormData): Promise<LeadFormState> {
  const user = await requireUser();
  const parsed = leadFromFormData(fd);
  if (!parsed.success) return zodErrors(parsed.error.issues);

  if (fd.get("ignoreDuplicates") !== "1") {
    const duplicates = await findDuplicates(parsed.data, id);
    if (duplicates.length > 0) return { duplicates };
  }

  const before = await prisma.lead.findUniqueOrThrow({ where: { id } });
  const data = withNormalized(parsed.data);
  await prisma.$transaction([
    prisma.lead.update({ where: { id }, data }),
    ...(data.status && data.status !== before.status
      ? [statusActivity(id, user.id, before.status, data.status)]
      : []),
  ]);
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}`);
}

export async function deleteLead(fd: FormData) {
  await requireUser();
  await prisma.lead.delete({ where: { id: String(fd.get("id")) } });
  revalidatePath("/leads");
  redirect("/leads");
}

function statusActivity(leadId: string, userId: string, from: LeadStatus, to: LeadStatus) {
  return prisma.activity.create({
    data: {
      leadId,
      userId,
      type: ActivityType.STATUS,
      note: `${STATUS_LABELS[from]} → ${STATUS_LABELS[to]}`,
    },
  });
}

export async function setStatus(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const status = String(fd.get("status")) as LeadStatus;
  if (!Object.values(LeadStatusEnum).includes(status)) return;
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id } });
  if (lead.status === status) return;
  await prisma.$transaction([
    prisma.lead.update({ where: { id }, data: { status } }),
    statusActivity(id, user.id, lead.status, status),
  ]);
  revalidatePath(`/leads/${id}`);
}

export type ActivityFormState = { error?: string; ok?: number } | undefined;

/** Parst "YYYY-MM-DD" bzw. "YYYY-MM-DDTHH:mm" als lokale Zeit. */
function parseDate(v: FormDataEntryValue | null) {
  const s = v ? String(v) : "";
  if (!s) return null;
  const d = new Date(s.length === 10 ? `${s}T09:00` : s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function addActivity(leadId: string, _: ActivityFormState, fd: FormData): Promise<ActivityFormState> {
  const user = await requireUser();
  const type = String(fd.get("type")) as ActivityType;
  if (!["KONTAKTIERT", "EMAIL", "MEETING", "NOTIZ"].includes(type)) return { error: "Bitte einen Typ wählen" };

  const rawOutcome = String(fd.get("outcome") ?? "");
  const outcome =
    type === "KONTAKTIERT" && Object.values(OutcomeEnum).includes(rawOutcome as ContactOutcome)
      ? (rawOutcome as ContactOutcome)
      : null;
  if (type === "KONTAKTIERT" && !outcome) return { error: "Bitte ein Ergebnis wählen" };

  const note = String(fd.get("note") ?? "").trim() || null;
  if (!outcome && !note) return { error: "Bitte eine Notiz eingeben" };

  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  const leadName = lead.company || [lead.firstName, lead.lastName].filter(Boolean).join(" ");

  // Statuslogik: Closing-Termin -> Closing, Setting-Termin -> Setting, Kein Interesse -> optional Verloren
  let newStatus: LeadStatus | null = null;
  if (outcome === "TERMIN_CLOSING") newStatus = "CLOSING";
  if (outcome === "TERMIN_SETTING" && lead.status === "VERLOREN") newStatus = "SETTING";
  if (outcome === "KEIN_INTERESSE" && fd.get("markLost") === "on") newStatus = "VERLOREN";
  if (newStatus === lead.status) newStatus = null;

  // Wiedervorlage aus der Aktivität heraus
  const followUpDate = parseDate(fd.get("followUpDate"));
  const followUpTitle =
    String(fd.get("followUpTitle") ?? "").trim() ||
    (outcome === "RUECKRUF"
      ? `Rückruf: ${leadName}`
      : outcome === "TERMIN_CLOSING"
        ? `Closing-Termin: ${leadName}`
        : outcome === "TERMIN_SETTING"
          ? `Setting-Termin: ${leadName}`
          : `Wiedervorlage: ${leadName}`);

  await prisma.$transaction([
    prisma.activity.create({ data: { leadId, userId: user.id, type, outcome, note } }),
    ...(newStatus
      ? [
          prisma.lead.update({ where: { id: leadId }, data: { status: newStatus } }),
          statusActivity(leadId, user.id, lead.status, newStatus),
        ]
      : [prisma.lead.update({ where: { id: leadId }, data: { updatedAt: new Date() } })]),
    ...(followUpDate
      ? [
          prisma.task.create({
            data: {
              title: followUpTitle,
              dueDate: followUpDate,
              leadId,
              assigneeId: lead.ownerId ?? user.id,
              createdById: user.id,
            },
          }),
        ]
      : []),
  ]);
  revalidatePath(`/leads/${leadId}`);
  return { ok: Date.now() };
}

export async function deleteActivity(fd: FormData) {
  await requireUser();
  const a = await prisma.activity.delete({ where: { id: String(fd.get("id")) } });
  revalidatePath(`/leads/${a.leadId}`);
}
