// Gemeinsam von Client (Spalten-Zuordnung) und Server (Import) genutzt – keine Server-Imports hier!

export const IMPORT_FIELDS = {
  ignore: { label: "— nicht importieren —", hints: [] },
  company: { label: "Firma", hints: ["firma", "unternehmen", "company", "firmenname", "organisation"] },
  fullName: { label: "Name (Vor- + Nachname)", hints: ["name", "ansprechpartner", "kontakt", "kontaktperson", "full name"] },
  firstName: { label: "Vorname", hints: ["vorname", "first name", "firstname"] },
  lastName: { label: "Nachname", hints: ["nachname", "last name", "lastname", "familienname"] },
  position: { label: "Position", hints: ["position", "funktion", "rolle", "titel", "job"] },
  phone: { label: "Telefon", hints: ["telefon", "tel", "phone", "telefonnummer", "mobil", "handy", "rufnummer"] },
  email: { label: "E-Mail", hints: ["email", "e-mail", "mail", "e mail"] },
  website: { label: "Website", hints: ["website", "webseite", "homepage", "url", "web"] },
  street: { label: "Straße", hints: ["straße", "strasse", "adresse", "anschrift", "street"] },
  zip: { label: "PLZ", hints: ["plz", "postleitzahl", "zip"] },
  city: { label: "Ort", hints: ["ort", "stadt", "city", "wohnort"] },
  source: { label: "Quelle", hints: ["quelle", "source", "herkunft", "kanal"] },
  referredBy: { label: "Empfohlen von", hints: ["empfohlen von", "empfehlung von", "empfehler", "tippgeber"] },
  status: { label: "Status", hints: ["status", "phase", "pipeline"] },
  coreBusiness: { label: "Kerngeschäft", hints: ["kerngeschäft", "kerngeschaeft", "geschäft", "branche", "tätigkeit", "schwerpunkt"] },
  employeeCount: { label: "Anzahl Mitarbeiter", hints: ["mitarbeiter", "anzahl ma", "ma", "employees", "angestellte"] },
  propertyCount: { label: "Anzahl verwalteter Objekte", hints: ["objekte", "anzahl objekte", "verwaltete objekte", "liegenschaften"] },
  unitCount: { label: "Anzahl Einheiten", hints: ["einheiten", "anzahl einheiten", "we", "wohneinheiten"] },
  ageRange: { label: "Alter (geschätzt)", hints: ["alter", "age", "altersgruppe"] },
  note: { label: "Notiz (wird als Notiz angelegt)", hints: ["notiz", "notizen", "bemerkung", "kommentar", "info", "note", "notes"] },
} as const;

export type ImportField = keyof typeof IMPORT_FIELDS;

const norm = (s: string) => s.trim().toLowerCase().replace(/[_\-.:]+/g, " ").replace(/\s+/g, " ");

/** Rät für jede CSV-Spalte das passende Feld (exakte Treffer zuerst). */
export function guessMapping(headers: string[]): ImportField[] {
  const used = new Set<ImportField>();
  const fields = Object.entries(IMPORT_FIELDS) as [ImportField, { hints: readonly string[] }][];
  const result: ImportField[] = headers.map(() => "ignore");

  // 1. exakte Treffer, 2. Teiltreffer
  for (const pass of ["exact", "partial"] as const) {
    headers.forEach((h, i) => {
      if (result[i] !== "ignore") return;
      const n = norm(h);
      for (const [field, { hints }] of fields) {
        if (field === "ignore" || used.has(field)) continue;
        const hit =
          pass === "exact"
            ? hints.some((x) => norm(x) === n)
            : hints.some((x) => x.length > 3 && n.includes(norm(x)));
        if (hit) {
          result[i] = field;
          used.add(field);
          break;
        }
      }
    });
  }
  return result;
}

export type ImportRow = Partial<Record<Exclude<ImportField, "ignore">, string>>;
