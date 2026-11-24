import { logout } from "@/app/actions/auth";
import { Nav } from "@/components/nav";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { endOfTodayBerlin } from "@/lib/format";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const dueCount = await prisma.task.count({
    where: { done: false, assigneeId: user.id, dueDate: { lte: endOfTodayBerlin() } },
  });
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-zinc-200 bg-white px-3 py-5">
        <div className="mb-6 px-3 text-lg font-bold tracking-tight text-indigo-700">CRM</div>
        <Nav isAdmin={user.role === "ADMIN"} dueCount={dueCount} />
        <div className="mt-auto border-t border-zinc-100 px-3 pt-4 text-sm">
          <div className="font-medium text-zinc-800">{user.name}</div>
          <div className="truncate text-xs text-zinc-500">{user.email}</div>
          <div className="mt-2 flex gap-3 text-xs">
            <a href="/konto" className="text-zinc-500 hover:text-zinc-800">Konto</a>
            <form action={logout}>
              <button className="text-zinc-500 hover:text-zinc-800">Abmelden</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
