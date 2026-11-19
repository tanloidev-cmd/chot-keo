"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { AlertCircle, ArrowRight, KeyRound, LockKeyhole, Phone } from "lucide-react";

import { RecoveryCodeDialog } from "@/components/auth/recovery-code-dialog";
import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordWithCodeAction, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = {};

export function ForgotPasswordForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(
    resetPasswordWithCodeAction,
    initialState,
  );

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
          <form action={formAction} className="space-y-4">
            {state.error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}

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
              <Label htmlFor="code">Mã khôi phục</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="code"
                  name="code"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="h-11 pl-9 font-mono uppercase tracking-wider"
                  autoComplete="one-time-code"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
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
            </div>

            <SubmitButton className="h-11 w-full">
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
        description="Mã cũ đã được thay thế. Hãy lưu mã mới này để dùng cho lần sau."
        continueLabel="Về trang đăng nhập"
        onContinue={() => router.push("/login")}
      />
    </>
  );
}
