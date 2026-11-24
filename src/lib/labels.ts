import type {
  ActivityType,
  AgeRange,
  ContactOutcome,
  CoreBusiness,
  LeadSource,
  LeadStatus,
} from "@prisma/client";

export const STATUS_LABELS: Record<LeadStatus, string> = {
  SETTING: "Setting",
  CLOSING: "Closing",
  ABGESCHLOSSEN: "Abgeschlossen",
  VERLOREN: "Verloren",
};

export const STATUS_COLORS: Record<LeadStatus, string> = {
  SETTING: "bg-sky-100 text-sky-800 ring-sky-200",
  CLOSING: "bg-amber-100 text-amber-800 ring-amber-200",
  ABGESCHLOSSEN: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  VERLOREN: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: "Website",
  MESSE: "Messe",
  KALTAKQUISE: "Kaltakquise",
  EMPFEHLUNG: "Empfehlung",
  SONSTIGES: "Sonstiges",
};

export const CORE_BUSINESS_LABELS: Record<CoreBusiness, string> = {
  WEG_VERWALTUNG: "WEG-Verwaltung",
  MIETVERWALTUNG: "Mietverwaltung",
  SE_VERWALTUNG: "SE-Verwaltung",
  MAKLER: "Maklertätigkeit",
  SONSTIGES: "Sonstiges",
};

export const AGE_LABELS: Record<AgeRange, string> = {
  A18_29: "18–29",
  A30_39: "30–39",
  A40_49: "40–49",
  A50_59: "50–59",
  A60_PLUS: "60+",
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  KONTAKTIERT: "Kontaktiert (Anruf)",
  EMAIL: "E-Mail",
  MEETING: "Meeting",
  NOTIZ: "Notiz",
  STATUS: "Statusänderung",
};

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  KONTAKTIERT: "📞",
  EMAIL: "✉️",
  MEETING: "🤝",
  NOTIZ: "📝",
  STATUS: "🔀",
};

export const OUTCOME_LABELS: Record<ContactOutcome, string> = {
  NICHT_ERREICHT: "Nicht erreicht / Mailbox",
  VORZIMMER: "An Vorzimmer gescheitert",
  ENTSCHEIDER_NICHT_VOR_ORT: "Entscheider nicht vor Ort",
  RUECKRUF: "Rückruf vereinbart",
  KEIN_INTERESSE: "Kein Interesse",
  TERMIN_SETTING: "Termin vereinbart (Setting)",
  TERMIN_CLOSING: "Termin vereinbart (Closing)",
};

export function entries<K extends string>(rec: Record<K, string>) {
  return Object.entries(rec) as [K, string][];
}
