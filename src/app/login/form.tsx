"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Field, inputCls } from "@/components/ui";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      <Field label="E-Mail">
        <input name="email" type="email" required autoFocus className={inputCls} />
      </Field>
      <Field label="Passwort">
        <input name="password" type="password" required className={inputCls} />
      </Field>
      <SubmitButton className="w-full" pendingText="Anmelden …">Anmelden</SubmitButton>
    </form>
  );
}
