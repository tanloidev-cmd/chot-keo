import Link from "next/link";

import { BottomNav, DesktopNav } from "@/components/main-nav";
import { NotificationBell } from "@/components/notification-bell";
import { OfflineBanner } from "@/components/offline-banner";
import { UserMenu } from "@/components/user-menu";
import type { Profile } from "@/lib/types";

export function AppShell({
  profile,
  phone,
  unread,
  children,
}: {
  profile: Profile | null;
  phone: string | null;
  unread: number;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh pb-24 md:pb-8">
      <OfflineBanner />
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link href="/home" className="mr-2 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              CK
            </span>
            <span className="text-lg font-semibold tracking-tight">Chốt Kèo</span>
          </Link>
          <div className="hidden flex-1 md:block">
            <DesktopNav />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell unread={unread} />
            <UserMenu profile={profile} phone={phone} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-5">{children}</main>
      <BottomNav />
    </div>
  );
}
