"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowRight, LockKeyhole, Phone } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginAction, type AuthState } from "@/lib/auth/actions";
import { validateLoginInput } from "@/lib/auth/validation";
import { useFieldForm } from "@/lib/forms/use-field-form";

const initialState: AuthState = {};
const FIELDS = ["phone", "password"] as const;

export function LoginForm({ next }: { next?: string }) {
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
    action: loginAction,
    initialState,
    id: "login",
    fieldOrder: FIELDS,
    validate: (formData) =>
      validateLoginInput({
        phone: String(formData.get("phone") ?? ""),
        password: String(formData.get("password") ?? ""),
      }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Đăng nhập</CardTitle>
        <CardDescription>
          Dùng số điện thoại và mật khẩu của bạn.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          onSubmit={onSubmit}
          noValidate
          className="space-y-4"
        >
          <input type="hidden" name="next" value={next ?? "/home"} />
          <input type="hidden" name="turnstileToken" value={turnstileToken} />

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

          <Field data-invalid={fieldErrors.password ? true : undefined}>
            <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Tối thiểu 8 ký tự"
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

          <TurnstileWidget onToken={setTurnstileToken} />

          <div className="flex items-center justify-between text-sm">
            <Link
              href="/forgot-password"
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <SubmitButton className="h-11 w-full" pending={pending}>
            Đăng nhập
            <ArrowRight />
          </SubmitButton>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Đăng ký bằng số điện thoại
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
