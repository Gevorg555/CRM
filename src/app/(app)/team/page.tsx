import { deleteUser } from "@/app/actions/team";
import { ConfirmSubmit } from "@/components/submit-button";
import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { CreateUserForm, ResetPasswordForm } from "./forms";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const me = await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { leads: true } } },
  });
  return (
    <>
      <PageHeader title="Team" subtitle="Teammitglieder anlegen und verwalten" />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <ul className="divide-y divide-zinc-100">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {u.name}{" "}
                    {u.role === "ADMIN" && <span className="ml-1 rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700">Admin</span>}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {u.email} · {u._count.leads} Leads · seit {fmtDate(u.createdAt)}
                  </div>
                </div>
                <ResetPasswordForm id={u.id} />
                {u.id !== me.id && (
                  <form action={deleteUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <ConfirmSubmit
                      message={`${u.name} löschen? Die Leads bleiben erhalten, sind dann aber niemandem zugeordnet.`}
                      className="text-xs text-zinc-400 hover:text-red-600"
                    >
                      Löschen
                    </ConfirmSubmit>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Teammitglied hinzufügen">
          <CreateUserForm />
        </Card>
      </div>
    </>
  );
}
