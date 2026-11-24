"use client";

import { useFormStatus } from "react-dom";
import { btn, cx } from "./ui";

export function SubmitButton({
  children,
  variant = "primary",
  className,
  name,
  value,
  pendingText = "Speichern …",
}: {
  children: React.ReactNode;
  variant?: keyof typeof btn;
  className?: string;
  name?: string;
  value?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={cx(btn[variant], className)}>
      {pending ? pendingText : children}
    </button>
  );
}

export function ConfirmSubmit({ children, message, className }: { children: React.ReactNode; message: string; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
