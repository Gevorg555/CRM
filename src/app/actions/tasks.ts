"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { FormState } from "./auth";

export async function createTask(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const title = String(fd.get("title") ?? "").trim();
  const due = String(fd.get("dueDate") ?? "");
  const leadId = String(fd.get("leadId") ?? "") || null;
  const assigneeId = String(fd.get("assigneeId") ?? "") || user.id;
  if (!title) return { error: "Bitte einen Titel eingeben" };
  const dueDate = new Date(due.length === 10 ? `${due}T09:00` : due);
  if (!due || Number.isNaN(dueDate.getTime())) return { error: "Bitte ein Fälligkeitsdatum wählen" };
  await prisma.task.create({ data: { title, dueDate, leadId, assigneeId, createdById: user.id } });
  revalidatePath("/", "layout");
  return { ok: String(Date.now()) };
}

export async function toggleTask(fd: FormData) {
  await requireUser();
  const id = String(fd.get("id"));
  const task = await prisma.task.findUniqueOrThrow({ where: { id } });
  await prisma.task.update({
    where: { id },
    data: { done: !task.done, completedAt: task.done ? null : new Date() },
  });
  revalidatePath("/", "layout");
}

export async function deleteTask(fd: FormData) {
  await requireUser();
  await prisma.task.delete({ where: { id: String(fd.get("id")) } });
  revalidatePath("/", "layout");
}
