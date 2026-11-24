import { parsePhoneNumberFromString } from "libphonenumber-js";

export function normalizeEmail(email?: string | null) {
  const e = email?.trim().toLowerCase();
  return e ? e : null;
}

/** Telefonnummern vergleichbar machen: "0171 / 123 45" == "+49 171 12345" */
export function normalizePhone(phone?: string | null) {
  const raw = phone?.trim();
  if (!raw) return null;
  const parsed = parsePhoneNumberFromString(raw, "DE");
  if (parsed?.isPossible()) return parsed.number; // E.164
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 5 ? digits : null;
}

const LEGAL_FORMS =
  /\b(gmbh|mbh|ug|haftungsbeschraenkt|ag|kg|ohg|gbr|ek|ev|co|ltd|inc|se|partg)\b/g;

/** Firmennamen vergleichbar machen: "Müller Hausverwaltung GmbH & Co. KG" -> "müller hausverwaltung" */
export function normalizeCompany(company?: string | null) {
  const c = company?.trim().toLowerCase();
  if (!c) return null;
  const cleaned = c
    .replace(/&/g, " ")
    .replace(/[.,\-_/()"']/g, " ")
    .replace(/\(?haftungsbeschränkt\)?/g, " ")
    .replace(LEGAL_FORMS, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Sehr kurze Reste (z. B. "ab") würden zu viele Fehltreffer erzeugen
  return cleaned.length >= 3 ? cleaned : null;
}

/** Für tel:-Links */
export function phoneHref(phone: string) {
  return `tel:${normalizePhone(phone) ?? phone.replace(/[^\d+]/g, "")}`;
}
