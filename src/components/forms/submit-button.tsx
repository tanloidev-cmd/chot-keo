"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  className,
  variant,
  disabled,
  pending: pendingProp,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  disabled?: boolean;
  /**
   * Pending state for forms that dispatch their action themselves instead of
   * using the form `action` prop, where `useFormStatus` cannot see the request.
   */
  pending?: boolean;
}) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingProp ?? formPending;

  return (
    <Button
      type="submit"
      className={className}
      variant={variant}
      disabled={pending || disabled}
    >
      {pending ? <Loader2 className="animate-spin" /> : null}
      {children}
    </Button>
  );
}
