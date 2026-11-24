"use client";

import Link from "next/link";
import Papa from "papaparse";
import { useMemo, useState, useTransition } from "react";
import { analyzeImport, runImport, type ImportDecision, type RowAnalysis } from "@/app/actions/import";
import { Alert, Card, btn, cx, inputCls } from "@/components/ui";
import { IMPORT_FIELDS, guessMapping, type ImportField, type ImportRow } from "@/lib/import-fields";

type Step = "upload" | "map" | "review" | "done";

/** Excel speichert CSV oft als Windows-1252 – daher erst UTF-8 versuchen, sonst Fallback. */
async function readText(file: File) {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ImportField[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [analysis, setAnalysis] = useState<RowAnalysis[]>([]);
  const [decisions, setDecisions] = useState<ImportDecision[]>([]);
  const [onlyIssues, setOnlyIssues] = useState(true);
  const [result, setResult] = useState<{ created: number; merged: number; skipped: number } | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  async function onFile(file: File) {
    setError("");
    const text = await readText(file);
    const parsed = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
    if (parsed.data.length < 2) {
      setError("Die Datei enthält keine Datenzeilen.");
      return;
    }
    const [head, ...body] = parsed.data;
    setFileName(file.name);
    setHeaders(head.map((h) => h.trim()));
    setData(body);
    setMapping(guessMapping(head));
    setStep("map");
  }

  function buildRows() {
    return data.map((r) => {
      const row: ImportRow = {};
      mapping.forEach((field, i) => {
        if (field === "ignore") return;
        const val = (r[i] ?? "").trim();
        if (!val) return;
        // Mehrere Spalten auf dasselbe Feld (z. B. Notizen) werden zusammengefügt
        row[field] = row[field] ? `${row[field]}\n${val}` : val;
      });
      return row;
    });
  }

  function analyze() {
    const built = buildRows();
    setError("");
    startTransition(async () => {
      try {
        const res = await analyzeImport(built);
        setRows(built);
        setAnalysis(res);
        setDecisions(res.map((a) => (a.error || a.existing.length || a.inFile ? "skip" : "create")));
        setOnlyIssues(res.some((a) => a.error || a.existing.length || a.inFile));
        setStep("review");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fehler bei der Prüfung");
      }
    });
  }

  function doImport() {
    startTransition(async () => {
      try {
        setResult(await runImport(rows, decisions));
        setStep("done");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fehler beim Import");
      }
    });
  }

  const stats = useMemo(() => {
    const s = { create: 0, merge: 0, skip: 0, invalid: 0, dupDb: 0, dupFile: 0 };
    decisions.forEach((d) => (d === "create" ? s.create++ : d === "skip" ? s.skip++ : s.merge++));
    analysis.forEach((a) => {
      if (a.error) s.invalid++;
      else if (a.existing.length) s.dupDb++;
      else if (a.inFile) s.dupFile++;
    });
    return s;
  }, [decisions, analysis]);

  const setAll = (pred: (a: RowAnalysis) => boolean, d: "create" | "skip" | "merge") =>
    setDecisions((prev) =>
      prev.map((cur, i) => {
        const a = analysis[i];
        if (a.error || !pred(a)) return cur;
        if (d === "merge") return a.existing[0] ? { merge: a.existing[0].id } : cur;
        return d;
      }),
    );

  const steps: [Step, string][] = [["upload", "1. Datei"], ["map", "2. Spalten"], ["review", "3. Prüfen"], ["done", "4. Fertig"]];

  return (
    <div className="space-y-6">
      <ol className="flex gap-2 text-sm">
        {steps.map(([s, l]) => (
          <li key={s} className={cx("rounded-full px-3 py-1", step === s ? "bg-indigo-600 text-white" : "bg-zinc-200 text-zinc-600")}>
            {l}
          </li>
        ))}
      </ol>

      {error && <Alert kind="error">{error}</Alert>}

      {step === "upload" && (
        <Card>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-6 py-14 text-center hover:border-indigo-400 hover:bg-indigo-50/40">
            <span className="text-3xl">📄</span>
            <span className="font-medium">CSV-Datei auswählen</span>
            <span className="text-sm text-zinc-500">Trennzeichen (Komma/Semikolon) und Umlaute werden automatisch erkannt. Erste Zeile = Spaltennamen.</span>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
        </Card>
      )}

      {step === "map" && (
        <Card title={`${fileName} · ${data.length} Zeilen – welche Spalte ist was?`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-zinc-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Spalte in der CSV</th>
                  <th className="py-2 pr-4 font-medium">Beispielwerte</th>
                  <th className="py-2 font-medium">Feld im CRM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {headers.map((h, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-4 font-medium">{h || <i className="text-zinc-400">(leer)</i>}</td>
                    <td className="max-w-xs truncate py-2 pr-4 text-zinc-500">
                      {data.slice(0, 3).map((r) => r[i]).filter(Boolean).join(" · ")}
                    </td>
                    <td className="py-2">
                      <select
                        value={mapping[i]}
                        onChange={(e) => setMapping((m) => m.map((x, j) => (j === i ? (e.target.value as ImportField) : x)))}
                        className={cx(inputCls, mapping[i] === "ignore" && "text-zinc-400")}
                      >
                        {(Object.keys(IMPORT_FIELDS) as ImportField[]).map((f) => (
                          <option key={f} value={f}>{IMPORT_FIELDS[f].label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Werte wie Quelle („Empfehlung“), Status, Kerngeschäft („WEG, Miet“) oder Alter („45“ bzw. „40-49“) werden automatisch übersetzt.
            Eine Spalte „Notiz“ wird als Notiz am Lead gespeichert.
          </p>
          <div className="mt-4 flex justify-between">
            <button className={btn.secondary} onClick={() => setStep("upload")}>← Andere Datei</button>
            <button className={btn.primary} onClick={analyze} disabled={pending || mapping.every((m) => m === "ignore")}>
              {pending ? "Prüfe auf Duplikate …" : "Weiter: Prüfen →"}
            </button>
          </div>
        </Card>
      )}

      {step === "review" && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Zeilen gesamt" value={rows.length} />
            <Stat label="Bereits im CRM" value={stats.dupDb} tone="text-amber-600" />
            <Stat label="Doppelt in Datei" value={stats.dupFile} tone="text-amber-600" />
            <Stat label="Ungültig" value={stats.invalid} tone="text-red-600" />
          </div>

          <Card
            title="Was soll mit jeder Zeile passieren?"
            actions={
              <label className="flex items-center gap-2 text-xs text-zinc-600">
                <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} />
                Nur Auffälligkeiten anzeigen
              </label>
            }
          >
            {(stats.dupDb > 0 || stats.dupFile > 0) && (
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-zinc-600">Alle Duplikate:</span>
                <button className={btn.ghost} onClick={() => setAll((a) => a.existing.length > 0 || !!a.inFile, "skip")}>überspringen</button>
                <button className={btn.ghost} onClick={() => setAll((a) => a.existing.length > 0, "merge")}>mit Bestand zusammenführen</button>
                <button className={btn.ghost} onClick={() => setAll((a) => a.existing.length > 0 || !!a.inFile, "create")}>trotzdem neu anlegen</button>
              </div>
            )}
            <div className="max-h-[32rem] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white text-left text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="py-2 pr-3 font-medium">#</th>
                    <th className="py-2 pr-3 font-medium">Firma / Name</th>
                    <th className="py-2 pr-3 font-medium">Kontakt</th>
                    <th className="py-2 pr-3 font-medium">Hinweis</th>
                    <th className="py-2 font-medium">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {rows.map((r, i) => {
                    const a = analysis[i];
                    const issue = a.error || a.existing.length > 0 || a.inFile;
                    if (onlyIssues && !issue) return null;
                    const d = decisions[i];
                    const dv = typeof d === "string" ? d : `merge:${d.merge}`;
                    return (
                      <tr key={i} className={cx(a.error && "bg-red-50/50")}>
                        <td className="py-2 pr-3 text-zinc-400">{i + 2}</td>
                        <td className="py-2 pr-3">
                          <div className="font-medium">{r.company || "—"}</div>
                          <div className="text-xs text-zinc-500">{r.fullName || [r.firstName, r.lastName].filter(Boolean).join(" ")}</div>
                        </td>
                        <td className="py-2 pr-3 text-xs text-zinc-600">
                          {[r.phone, r.email, r.city].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className="py-2 pr-3 text-xs">
                          {a.error && <span className="text-red-600">{a.error}</span>}
                          {a.existing.map((e) => (
                            <div key={e.id} className="text-amber-700">
                              Im CRM:{" "}
                              <Link href={`/leads/${e.id}`} target="_blank" className="underline">{e.label}</Link>{" "}
                              ({e.reasons.join(", ")})
                            </div>
                          ))}
                          {a.inFile && (
                            <div className="text-amber-700">Doppelt mit Zeile {a.inFile.row + 2} ({a.inFile.reasons.join(", ")})</div>
                          )}
                          {!issue && <span className="text-emerald-600">✓ neu</span>}
                        </td>
                        <td className="py-2">
                          <select
                            disabled={!!a.error}
                            value={dv}
                            onChange={(e) => {
                              const val = e.target.value;
                              const next: ImportDecision = val.startsWith("merge:") ? { merge: val.slice(6) } : (val as "create" | "skip");
                              setDecisions((prev) => prev.map((x, j) => (j === i ? next : x)));
                            }}
                            className={cx(inputCls, "py-1 text-xs")}
                          >
                            <option value="create">Neu anlegen</option>
                            <option value="skip">Überspringen</option>
                            {a.existing.map((e) => (
                              <option key={e.id} value={`merge:${e.id}`}>Zusammenführen mit „{e.label}“</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {onlyIssues && !analysis.some((a) => a.error || a.existing.length || a.inFile) && (
                <p className="py-6 text-center text-sm text-emerald-700">Keine Auffälligkeiten – alle Zeilen sind neu. 🎉</p>
              )}
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              „Zusammenführen“ füllt nur leere Felder des bestehenden Leads auf – vorhandene Daten werden nie überschrieben.
            </p>
          </Card>

          <div className="flex items-center justify-between">
            <button className={btn.secondary} onClick={() => setStep("map")}>← Spalten ändern</button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600">
                <b>{stats.create}</b> neu · <b>{stats.merge}</b> zusammenführen · <b>{stats.skip}</b> überspringen
              </span>
              <button className={btn.primary} onClick={doImport} disabled={pending || stats.create + stats.merge === 0}>
                {pending ? "Importiere …" : "Jetzt importieren"}
              </button>
            </div>
          </div>
        </>
      )}

      {step === "done" && result && (
        <Card>
          <div className="py-6 text-center">
            <div className="text-4xl">✅</div>
            <h2 className="mt-2 text-lg font-semibold">Import abgeschlossen</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {result.created} Leads neu angelegt · {result.merged} zusammengeführt · {result.skipped} übersprungen
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Link href="/leads?sort=created" className={btn.primary}>Zu den Leads</Link>
              <button className={btn.secondary} onClick={() => { setStep("upload"); setResult(null); }}>Weitere Datei importieren</button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={cx("mt-1 text-2xl font-semibold tabular-nums", value > 0 && tone)}>{value}</div>
    </div>
  );
}
