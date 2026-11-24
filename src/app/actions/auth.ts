"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/session";

export type FormState = { error?: string; ok?: string } | undefined;

async function startSession(userId: string) {
  const token = await createSessionToken(userId);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "E-Mail oder Passwort falsch" };
  }
  await startSession(user.id);
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

/** Ersteinrichtung: nur möglich, solange noch kein Benutzer existiert. */
export async function setupAdmin(_: FormState, fd: FormData): Promise<FormState> {
  if ((await prisma.user.count()) > 0) return { error: "Die Einrichtung wurde bereits abgeschlossen" };
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!name || !email) return { error: "Bitte Name und E-Mail angeben" };
  if (password.length < 8) return { error: "Das Passwort muss mindestens 8 Zeichen haben" };
  const user = await prisma.user.create({
    data: { name, email, role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) },
  });
  await startSession(user.id);
  redirect("/");
}

export async function changeOwnPassword(_: FormState, fd: FormData): Promise<FormState> {
  const { requireUser } = await import("@/lib/auth");
  const me = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: "Aktuelles Passwort ist falsch" };
  if (next.length < 8) return { error: "Das neue Passwort muss mindestens 8 Zeichen haben" };
  await prisma.user.update({ where: { id: me.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: "Passwort geändert" };
}
