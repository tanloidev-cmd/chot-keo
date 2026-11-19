"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, KeyRound, LockKeyhole, Phone } from "lucide-react";

import { RecoveryCodeDialog } from "@/components/auth/recovery-code-dialog";
import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resetPasswordWithCodeAction, type AuthState } from "@/lib/auth/actions";
import { validateRecoveryInput } from "@/lib/auth/validation";
import { useFieldForm } from "@/lib/forms/use-field-form";

const initialState: AuthState = {};
const FIELDS = ["phone", "code", "password"] as const;

export function ForgotPasswordForm() {
  const router = useRouter();
  const {
    state,
    fieldErrors,
    onSubmit,
    markEdited,
    formRef,
    errorId,
    pending,
  } = useFieldForm({
    action: resetPasswordWithCodeAction,
    initialState,
    id: "forgot-password",
    fieldOrder: FIELDS,
    validate: (formData) =>
      validateRecoveryInput({
        phone: String(formData.get("phone") ?? ""),
        code: String(formData.get("code") ?? ""),
        password: String(formData.get("password") ?? ""),
      }),
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Đặt lại mật khẩu</CardTitle>
          <CardDescription>
            Dùng số điện thoại và mã khôi phục bạn đã lưu khi đăng ký.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            onSubmit={onSubmit}
            noValidate
            className="space-y-4"
          >
            {state.error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}

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

            <Field data-invalid={fieldErrors.code ? true : undefined}>
              <FieldLabel htmlFor="code">Mã khôi phục</FieldLabel>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="code"
                  name="code"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="h-11 pl-9 font-mono uppercase tracking-wider"
                  autoComplete="one-time-code"
                  required
                  aria-invalid={fieldErrors.code ? true : undefined}
                  aria-describedby={
                    fieldErrors.code ? errorId("code") : undefined
                  }
                  onChange={() => markEdited("code")}
                />
              </div>
              <FieldError id={errorId("code")}>{fieldErrors.code}</FieldError>
            </Field>

            <Field data-invalid={fieldErrors.password ? true : undefined}>
              <FieldLabel htmlFor="password">Mật khẩu mới</FieldLabel>
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
                  aria-describedby={
                    fieldErrors.password ? errorId("password") : undefined
                  }
                  onChange={() => markEdited("password")}
                />
              </div>
              <FieldError id={errorId("password")}>
                {fieldErrors.password}
              </FieldError>
            </Field>

            <SubmitButton className="h-11 w-full" pending={pending}>
              Đặt lại mật khẩu
              <ArrowRight />
            </SubmitButton>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Nhớ ra mật khẩu?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>

      <RecoveryCodeDialog
        open={Boolean(state.recoveryCode)}
        code={state.recoveryCode ?? ""}
        title="Mã khôi phục mới của bạn"
        description="Mã cũ đã bị thay thế. Hãy lưu mã mới này để dùng cho lần sau."
        continueLabel="Về trang đăng nhập"
        onContinue={() => router.push("/login")}
      />
    </>
  );
}
