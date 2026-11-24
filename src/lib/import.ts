import type { AgeRange, CoreBusiness, LeadSource, LeadStatus } from "@prisma/client";
import type { ImportRow } from "./import-fields";
import { leadSchema } from "./lead-input";

const lc = (s?: string) => (s ?? "").trim().toLowerCase();

export function mapSource(v?: string): LeadSource | "" {
  const s = lc(v);
  if (!s) return "";
  if (s.includes("empfehl") || s.includes("referral")) return "EMPFEHLUNG";
  if (s.includes("web") || s.includes("online") || s.includes("formular")) return "WEBSITE";
  if (s.includes("messe")) return "MESSE";
  if (s.includes("kalt") || s.includes("cold")) return "KALTAKQUISE";
  return "SONSTIGES";
}

export function mapStatus(v?: string): LeadStatus | undefined {
  const s = lc(v);
  if (!s) return undefined;
  if (s.includes("closing")) return "CLOSING";
  if (s.includes("abgeschlossen") || s.includes("gewonnen") || s.includes("kunde") || s.includes("won")) return "ABGESCHLOSSEN";
  if (s.includes("verloren") || s.includes("kein interesse") || s.includes("lost")) return "VERLOREN";
  return "SETTING";
}

export function mapCoreBusiness(v?: string): CoreBusiness[] {
  const parts = lc(v).split(/[,;/|+]|\bund\b/).map((p) => p.trim()).filter(Boolean);
  const out = new Set<CoreBusiness>();
  for (const p of parts) {
    if (p.includes("weg")) out.add("WEG_VERWALTUNG");
    else if (p.includes("miet")) out.add("MIETVERWALTUNG");
    else if (p.includes("sev") || p.includes("se-") || p.includes("sondereigentum") || p === "se") out.add("SE_VERWALTUNG");
    else if (p.includes("makl")) out.add("MAKLER");
    else if (p.includes("verwalt")) out.add("WEG_VERWALTUNG");
    else out.add("SONSTIGES");
  }
  return [...out];
}

export function mapAge(v?: string): AgeRange | "" {
  const m = lc(v).match(/\d+/);
  if (!m) return "";
  const n = Number(m[0]);
  if (n < 18) return "";
  if (n < 30) return "A18_29";
  if (n < 40) return "A30_39";
  if (n < 50) return "A40_49";
  if (n < 60) return "A50_59";
  return "A60_PLUS";
}

function splitName(full?: string) {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: "", lastName: parts[0] };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

/** Wandelt eine CSV-Zeile in validierte Lead-Daten um. */
export function parseImportRow(row: ImportRow) {
  const fromFull = splitName(row.fullName);
  const source = mapSource(row.source) || (row.referredBy?.trim() ? "EMPFEHLUNG" : "");
  const result = leadSchema.safeParse({
    company: row.company ?? "",
    firstName: row.firstName ?? fromFull.firstName,
    lastName: row.lastName ?? fromFull.lastName,
    position: row.position ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    website: row.website ?? "",
    street: row.street ?? "",
    zip: row.zip ?? "",
    city: row.city ?? "",
    source,
    referredBy: row.referredBy ?? "",
    status: mapStatus(row.status),
    coreBusiness: mapCoreBusiness(row.coreBusiness),
    employeeCount: row.employeeCount ?? "",
    propertyCount: row.propertyCount ?? "",
    unitCount: row.unitCount ?? "",
    ageRange: mapAge(row.ageRange),
    ownerId: "",
  });
  return { result, note: row.note?.trim() || null };
}
