import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
        404
      </span>
      <div>
        <h1 className="text-xl font-semibold">Không tìm thấy trang</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trang bạn mở không tồn tại, hoặc bạn không có quyền truy cập.
        </p>
      </div>
      <Button asChild>
        <Link href="/home">Về trang chủ</Link>
      </Button>
    </div>
  );
}
