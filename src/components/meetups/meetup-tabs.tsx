"use client";

import Link from "next/link";
import { CalendarDays, UsersRound } from "lucide-react";

import { MeetupStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { activityLabel } from "@/lib/format";
import type { Meetup } from "@/lib/types";

type Item = Meetup & {
  group_name: string;
  group_timezone: string;
  going: number;
  maybe: number;
  cancelled: number;
};

function MeetupList({ items, empty }: { items: Item[]; empty: string }) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {empty}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link key={item.id} href={`/meetups/${item.id}`}>
          <Card className="transition-colors hover:bg-muted/40">
            <CardContent className="space-y-2 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.group_name} • {activityLabel(item.activity_type)}
                  </p>
                </div>
                <MeetupStatusBadge status={item.status} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {item.starts_at ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5" />
                    {new Intl.DateTimeFormat("vi-VN", {
                      timeZone: item.group_timezone,
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    }).format(new Date(item.starts_at))}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <UsersRound className="size-3.5" />
                  {item.going} đi • {item.maybe} có thể
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function MeetupTabs({
  proposed,
  upcoming,
  history,
  canCreate,
}: {
  proposed: Item[];
  upcoming: Item[];
  history: Item[];
  canCreate: boolean;
}) {
  return (
    <Tabs defaultValue="upcoming">
      <TabsList className="w-full">
        <TabsTrigger value="upcoming">Sắp tới</TabsTrigger>
        <TabsTrigger value="proposed">Bình chọn</TabsTrigger>
        <TabsTrigger value="history">Lịch sử</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-3">
        <MeetupList
          items={upcoming}
          empty="Chưa có kèo nào sắp tới. Tạo kèo mới để bắt đầu."
        />
      </TabsContent>
      <TabsContent value="proposed" className="mt-3">
        <MeetupList items={proposed} empty="Không có kèo nào đang bình chọn." />
      </TabsContent>
      <TabsContent value="history" className="mt-3">
        <MeetupList items={history} empty="Chưa có kèo nào đã diễn ra hoặc bị hủy." />
      </TabsContent>

      {canCreate ? (
        <div className="mt-4 flex justify-center">
          <Button asChild>
            <Link href="/meetups/new">Tạo kèo mới</Link>
          </Button>
        </div>
      ) : null}
    </Tabs>
  );
}
