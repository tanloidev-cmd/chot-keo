"use client";

import { useState, useTransition } from "react";
import { KeyRound, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { RecoveryCodeDialog } from "@/components/auth/recovery-code-dialog";
import { Button } from "@/components/ui/button";
import { regenerateRecoveryCodeAction } from "@/lib/auth/actions";

export function RecoveryCodeCard() {
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3">
        <KeyRound className="mt-0.5 size-5 text-primary" />
        <div className="text-sm">
          <p className="font-medium">Mã khôi phục</p>
          <p className="text-muted-foreground">
            Dùng khi quên mật khẩu. Mã chỉ hiển thị một lần khi tạo. Tạo mã mới sẽ
            vô hiệu hóa mã cũ.
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await regenerateRecoveryCodeAction();
            if (result.error) toast.error(result.error);
            else if (result.recoveryCode) setCode(result.recoveryCode);
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        Tạo mã khôi phục mới
      </Button>

      <RecoveryCodeDialog
        open={Boolean(code)}
        code={code}
        title="Mã khôi phục mới"
        description="Mã cũ đã bị vô hiệu hóa. Hãy lưu mã này ở nơi an toàn."
        continueLabel="Tôi đã lưu"
        onContinue={() => setCode("")}
      />
    </div>
  );
}
