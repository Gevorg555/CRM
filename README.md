# CRM – Lead-Management

Web-App für das Team, um Leads zu verwalten. Sie ist gebaut mit **Next.js**, **Prisma** und **PostgreSQL** (Supabase).

## Funktionen

- **Leads**: Kontaktdaten, Quelle (bei „Empfehlung“ mit *Empfohlen von*), Zuständig
- **Rahmeninformationen (ICP)**: Kerngeschäft, Anzahl Mitarbeiter, verwaltete Objekte, Einheiten, geschätztes Alter
- **Pipeline**: Setting → Closing → Abgeschlossen, dazu *Verloren*
- **Aktivitäten-Verlauf**: Kontaktiert (mit Ergebnis), E-Mail, Meeting, Notiz. Datum und Bearbeiter werden automatisch gesetzt.
  - *Termin vereinbart (Closing)* setzt den Lead automatisch auf **Closing**
  - *Kein Interesse* bietet an, den Lead auf **Verloren** zu setzen
  - *Rückruf* und *Termin* legen direkt eine Wiedervorlage an
- **Wiedervorlagen** mit Fälligkeitsdatum. Die Übersicht zeigt „Heute fällig / Überfällig“.
- **Klick-zum-Anrufen** (`tel:`) und **Klick-zum-Mailen** (`mailto:`)
- **Duplikat-Erkennung** über E-Mail, Telefon (normalisiert) und Firmenname, beim Anlegen und beim Import
- **CSV-Import** mit automatischer Spalten-Erkennung, Excel-Umlauten und einer Entscheidung pro Duplikat: überspringen, zusammenführen oder neu anlegen
- **CSV-Export** (Excel-kompatibel, berücksichtigt die aktiven Filter)
- **Team-Login**: Der Admin legt Teammitglieder an

## Lokal starten

Voraussetzungen: Node.js 20+ und eine PostgreSQL-Datenbank (lokal oder Supabase).

```bash
npm install
cp .env.example .env      # DATABASE_URL, DIRECT_URL und AUTH_SECRET eintragen
npx prisma migrate deploy # Tabellen anlegen
npm run dev
```

Danach <http://localhost:3000> öffnen. Beim ersten Aufruf erscheint die **Ersteinrichtung** für das Admin-Konto.

## Online stellen (Supabase + Vercel)

1. **Supabase**: Auf supabase.com ein Projekt anlegen, Region **Frankfurt (eu-central-1)**.
   Unter *Connect → ORMs → Prisma* stehen die beiden Verbindungs-URLs:
   - `DATABASE_URL`: Transaction Pooler (Port 6543, mit `?pgbouncer=true&connection_limit=1`)
   - `DIRECT_URL`: Session Pooler (Port 5432)
2. **Tabellen** werden beim Build automatisch angelegt bzw. aktualisiert (`prisma migrate deploy` ist Teil von `npm run build`).
3. **Vercel**: Das GitHub-Repo importieren und unter *Environment Variables* `DATABASE_URL`, `DIRECT_URL` und `AUTH_SECRET` setzen.
   Für `AUTH_SECRET` einen zufälligen String verwenden, z. B. aus `openssl rand -base64 32`.
4. Die Vercel-URL öffnen, die Ersteinrichtung durchlaufen und unter **Team** die Kollegen anlegen.

## Projektstruktur

```
prisma/schema.prisma        Datenmodell
src/app/(app)/              Seiten (Übersicht, Leads, Wiedervorlagen, Import, Team, Konto)
src/app/actions/            Server-Logik (Leads, Aktivitäten, Aufgaben, Import, Team, Login)
src/app/api/export/         CSV-Export
src/lib/                    Datenbank, Login, Duplikat-Erkennung, Beschriftungen
src/components/             Formulare und UI-Bausteine
```

Auswahllisten wie Kontakt-Ergebnisse oder Kerngeschäft werden in `prisma/schema.prisma` (Enums) und `src/lib/labels.ts` (Beschriftungen) angepasst.
