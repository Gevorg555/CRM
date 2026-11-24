"use client";

import { useState } from "react";
import { inputCls } from "./ui";

/**
 * Datums-/Zeitfeld in Browser-Zeit. Übermittelt einen ISO-Zeitstempel,
 * damit der Server (z. B. in UTC) die richtige Uhrzeit speichert.
 */
export function DateTimeInput({ name, required, defaultValue }: { name: string; required?: boolean; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const iso = value ? new Date(value.length === 10 ? `${value}T09:00` : value).toISOString() : "";
  return (
    <>
      <input type="datetime-local" className={inputCls} value={value} required={required} onChange={(e) => setValue(e.target.value)} />
      <input type="hidden" name={name} value={iso} />
    </>
  );
}

export function quickDate(daysFromNow: number, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
