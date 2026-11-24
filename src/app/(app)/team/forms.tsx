"use client";

import { useActionState, useState } from "react";
import { createUser, resetPassword } from "@/app/actions/team";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Field, btn, inputCls } from "@/components/ui";

export function CreateUserForm() {
  const [state, action] = useActionState(createUser, undefined);
  return (
    <form action={action} className="space-y-3">
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="ok">{state.ok}</Alert>}
      <Field label="Name"><input name="name" required className={inputCls} /></Field>
      <Field label="E-Mail"><input name="email" type="email" required className={inputCls} /></Field>
      <Field label="Startpasswort (mind. 8 Zeichen)"><input name="password" required minLength={8} className={inputCls} /></Field>
      <Field label="Rolle">
        <select name="role" className={inputCls}>
          <option value="MEMBER">Mitglied</option>
          <option value="ADMIN">Admin (darf Team verwalten)</option>
        </select>
      </Field>
      <SubmitButton>Anlegen</SubmitButton>
      <p className="text-xs text-zinc-500">Gib das Startpasswort persönlich weiter. Es kann danach unter „Konto“ geändert werden.</p>
    </form>
  );
}

export function ResetPasswordForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(resetPassword, undefined);
  if (!open) {
    return (
      <button className="text-xs text-zinc-500 hover:text-zinc-800" onClick={() => setOpen(true)}>
        Passwort setzen
      </button>
    );
  }
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="password" placeholder="Neues Passwort" minLength={8} required className={inputCls + " w-40 py-1"} />
      <button className={btn.secondary + " py-1"}>OK</button>
      {state?.ok && <span className="text-xs text-emerald-600">✓</span>}
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
