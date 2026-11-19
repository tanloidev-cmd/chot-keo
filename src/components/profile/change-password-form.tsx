"use client";

import { useActionState } from "react";
import { AlertCircle, KeyRound } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = {};

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
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

      <div className="space-y-2">
        <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          className="h-11"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">Mật khẩu mới</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Ít nhất 8 ký tự, có chữ và số"
          className="h-11"
          required
        />
      </div>

      <SubmitButton>
        <KeyRound />
        Đổi mật khẩu
      </SubmitButton>
    </form>
  );
}
