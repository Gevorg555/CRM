"use client";

import type { Lead } from "@prisma/client";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import type { LeadFormState } from "@/app/actions/leads";
import { AGE_LABELS, CORE_BUSINESS_LABELS, SOURCE_LABELS, STATUS_LABELS, entries } from "@/lib/labels";
import { Alert, Card, Field, btn, cx, inputCls } from "./ui";

type Props = {
  action: (state: LeadFormState, fd: FormData) => Promise<LeadFormState>;
  lead?: Lead;
  users: { id: string; name: string }[];
  currentUserId: string;
  cancelHref: string;
};

export function LeadForm({ action, lead, users, currentUserId, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, undefined);
  const [pending, startTransition] = useTransition();
  const [source, setSource] = useState<string>(lead?.source ?? "");
  const fe = state?.fieldErrors ?? {};

  // Eigener Submit-Handler, damit das Formular bei Warnungen nicht geleert wird
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => formAction(fd));
  }

  const v = (k: keyof Lead) => {
    const val = lead?.[k];
    return val === null || val === undefined ? "" : String(val);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {state?.error && <Alert kind="error">{state.error}</Alert>}

      {state?.duplicates && state.duplicates.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h3 className="font-semibold text-amber-900">⚠️ Möglicherweise existiert dieser Lead schon</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {state.duplicates.map((d) => (
              <li key={d.id}>
                <Link href={`/leads/${d.id}`} target="_blank" className="font-medium text-indigo-700 hover:underline">
                  {d.company || [d.firstName, d.lastName].filter(Boolean).join(" ")}
                </Link>
                <span className="text-zinc-600">
                  {[d.firstName && d.company ? `${d.firstName} ${d.lastName ?? ""}` : null, d.email, d.phone, d.city]
                    .filter(Boolean)
                    .map((x) => ` · ${x}`)}
                </span>
                <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-xs text-amber-900">
                  gleich: {d.reasons.join(", ")}
                </span>
              </li>
            ))}
          </ul>
          <button type="submit" name="ignoreDuplicates" value="1" className={cx(btn.secondary, "mt-3")} disabled={pending}>
            Trotzdem speichern
          </button>
        </div>
      )}

      <Card title="Kontakt">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Firma" error={fe.company} className="md:col-span-2">
            <input name="company" defaultValue={v("company")} className={inputCls} autoFocus={!lead} />
          </Field>
          <Field label="Vorname">
            <input name="firstName" defaultValue={v("firstName")} className={inputCls} />
          </Field>
          <Field label="Nachname">
            <input name="lastName" defaultValue={v("lastName")} className={inputCls} />
          </Field>
          <Field label="Position">
            <input name="position" defaultValue={v("position")} placeholder="z. B. Geschäftsführer" className={inputCls} />
          </Field>
          <Field label="Telefon" error={fe.phone}>
            <input name="phone" type="tel" defaultValue={v("phone")} className={inputCls} />
          </Field>
          <Field label="E-Mail" error={fe.email}>
            <input name="email" type="email" defaultValue={v("email")} className={inputCls} />
          </Field>
          <Field label="Website">
            <input name="website" defaultValue={v("website")} placeholder="www.…" className={inputCls} />
          </Field>
          <Field label="Straße">
            <input name="street" defaultValue={v("street")} className={inputCls} />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="PLZ">
              <input name="zip" defaultValue={v("zip")} className={inputCls} />
            </Field>
            <Field label="Ort" className="col-span-2">
              <input name="city" defaultValue={v("city")} className={inputCls} />
            </Field>
          </div>
        </div>
      </Card>

      <Card title="Herkunft & Pipeline">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Quelle">
            <select name="source" value={source} onChange={(e) => setSource(e.target.value)} className={inputCls}>
              <option value="">— bitte wählen —</option>
              {entries(SOURCE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          {source === "EMPFEHLUNG" ? (
            <Field label="Empfohlen von">
              <input name="referredBy" defaultValue={v("referredBy")} placeholder="Name der Person" className={inputCls} />
            </Field>
          ) : (
            <div className="hidden md:block" />
          )}
          <Field label="Status">
            <select name="status" defaultValue={lead?.status ?? "SETTING"} className={inputCls}>
              {entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field label="Zuständig">
            <select name="ownerId" defaultValue={lead ? (lead.ownerId ?? "") : currentUserId} className={inputCls}>
              <option value="">— niemand —</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card title="Rahmeninformationen (ICP)">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <span className="mb-1 block text-xs font-medium text-zinc-600">Kerngeschäft</span>
            <div className="flex flex-wrap gap-2">
              {entries(CORE_BUSINESS_LABELS).map(([k, l]) => (
                <label
                  key={k}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
                >
                  <input type="checkbox" name="coreBusiness" value={k} defaultChecked={lead?.coreBusiness.includes(k)} className="accent-indigo-600" />
                  {l}
                </label>
              ))}
            </div>
          </div>
          <Field label="Anzahl Mitarbeiter" error={fe.employeeCount}>
            <input name="employeeCount" inputMode="numeric" defaultValue={v("employeeCount")} className={inputCls} />
          </Field>
          <Field label="Alter des Entscheiders (geschätzt)">
            <select name="ageRange" defaultValue={v("ageRange")} className={inputCls}>
              <option value="">— unbekannt —</option>
              {entries(AGE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field label="Anzahl verwalteter Objekte" error={fe.propertyCount}>
            <input name="propertyCount" inputMode="numeric" defaultValue={v("propertyCount")} className={inputCls} />
          </Field>
          <Field label="Anzahl Einheiten" error={fe.unitCount}>
            <input name="unitCount" inputMode="numeric" defaultValue={v("unitCount")} className={inputCls} />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className={btn.secondary}>Abbrechen</Link>
        <button type="submit" className={btn.primary} disabled={pending}>
          {pending ? "Speichern …" : lead ? "Änderungen speichern" : "Lead anlegen"}
        </button>
      </div>
    </form>
  );
}
