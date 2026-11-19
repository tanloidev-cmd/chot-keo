"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RecoveryCodeDialog({
  open,
  code,
  title = "Lưu mã khôi phục của bạn",
  description = "Mã này chỉ hiển thị một lần. Bạn cần mã để đặt lại mật khẩu nếu quên.",
  continueLabel = "Tôi đã lưu mã",
  onContinue,
}: {
  open: boolean;
  code: string;
  title?: string;
  description?: string;
  continueLabel?: string;
  onContinue: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Đã copy mã khôi phục");
    } catch {
      toast.error("Không copy được. Hãy chụp màn hình mã này.");
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <KeyRound />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onClick={copy}
          className="flex w-full items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-4 text-left"
        >
          <span className="font-mono text-lg font-semibold tracking-wider">
            {code}
          </span>
          {copied ? <Check className="text-emerald-600" /> : <Copy />}
        </button>

        <p className="text-xs text-muted-foreground">
          Không chia sẻ mã này. Nếu mất cả mật khẩu và mã, bạn cần quản trị viên
          hỗ trợ đặt lại tài khoản.
        </p>

        <DialogFooter>
          <Button type="button" onClick={onContinue} className="w-full">
            {continueLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
