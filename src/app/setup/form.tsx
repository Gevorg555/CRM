"use client";

import { useActionState } from "react";
import { setupAdmin } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Field, inputCls } from "@/components/ui";

export function SetupForm() {
  const [state, action] = useActionState(setupAdmin, undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      <Field label="Name">
        <input name="name" required autoFocus className={inputCls} />
      </Field>
      <Field label="E-Mail">
        <input name="email" type="email" required className={inputCls} />
      </Field>
      <Field label="Passwort (mind. 8 Zeichen)">
        <input name="password" type="password" required minLength={8} className={inputCls} />
      </Field>
      <SubmitButton className="w-full">Konto anlegen</SubmitButton>
    </form>
  );
}
