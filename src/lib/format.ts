export const TZ = "Europe/Berlin";

export function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("de-DE", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fmtDateTime(d: Date | string) {
  return new Date(d).toLocaleString("de-DE", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Fälligkeit: Datum, Uhrzeit nur wenn nicht 09:00 (Standard) */
export function fmtDue(d: Date | string) {
  const date = new Date(d);
  const time = date.toLocaleTimeString("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
  return time === "09:00" ? fmtDate(date) : `${fmtDate(date)}, ${time} Uhr`;
}

/** Ende des heutigen Tages in Berliner Zeit als Date */
export function endOfTodayBerlin() {
  const now = new Date();
  const ymd = now.toLocaleDateString("sv-SE", { timeZone: TZ }); // YYYY-MM-DD
  const offset = berlinOffsetMinutes(now);
  return new Date(new Date(`${ymd}T23:59:59.999Z`).getTime() - offset * 60000);
}

export function startOfTodayBerlin() {
  return new Date(endOfTodayBerlin().getTime() - 24 * 60 * 60 * 1000 + 1);
}

function berlinOffsetMinutes(d: Date) {
  const s = d.toLocaleString("en-US", { timeZone: TZ, timeZoneName: "shortOffset" });
  const m = s.match(/GMT([+-]\d+)(?::(\d+))?/);
  if (!m) return 60;
  const h = Number(m[1]);
  return h * 60 + Math.sign(h) * Number(m[2] ?? 0);
}

export function leadName(l: { company: string | null; firstName: string | null; lastName: string | null }) {
  return l.company || [l.firstName, l.lastName].filter(Boolean).join(" ") || "Unbenannter Lead";
}

export function personName(l: { firstName: string | null; lastName: string | null }) {
  return [l.firstName, l.lastName].filter(Boolean).join(" ");
}
