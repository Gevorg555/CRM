import { notFound } from "next/navigation";
import { updateLead } from "@/app/actions/leads";
import { LeadForm } from "@/components/lead-form";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leadName } from "@/lib/format";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [lead, users] = await Promise.all([
    prisma.lead.findUnique({ where: { id } }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!lead) notFound();
  return (
    <div className="max-w-3xl">
      <PageHeader title={`${leadName(lead)} bearbeiten`} />
      <LeadForm action={updateLead.bind(null, id)} lead={lead} users={users} currentUserId={user.id} cancelHref={`/leads/${id}`} />
    </div>
  );
}
