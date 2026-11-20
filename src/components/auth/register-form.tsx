"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  LockKeyhole,
  Phone,
  UserRound,
} from "lucide-react";

import { RecoveryCodeDialog } from "@/components/auth/recovery-code-dialog";
import { SubmitButton } from "@/components/forms/submit-button";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { registerAction, type AuthState } from "@/lib/auth/actions";
import { validateRegisterInput } from "@/lib/auth/validation";
import { useFieldForm } from "@/lib/forms/use-field-form";

const initialState: AuthState = {};
const FIELDS = ["displayName", "phone", "password"] as const;

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter();
  const [turnstileToken, setTurnstileToken] = useState("");
  const {
    state,
    fieldErrors,
    onSubmit,
    markEdited,
    formRef,
    errorId,
    pending,
  } = useFieldForm({
    action: registerAction,
    initialState,
    id: "register",
    fieldOrder: FIELDS,
    validate: (formData) =>
      validateRegisterInput({
        displayName: String(formData.get("displayName") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        password: String(formData.get("password") ?? ""),
      }),
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tạo tài khoản</CardTitle>
          <CardDescription>
            Chỉ cần số điện thoại. Không cần email, không chờ tin nhắn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            onSubmit={onSubmit}
            noValidate
            className="space-y-4"
          >
            <input type="hidden" name="turnstileToken" value={turnstileToken} />

            {state.error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}

            <Field data-invalid={fieldErrors.displayName ? true : undefined}>
              <FieldLabel htmlFor="displayName">Tên hiển thị</FieldLabel>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="displayName"
                  name="displayName"
                  autoComplete="nickname"
                  placeholder="Ví dụ: Minh"
                  className="h-11 pl-9"
                  maxLength={60}
                  required
                  aria-invalid={fieldErrors.displayName ? true : undefined}
                  aria-describedby={
                    fieldErrors.displayName
                      ? errorId("displayName")
                      : undefined
                  }
                  onChange={() => markEdited("displayName")}
                />
              </div>
              <FieldError id={errorId("displayName")}>
                {fieldErrors.displayName}
              </FieldError>
            </Field>

            <Field data-invalid={fieldErrors.phone ? true : undefined}>
              <FieldLabel htmlFor="phone">Số điện thoại</FieldLabel>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0912 345 678"
                  className="h-11 pl-9"
                  required
                  aria-invalid={fieldErrors.phone ? true : undefined}
                  aria-describedby={
                    fieldErrors.phone ? errorId("phone") : undefined
                  }
                  onChange={() => markEdited("phone")}
                />
              </div>
              <FieldError id={errorId("phone")}>{fieldErrors.phone}</FieldError>
            </Field>

            <Field data-invalid={fieldErrors.password ? true : undefined}>
              <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Ít nhất 8 ký tự, có chữ và số"
                  className="h-11 pl-9"
                  required
                  aria-invalid={fieldErrors.password ? true : undefined}
                  aria-describedby={errorId("password")}
                  onChange={() => markEdited("password")}
                />
              </div>
              {fieldErrors.password ? (
                <FieldError id={errorId("password")}>
                  {fieldErrors.password}
                </FieldError>
              ) : (
                <FieldDescription id={errorId("password")} className="text-xs">
                  Mật khẩu cần ít nhất 8 ký tự, có cả chữ và số.
                </FieldDescription>
              )}
            </Field>

            <TurnstileWidget onToken={setTurnstileToken} />

            <SubmitButton className="h-11 w-full" pending={pending}>
              Tạo tài khoản
              <ArrowRight />
            </SubmitButton>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>

      <RecoveryCodeDialog
        open={Boolean(state.recoveryCode)}
        code={state.recoveryCode ?? ""}
        onContinue={() => router.push(next ?? "/onboarding")}
      />
    </>
  );
}
