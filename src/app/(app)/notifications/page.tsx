import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  markAllNotificationsReadAction,
  markNotificationReadFormAction,
} from "@/lib/actions/meetups";
import { relativeTime } from "@/lib/dates";
import { getNotifications } from "@/lib/queries";

export const metadata: Metadata = { title: "Thông báo" };

export default async function NotificationsPage() {
  const notifications = await getNotifications(80);
  const unread = notifications.filter((item) => !item.read_at).length;

  return (
    <div>
      <PageHeader
        title="Thông báo"
        description={unread > 0 ? `${unread} thông báo chưa đọc` : "Bạn đã xem hết."}
        action={
          unread > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <Button type="submit" size="sm" variant="outline">
                <CheckCheck />
                Đọc tất cả
              </Button>
            </form>
          ) : null
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell />}
          title="Chưa có thông báo"
          description="Khi có kèo mới, RSVP hoặc yêu cầu hủy, thông báo sẽ xuất hiện ở đây."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => {
            const content = (
              <Card
                className={
                  item.read_at
                    ? "transition-colors hover:bg-muted/40"
                    : "border-orange-200 bg-orange-50/50 transition-colors hover:bg-orange-50"
                }
              >
                <CardContent className="flex items-start gap-3 p-3.5">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Bell className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      {!item.read_at ? (
                        <Badge className="bg-primary/10 text-primary">Mới</Badge>
                      ) : null}
                    </div>
                    {item.body ? (
                      <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {relativeTime(item.created_at)}
                    </p>
                  </div>
                  {item.href ? (
                    <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  ) : null}
                </CardContent>
              </Card>
            );

            return (
              <div key={item.id} className="relative">
                {item.href ? (
                  <Link href={item.href} className="block">
                    {content}
                  </Link>
                ) : (
                  content
                )}
                {!item.read_at ? (
                  <form
                    action={markNotificationReadFormAction}
                    className="absolute bottom-2 right-2"
                  >
                    <input type="hidden" name="notificationId" value={item.id} />
                    <Button type="submit" size="xs" variant="ghost">
                      Đã đọc
                    </Button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
