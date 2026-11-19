"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = {};

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(registerAction, initialState);
  const [turnstileToken, setTurnstileToken] = useState("");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tạo tài khoản</CardTitle>
          <CardDescription>
            Chỉ cần số điện thoại. Không cần email, không chờ mã SMS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="turnstileToken" value={turnstileToken} />

            {state.error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="displayName">Tên hiển thị</Label>
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
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
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Mật khẩu cần ít nhất 8 ký tự, có cả chữ và số.
              </p>
            </div>

            <TurnstileWidget onToken={setTurnstileToken} />

            <SubmitButton className="h-11 w-full">
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
