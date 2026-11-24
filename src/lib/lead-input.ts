import { AgeRange, CoreBusiness, LeadSource, LeadStatus } from "@prisma/client";
import { z } from "zod";
import { normalizedKeys } from "./duplicates";

const optStr = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const optInt = z
  .union([z.string(), z.number()])
  .transform((v) => {
    if (typeof v === "number") return Number.isFinite(v) ? Math.round(v) : null;
    const cleaned = v.replace(/[.\s]/g, "").replace(",", ".");
    if (cleaned === "") return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? Math.round(n) : null;
  })
  .nullable()
  .optional();

const optEnum = <T extends Record<string, string>>(e: T) =>
  z
    .union([z.nativeEnum(e), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

const leadObject = z.object({
    company: optStr,
    firstName: optStr,
    lastName: optStr,
    position: optStr,
    phone: optStr,
    email: optStr.refine((v) => !v || z.string().email().safeParse(v).success, "Ungültige E-Mail-Adresse"),
    website: optStr,
    street: optStr,
    zip: optStr,
    city: optStr,
    source: optEnum(LeadSource),
    referredBy: optStr,
    status: z.nativeEnum(LeadStatus).optional(),
    coreBusiness: z.array(z.nativeEnum(CoreBusiness)).default([]),
    employeeCount: optInt,
    propertyCount: optInt,
    unitCount: optInt,
    ageRange: optEnum(AgeRange),
    ownerId: optStr,
  });

export const leadSchema = leadObject
  .refine((d) => d.company || d.firstName || d.lastName, {
    message: "Bitte mindestens Firma oder Namen angeben",
    path: ["company"],
  })
  .transform((d) => ({
    ...d,
    // Empfohlen von nur bei Quelle "Empfehlung"
    referredBy: d.source === "EMPFEHLUNG" ? d.referredBy : null,
  }));

export type LeadInput = z.infer<typeof leadSchema>;

export function leadFromFormData(fd: FormData) {
  const obj: Record<string, unknown> = {};
  for (const key of Object.keys(leadObject.shape)) {
    if (key === "coreBusiness") obj[key] = fd.getAll(key).map(String);
    else if (fd.has(key)) obj[key] = String(fd.get(key) ?? "");
  }
  return leadSchema.safeParse(obj);
}

export function withNormalized(data: LeadInput) {
  return { ...data, ...normalizedKeys(data) };
}
