"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
        <AlertTriangle />
      </span>
      <div>
        <h1 className="text-xl font-semibold">Có lỗi xảy ra</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thử tải lại trang. Nếu vẫn lỗi, báo lại cho người phụ trách ứng dụng.
        </p>
      </div>
      <Button onClick={reset}>
        <RotateCcw />
        Thử lại
      </Button>
    </div>
  );
}
