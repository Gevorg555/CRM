import { prisma } from "./db";
import { normalizeCompany, normalizeEmail, normalizePhone } from "./normalize";

export type DuplicateInput = {
  email?: string | null;
  phone?: string | null;
  company?: string | null;
};

export type DuplicateMatch = {
  id: string;
  company: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  reasons: string[];
};

export function normalizedKeys(input: DuplicateInput) {
  return {
    emailNormalized: normalizeEmail(input.email),
    phoneNormalized: normalizePhone(input.phone),
    companyNormalized: normalizeCompany(input.company),
  };
}

export function matchReasons(
  a: ReturnType<typeof normalizedKeys>,
  b: { emailNormalized: string | null; phoneNormalized: string | null; companyNormalized: string | null },
) {
  const reasons: string[] = [];
  if (a.emailNormalized && a.emailNormalized === b.emailNormalized) reasons.push("E-Mail");
  if (a.phoneNormalized && a.phoneNormalized === b.phoneNormalized) reasons.push("Telefon");
  if (a.companyNormalized && a.companyNormalized === b.companyNormalized) reasons.push("Firma");
  return reasons;
}

/** Sucht bestehende Leads mit gleicher E-Mail, Telefonnummer oder Firma. */
export async function findDuplicates(input: DuplicateInput, excludeId?: string): Promise<DuplicateMatch[]> {
  const keys = normalizedKeys(input);
  const or = [
    keys.emailNormalized && { emailNormalized: keys.emailNormalized },
    keys.phoneNormalized && { phoneNormalized: keys.phoneNormalized },
    keys.companyNormalized && { companyNormalized: keys.companyNormalized },
  ].filter(Boolean) as object[];
  if (or.length === 0) return [];

  const leads = await prisma.lead.findMany({
    where: { OR: or, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    take: 10,
  });
  return leads.map((l) => ({
    id: l.id,
    company: l.company,
    firstName: l.firstName,
    lastName: l.lastName,
    email: l.email,
    phone: l.phone,
    city: l.city,
    reasons: matchReasons(keys, l),
  }));
}
