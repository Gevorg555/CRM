import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { ImportWizard } from "./wizard";

export default async function ImportPage() {
  await requireUser();
  return (
    <>
      <PageHeader
        title="CSV-Import"
        subtitle="Leads aus einer CSV-Datei (z. B. aus Excel) importieren – mit Spalten-Zuordnung und Duplikat-Prüfung."
      />
      <ImportWizard />
    </>
  );
}
