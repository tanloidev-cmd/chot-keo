"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="mx-auto max-w-lg border-rose-200">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
          <AlertTriangle />
        </div>
        <div>
          <p className="font-semibold">Không tải được dữ liệu</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Có lỗi khi tải dữ liệu. Thử lại nhé.
          </p>
          {error.digest ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Mã lỗi: {error.digest}
            </p>
          ) : null}
        </div>
        <Button onClick={reset}>
          <RotateCcw />
          Thử lại
        </Button>
      </CardContent>
    </Card>
  );
}
