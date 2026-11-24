"use client";

import { useActionState, useTransition } from "react";
import { createTask } from "@/app/actions/tasks";
import { DateTimeInput, quickDate } from "./datetime-input";
import { Alert, btn, inputCls } from "./ui";

export function TaskForm({
  leadId,
  users,
  defaultAssignee,
}: {
  leadId?: string;
  users: { id: string; name: string }[];
  defaultAssignee: string;
}) {
  const [state, formAction] = useActionState(createTask, undefined);
  const [pending, startTransition] = useTransition();
  return (
    <form
      key={state?.ok ?? "form"}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="space-y-2"
    >
      {leadId && <input type="hidden" name="leadId" value={leadId} />}
      <input name="title" placeholder="Was ist zu tun? z. B. „Angebot nachfassen“" className={inputCls} required />
      <div className="grid grid-cols-2 gap-2">
        <DateTimeInput name="dueDate" defaultValue={quickDate(1)} required />
        <select name="assigneeId" defaultValue={defaultAssignee} className={inputCls}>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      <button className={btn.secondary} disabled={pending}>{pending ? "…" : "+ Wiedervorlage anlegen"}</button>
    </form>
  );
}
