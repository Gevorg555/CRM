"use client";

import { useActionState } from "react";
import { changeOwnPassword } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Field, inputCls } from "@/components/ui";

export function PasswordForm() {
  const [state, action] = useActionState(changeOwnPassword, undefined);
  return (
    <form action={action} className="space-y-3">
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="ok">{state.ok}</Alert>}
      <Field label="Aktuelles Passwort"><input name="current" type="password" required className={inputCls} /></Field>
      <Field label="Neues Passwort (mind. 8 Zeichen)"><input name="next" type="password" minLength={8} required className={inputCls} /></Field>
      <SubmitButton>Ändern</SubmitButton>
    </form>
  );
}
