import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NotificationBell({ unread }: { unread: number }) {
  return (
    <Button asChild variant="ghost" size="icon" className="relative rounded-full">
      <Link href="/notifications" aria-label={`Thông báo (${unread} chưa đọc)`}>
        <Bell />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
