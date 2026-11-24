"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { FormState } from "./auth";

export async function createUser(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const role = fd.get("role") === "ADMIN" ? "ADMIN" : "MEMBER";
  if (!name || !email) return { error: "Bitte Name und E-Mail angeben" };
  if (password.length < 8) return { error: "Das Passwort muss mindestens 8 Zeichen haben" };
  if (await prisma.user.findUnique({ where: { email } })) return { error: "Diese E-Mail ist bereits vergeben" };
  await prisma.user.create({ data: { name, email, role, passwordHash: await bcrypt.hash(password, 10) } });
  revalidatePath("/team");
  return { ok: `${name} wurde angelegt` };
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get("id"));
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "Mindestens 8 Zeichen" };
  await prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  return { ok: "Passwort gesetzt" };
}

export async function deleteUser(fd: FormData) {
  const me = await requireAdmin();
  const id = String(fd.get("id"));
  if (id === me.id) return; // sich selbst nicht löschen
  await prisma.user.delete({ where: { id } });
  revalidatePath("/team");
}
