"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { matchReasons, normalizedKeys } from "@/lib/duplicates";
import { parseImportRow } from "@/lib/import";
import type { ImportRow } from "@/lib/import-fields";

export type RowAnalysis = {
  error?: string;
  existing: { id: string; label: string; reasons: string[] }[];
  inFile?: { row: number; reasons: string[] };
};

const MAX_ROWS = 20000;

async function existingKeys() {
  return prisma.lead.findMany({
    select: {
      id: true,
      company: true,
      firstName: true,
      lastName: true,
      emailNormalized: true,
      phoneNormalized: true,
      companyNormalized: true,
    },
  });
}

/** Prüft alle Zeilen: Validierung, Duplikate gegen Datenbank und innerhalb der Datei. */
export async function analyzeImport(rows: ImportRow[]): Promise<RowAnalysis[]> {
  await requireUser();
  if (rows.length > MAX_ROWS) throw new Error(`Maximal ${MAX_ROWS} Zeilen pro Import`);
  const existing = await existingKeys();

  // Indizes für schnelle Suche
  const byKey = new Map<string, typeof existing>();
  const add = (k: string | null, l: (typeof existing)[number]) => {
    if (!k) return;
    byKey.set(k, [...(byKey.get(k) ?? []), l]);
  };
  for (const l of existing) {
    add(l.emailNormalized && `e:${l.emailNormalized}`, l);
    add(l.phoneNormalized && `p:${l.phoneNormalized}`, l);
    add(l.companyNormalized && `c:${l.companyNormalized}`, l);
  }
  const seen = new Map<string, number>();

  return rows.map((row, i) => {
    const { result } = parseImportRow(row);
    if (!result.success) return { error: result.error.issues[0]?.message ?? "Ungültig", existing: [] };
    const keys = normalizedKeys(result.data);
    const keyList = [
      keys.emailNormalized && `e:${keys.emailNormalized}`,
      keys.phoneNormalized && `p:${keys.phoneNormalized}`,
      keys.companyNormalized && `c:${keys.companyNormalized}`,
    ].filter(Boolean) as string[];

    const matches = new Map<string, (typeof existing)[number]>();
    for (const k of keyList) for (const l of byKey.get(k) ?? []) matches.set(l.id, l);

    let inFile: RowAnalysis["inFile"];
    for (const k of keyList) {
      const prev = seen.get(k);
      if (prev !== undefined && !inFile) {
        const prevKeys = normalizedKeys(parseImportRow(rows[prev]).result.data ?? {});
        inFile = { row: prev, reasons: matchReasons(keys, prevKeys) };
      }
    }
    for (const k of keyList) if (!seen.has(k)) seen.set(k, i);

    return {
      existing: [...matches.values()].slice(0, 3).map((l) => ({
        id: l.id,
        label: l.company || [l.firstName, l.lastName].filter(Boolean).join(" ") || "Lead",
        reasons: matchReasons(keys, l),
      })),
      inFile,
    };
  });
}

export type ImportDecision = "create" | "skip" | { merge: string };

export async function runImport(rows: ImportRow[], decisions: ImportDecision[]) {
  const user = await requireUser();
  if (rows.length !== decisions.length || rows.length > MAX_ROWS) throw new Error("Ungültige Daten");

  const leadsToCreate = [];
  const notes: { leadId: string; note: string }[] = [];
  const merges: { id: string; data: NonNullable<ReturnType<typeof parseImportRow>["result"]["data"]>; note: string | null }[] = [];
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const d = decisions[i];
    const { result, note } = parseImportRow(rows[i]);
    if (d === "skip" || !result.success) {
      skipped++;
      continue;
    }
    if (d === "create") {
      const id = randomUUID();
      leadsToCreate.push({ id, ...result.data, ...normalizedKeys(result.data), ownerId: user.id });
      if (note) notes.push({ leadId: id, note });
    } else {
      merges.push({ id: d.merge, data: result.data, note });
    }
  }

  // Neu anlegen in Blöcken
  for (let i = 0; i < leadsToCreate.length; i += 500) {
    await prisma.lead.createMany({ data: leadsToCreate.slice(i, i + 500) });
  }

  // Zusammenführen: nur leere Felder des bestehenden Leads werden befüllt
  let merged = 0;
  for (const m of merges) {
    const lead = await prisma.lead.findUnique({ where: { id: m.id } });
    if (!lead) continue;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(m.data)) {
      if (k === "status" || k === "ownerId" || v === null || v === undefined) continue;
      if (k === "coreBusiness") {
        const union = [...new Set([...lead.coreBusiness, ...(v as string[])])];
        if (union.length !== lead.coreBusiness.length) patch.coreBusiness = union;
      } else if (lead[k as keyof typeof lead] === null) {
        patch[k] = v;
      }
    }
    const nk = normalizedKeys({ ...lead, ...patch } as Parameters<typeof normalizedKeys>[0]);
    await prisma.lead.update({ where: { id: m.id }, data: { ...patch, ...nk } });
    if (m.note) notes.push({ leadId: m.id, note: m.note });
    merged++;
  }

  for (let i = 0; i < notes.length; i += 500) {
    await prisma.activity.createMany({
      data: notes.slice(i, i + 500).map((n) => ({ ...n, userId: user.id, type: "NOTIZ" as const, note: `[Import] ${n.note}` })),
    });
  }

  revalidatePath("/leads");
  return { created: leadsToCreate.length, merged, skipped };
}
