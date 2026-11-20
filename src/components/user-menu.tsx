"use client";

import Link from "next/link";
import {
  Bell,
  CalendarClock,
  LogOut,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/auth/actions";
import { formatPhone } from "@/lib/auth/phone";
import { initials } from "@/lib/format";
import type { Profile } from "@/lib/types";

export function UserMenu({
  profile,
  phone,
}: {
  profile: Profile | null;
  phone: string | null;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="size-8">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
            ) : null}
            <AvatarFallback>{initials(profile?.display_name)}</AvatarFallback>
          </Avatar>
          <span className="sr-only">Mở menu tài khoản</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="truncate">{profile?.display_name ?? "Thành viên"}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {formatPhone(phone)}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound />
            Hồ sơ & bảo mật
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/host">
            <CalendarClock />
            Kèo tôi phụ trách
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/notifications">
            <Bell />
            Thông báo
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut />
              Đăng xuất
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
