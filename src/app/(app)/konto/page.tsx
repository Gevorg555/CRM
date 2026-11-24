import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { PasswordForm } from "./form";

export default async function KontoPage() {
  const user = await requireUser();
  return (
    <div className="max-w-md">
      <PageHeader title="Mein Konto" subtitle={`${user.name} · ${user.email}`} />
      <Card title="Passwort ändern">
        <PasswordForm />
      </Card>
    </div>
  );
}
