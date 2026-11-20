"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  House,
  PartyPopper,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/home", label: "Trang chủ", icon: House },
  { href: "/calendar", label: "Lịch", icon: CalendarDays },
  { href: "/meetups", label: "Kèo", icon: PartyPopper },
  { href: "/groups", label: "Nhóm", icon: Users },
];

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-primary/10 text-primary hover:bg-primary/10",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1.5 safe-bottom">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors",
                active && "text-primary",
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full",
                  active && "bg-primary/10",
                )}
              >
                <Icon className="size-5" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
