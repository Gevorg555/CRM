"use client";

import { useActionState, useState, useTransition } from "react";
import type { ActivityFormState } from "@/app/actions/leads";
import { OUTCOME_LABELS, entries } from "@/lib/labels";
import { DateTimeInput, quickDate } from "./datetime-input";
import { Alert, btn, cx, inputCls } from "./ui";

const TYPES = [
  { v: "KONTAKTIERT", label: "📞 Kontaktiert" },
  { v: "EMAIL", label: "✉️ E-Mail" },
  { v: "MEETING", label: "🤝 Meeting" },
  { v: "NOTIZ", label: "📝 Notiz" },
] as const;

export function ActivityForm({ action }: { action: (s: ActivityFormState, fd: FormData) => Promise<ActivityFormState> }) {
  const [state, formAction] = useActionState(action, undefined);
  // Nach erfolgreichem Speichern Formular neu aufbauen (leeren)
  return <Inner key={state?.ok ?? 0} state={state} formAction={formAction} />;
}

function Inner({ state, formAction }: { state: ActivityFormState; formAction: (fd: FormData) => void }) {
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<string>("KONTAKTIERT");
  const [outcome, setOutcome] = useState<string>("");
  const [followUp, setFollowUp] = useState(false);
  const [followDefault, setFollowDefault] = useState(quickDate(1));

  const today = new Date().toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
  const needsDate = outcome === "RUECKRUF" || outcome === "TERMIN_SETTING" || outcome === "TERMIN_CLOSING";
  const showFollow = (type === "KONTAKTIERT" && needsDate) || followUp;
  const dateLabel =
    outcome === "RUECKRUF" ? "Rückruf am" : outcome.startsWith("TERMIN") ? "Termin am" : "Wiedervorlage am";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="space-y-3"
    >
      <input type="hidden" name="type" value={type} />
      <div className="flex flex-wrap items-center gap-1.5">
        {TYPES.map((t) => (
          <button
            key={t.v}
            type="button"
            onClick={() => setType(t.v)}
            className={cx(
              "rounded-md border px-3 py-1.5 text-sm",
              type === t.v ? "border-indigo-500 bg-indigo-50 font-medium text-indigo-700" : "border-zinc-300 text-zinc-600 hover:bg-zinc-50",
            )}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-500">📅 {today} (automatisch)</span>
      </div>

      {type === "KONTAKTIERT" && (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {entries(OUTCOME_LABELS).map(([k, l]) => (
            <label
              key={k}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
            >
              <input
                type="radio"
                name="outcome"
                value={k}
                checked={outcome === k}
                onChange={() => {
                  setOutcome(k);
                  setFollowDefault(quickDate(k === "RUECKRUF" ? 1 : 7, k === "RUECKRUF" ? 10 : 9));
                }}
                className="accent-indigo-600"
              />
              {l}
            </label>
          ))}
        </div>
      )}

      {type === "KONTAKTIERT" && outcome === "TERMIN_CLOSING" && (
        <Alert kind="warn">Der Lead wird automatisch auf <b>Closing</b> gesetzt.</Alert>
      )}
      {type === "KONTAKTIERT" && outcome === "KEIN_INTERESSE" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="markLost" defaultChecked className="accent-indigo-600" />
          Lead als <b>Verloren</b> markieren
        </label>
      )}

      <textarea
        name="note"
        rows={3}
        placeholder={type === "KONTAKTIERT" ? "Notiz zum Gespräch (optional) …" : "Notiz …"}
        className={inputCls}
      />

      {showFollow ? (
        <div className="grid gap-2 rounded-md bg-zinc-50 p-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600">{dateLabel}</span>
            <DateTimeInput key={followDefault} name="followUpDate" defaultValue={followDefault} required={needsDate && type === "KONTAKTIERT"} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600">Titel der Wiedervorlage (optional)</span>
            <input name="followUpTitle" className={inputCls} placeholder="wird automatisch erzeugt" />
          </label>
          <div className="flex flex-wrap gap-1 sm:col-span-2">
            {[
              ["Morgen", 1],
              ["In 3 Tagen", 3],
              ["In 1 Woche", 7],
              ["In 2 Wochen", 14],
              ["In 1 Monat", 30],
            ].map(([l, d]) => (
              <button key={l} type="button" className={btn.ghost} onClick={() => setFollowDefault(quickDate(d as number))}>
                {l}
              </button>
            ))}
            {!needsDate && (
              <button type="button" className={cx(btn.ghost, "ml-auto")} onClick={() => setFollowUp(false)}>
                Keine Wiedervorlage
              </button>
            )}
          </div>
        </div>
      ) : (
        <button type="button" className={btn.ghost} onClick={() => setFollowUp(true)}>
          ⏰ + Wiedervorlage setzen
        </button>
      )}

      {state?.error && <Alert kind="error">{state.error}</Alert>}
      <div className="flex justify-end">
        <button type="submit" className={btn.primary} disabled={pending}>
          {pending ? "Speichern …" : "Eintrag speichern"}
        </button>
      </div>
    </form>
  );
}
