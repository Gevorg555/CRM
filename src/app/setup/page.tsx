import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SetupForm } from "./form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if ((await prisma.user.count()) > 0) redirect("/login");
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Ersteinrichtung</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Lege das Administrator-Konto an. Weitere Teammitglieder kannst du danach unter „Team“ hinzufügen.
        </p>
        <SetupForm />
      </div>
    </div>
  );
}
