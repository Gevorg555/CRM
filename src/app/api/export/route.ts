import type { Prisma } from "@prisma/client";
import { AgeRange, CoreBusiness, LeadSource, LeadStatus } from "@prisma/client";
import Papa from "papaparse";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { AGE_LABELS, CORE_BUSINESS_LABELS, SOURCE_LABELS, STATUS_LABELS } from "@/lib/labels";

const ok = <T extends string>(v: string | null, e: Record<string, T>) =>
  v && (Object.values(e) as string[]).includes(v) ? (v as T) : undefined;

export async function GET(req: Request) {
  if (!(await getCurrentUser())) return new Response("Nicht angemeldet", { status: 401 });
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  const status = ok(sp.get("status"), LeadStatus);
  const cb = ok(sp.get("cb"), CoreBusiness);
  const age = ok(sp.get("age"), AgeRange);
  const source = ok(sp.get("source"), LeadSource);
  const owner = sp.get("owner");

  const where: Prisma.LeadWhereInput = {
    ...(status && { status }),
    ...(cb && { coreBusiness: { has: cb } }),
    ...(age && { ageRange: age }),
    ...(source && { source }),
    ...(owner && { ownerId: owner === "none" ? null : owner }),
    ...(q && {
      OR: [
        { company: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { city: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { company: "asc" },
    include: {
      owner: { select: { name: true } },
      _count: { select: { activities: { where: { type: "KONTAKTIERT" } } } },
    },
  });

  const csv = Papa.unparse(
    leads.map((l) => ({
      Firma: l.company ?? "",
      Vorname: l.firstName ?? "",
      Nachname: l.lastName ?? "",
      Position: l.position ?? "",
      Telefon: l.phone ?? "",
      "E-Mail": l.email ?? "",
      Website: l.website ?? "",
      Straße: l.street ?? "",
      PLZ: l.zip ?? "",
      Ort: l.city ?? "",
      Quelle: l.source ? SOURCE_LABELS[l.source] : "",
      "Empfohlen von": l.referredBy ?? "",
      Status: STATUS_LABELS[l.status],
      Kerngeschäft: l.coreBusiness.map((c) => CORE_BUSINESS_LABELS[c]).join(", "),
      Mitarbeiter: l.employeeCount ?? "",
      Objekte: l.propertyCount ?? "",
      Einheiten: l.unitCount ?? "",
      Alter: l.ageRange ? AGE_LABELS[l.ageRange] : "",
      Zuständig: l.owner?.name ?? "",
      Kontaktversuche: l._count.activities,
      "Angelegt am": fmtDate(l.createdAt),
    })),
    { delimiter: ";" },
  );

  // BOM, damit Excel Umlaute korrekt anzeigt
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
