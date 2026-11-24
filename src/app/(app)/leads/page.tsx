import type { Prisma } from "@prisma/client";
import { AgeRange, CoreBusiness, LeadSource, LeadStatus } from "@prisma/client";
import Link from "next/link";
import { ButtonLink, PageHeader, StatusBadge, cx, inputCls, btn } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate, personName } from "@/lib/format";
import { AGE_LABELS, CORE_BUSINESS_LABELS, SOURCE_LABELS, STATUS_LABELS, entries } from "@/lib/labels";
import { phoneHref } from "@/lib/normalize";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 50;

type SP = Record<string, string | undefined>;

function pick<T extends string>(v: string | undefined, allowed: Record<string, T>) {
  return v && (Object.values(allowed) as string[]).includes(v) ? (v as T) : undefined;
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser();
  const sp = await searchParams;
  const q = sp.q?.trim();
  const status = pick(sp.status, LeadStatus);
  const cb = pick(sp.cb, CoreBusiness);
  const age = pick(sp.age, AgeRange);
  const source = pick(sp.source, LeadSource);
  const owner = sp.owner || undefined;
  const sort = sp.sort === "company" ? "company" : sp.sort === "created" ? "created" : "updated";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.LeadWhereInput = {
    ...(status && { status }),
    ...(cb && { coreBusiness: { has: cb } }),
    ...(age && { ageRange: age }),
    ...(source && { source }),
    ...(owner && { ownerId: owner === "none" ? null : owner }),
    ...(q && {
      OR: [
        { company: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { city: { contains: q, mode: "insensitive" } },
        { zip: { startsWith: q } },
        { referredBy: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const orderBy: Prisma.LeadOrderByWithRelationInput =
    sort === "company" ? { company: "asc" } : sort === "created" ? { createdAt: "desc" } : { updatedAt: "desc" };

  const [leads, total, users] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { owner: { select: { name: true } } },
    }),
    prisma.lead.count({ where }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (patch: SP) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
    return `/leads?${p.toString()}`;
  };
  const hasFilter = q || status || cb || age || source || owner;

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle={`${total} ${total === 1 ? "Lead" : "Leads"}${hasFilter ? " gefiltert" : ""}`}
        actions={
          <>
            <a href={`/api/export?${new URLSearchParams(sp as Record<string, string>).toString()}`} className={btn.secondary}>
              CSV-Export
            </a>
            <ButtonLink href="/leads/new">+ Neuer Lead</ButtonLink>
          </>
        }
      />

      {/* Status-Reiter */}
      <div className="mb-4 flex flex-wrap gap-1 border-b border-zinc-200">
        {[["", "Alle"] as const, ...entries(STATUS_LABELS)].map(([s, label]) => (
          <Link
            key={s}
            href={qs({ status: s || undefined, page: undefined })}
            className={cx(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
              (status ?? "") === s ? "border-indigo-600 text-indigo-700" : "border-transparent text-zinc-500 hover:text-zinc-800",
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      <form className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8" action="/leads">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="Suche: Firma, Name, E-Mail, Telefon, Ort …" className={cx(inputCls, "col-span-2")} />
        <select name="cb" defaultValue={cb ?? ""} className={inputCls}>
          <option value="">Kerngeschäft</option>
          {entries(CORE_BUSINESS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select name="age" defaultValue={age ?? ""} className={inputCls}>
          <option value="">Alter</option>
          {entries(AGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select name="source" defaultValue={source ?? ""} className={inputCls}>
          <option value="">Quelle</option>
          {entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select name="owner" defaultValue={owner ?? ""} className={inputCls}>
          <option value="">Zuständig</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          <option value="none">— niemand —</option>
        </select>
        <select name="sort" defaultValue={sort} className={inputCls} title="Sortierung">
          <option value="updated">Zuletzt bearbeitet</option>
          <option value="created">Neueste zuerst</option>
          <option value="company">Firma A–Z</option>
        </select>
        <button className={btn.primary}>Filtern</button>
      </form>
      {hasFilter && (
        <div className="-mt-2 mb-3 text-right">
          <Link href="/leads" className="text-xs text-zinc-500 hover:underline">Filter zurücksetzen</Link>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Firma</th>
              <th className="px-4 py-2.5 font-medium">Ansprechpartner</th>
              <th className="px-4 py-2.5 font-medium">Telefon</th>
              <th className="px-4 py-2.5 font-medium">Ort</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Kerngeschäft</th>
              <th className="px-4 py-2.5 font-medium">Zuständig</th>
              <th className="px-4 py-2.5 font-medium">Bearbeitet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-zinc-50">
                <td className="px-4 py-2.5 font-medium">
                  <Link href={`/leads/${l.id}`} className="text-indigo-700 hover:underline">
                    {l.company || <span className="italic text-zinc-400">ohne Firma</span>}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  {personName(l) || "—"}
                  {l.position && <div className="text-xs text-zinc-400">{l.position}</div>}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  {l.phone ? <a href={phoneHref(l.phone)} className="text-indigo-600 hover:underline">📞 {l.phone}</a> : "—"}
                </td>
                <td className="px-4 py-2.5">{l.city ?? "—"}</td>
                <td className="px-4 py-2.5"><StatusBadge status={l.status} /></td>
                <td className="px-4 py-2.5 text-xs text-zinc-600">
                  {l.coreBusiness.map((c) => CORE_BUSINESS_LABELS[c]).join(", ") || "—"}
                </td>
                <td className="px-4 py-2.5 text-zinc-600">{l.owner?.name ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">{fmtDate(l.updatedAt)}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                  Keine Leads gefunden. <Link href="/leads/new" className="text-indigo-600 hover:underline">Lead anlegen</Link> oder{" "}
                  <Link href="/import" className="text-indigo-600 hover:underline">CSV importieren</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-zinc-500">Seite {page} von {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link className={btn.secondary} href={qs({ page: String(page - 1) })}>← Zurück</Link>}
            {page < pages && <Link className={btn.secondary} href={qs({ page: String(page + 1) })}>Weiter →</Link>}
          </div>
        </div>
      )}
    </>
  );
}
