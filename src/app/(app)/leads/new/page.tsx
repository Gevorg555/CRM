import { createLead } from "@/app/actions/leads";
import { LeadForm } from "@/components/lead-form";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function NewLeadPage() {
  const user = await requireUser();
  const users = await prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  return (
    <div className="max-w-3xl">
      <PageHeader title="Neuer Lead" />
      <LeadForm action={createLead} users={users} currentUserId={user.id} cancelHref="/leads" />
    </div>
  );
}
