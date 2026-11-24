import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if ((await prisma.user.count()) === 0) redirect("/setup");
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Anmelden</h1>
        <p className="mb-6 text-sm text-zinc-500">Willkommen zurück im CRM.</p>
        <LoginForm />
      </div>
    </div>
  );
}
