"use client";

import { AlertCircle, KeyRound } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { changePasswordAction, type AuthState } from "@/lib/auth/actions";
import { useFieldForm } from "@/lib/forms/use-field-form";

const initialState: AuthState = {};
const FIELDS = ["currentPassword", "newPassword"] as const;

export function ChangePasswordForm() {
  const {
    state,
    fieldErrors,
    onSubmit,
    markEdited,
    formRef,
    errorId,
    pending,
  } = useFieldForm({
    action: changePasswordAction,
    initialState,
    id: "change-password",
    fieldOrder: FIELDS,
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertDescription className="text-emerald-900">
            {state.success}
          </AlertDescription>
        </Alert>
      ) : null}

      <Field data-invalid={fieldErrors.currentPassword ? true : undefined}>
        <FieldLabel htmlFor="currentPassword">Mật khẩu hiện tại</FieldLabel>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          className="h-11"
          required
          aria-invalid={fieldErrors.currentPassword ? true : undefined}
          aria-describedby={
            fieldErrors.currentPassword ? errorId("currentPassword") : undefined
          }
          onChange={() => markEdited("currentPassword")}
        />
        <FieldError id={errorId("currentPassword")}>
          {fieldErrors.currentPassword}
        </FieldError>
      </Field>

      <Field data-invalid={fieldErrors.newPassword ? true : undefined}>
        <FieldLabel htmlFor="newPassword">Mật khẩu mới</FieldLabel>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Ít nhất 8 ký tự, có chữ và số"
          className="h-11"
          required
          aria-invalid={fieldErrors.newPassword ? true : undefined}
          aria-describedby={
            fieldErrors.newPassword ? errorId("newPassword") : undefined
          }
          onChange={() => markEdited("newPassword")}
        />
        <FieldError id={errorId("newPassword")}>
          {fieldErrors.newPassword}
        </FieldError>
      </Field>

      <SubmitButton pending={pending}>
        <KeyRound />
        Đổi mật khẩu
      </SubmitButton>
    </form>
  );
}
