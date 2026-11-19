import Link from "next/link";
import { CalendarDays, ChevronRight, UsersRound } from "lucide-react";

import { AvailabilityBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDateKey, nextWeekendDates, toDateKey } from "@/lib/dates";
import { initials } from "@/lib/format";
import { getMyGroupsWithMeta } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { AvailabilityEntry } from "@/lib/types";

export default async function CalendarPage() {
  const user = await getCurrentUser();
  const groups = await getMyGroupsWithMeta();
  const dates = nextWeekendDates(1);
  const from = toDateKey(dates[0]);
  const to = toDateKey(dates[dates.length - 1]);

  let entries: AvailabilityEntry[] = [];
  if (user && groups.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("availability_entries")
      .select("*")
      .in(
        "group_id",
        groups.map((group) => group.id),
      )
      .eq("user_id", user.id)
      .gte("local_date", from)
      .lte("local_date", to);
    entries = (data ?? []) as AvailabilityEntry[];
  }

  const entryMap = new Map(
    entries.map((entry) => [`${entry.group_id}:${entry.local_date}`, entry]),
  );

  return (
    <div>
      <PageHeader
        title="Lịch rảnh"
        description="Lịch của bạn và lịch tổng hợp theo từng nhóm."
      />

      <RealtimeRefresh tables={["availability_entries"]} />

      {groups.length === 0 ? (
        <EmptyState
          icon={<CalendarDays />}
          title="Chưa có nhóm để xem lịch"
          description="Tạo hoặc tham gia nhóm trước khi khai báo lịch rảnh."
          action={
            <Button asChild>
              <Link href="/groups">Mở nhóm</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    {group.avatar_url ? (
                      <AvatarImage src={group.avatar_url} alt={group.name} />
                    ) : null}
                    <AvatarFallback>{initials(group.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{group.name}</p>
                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <UsersRound className="size-3.5" />
                      {group.member_count} thành viên
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="icon">
                    <Link
                      href={`/groups/${group.id}/calendar`}
                      aria-label={`Mở lịch ${group.name}`}
                    >
                      <ChevronRight />
                    </Link>
                  </Button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {dates.map((date) => {
                    const key = toDateKey(date);
                    const entry = entryMap.get(`${group.id}:${key}`);
                    return (
                      <Link
                        key={key}
                        href={`/groups/${group.id}/calendar`}
                        className="rounded-xl border p-2.5 transition-colors hover:bg-muted/40"
                      >
                        <p className="text-xs font-medium">
                          {formatDateKey(key)}
                        </p>
                        <div className="mt-1.5">
                          {entry ? (
                            <AvailabilityBadge status={entry.status} />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Chưa khai báo
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <Button asChild variant="outline" className="mt-3 w-full">
                  <Link href={`/groups/${group.id}/calendar`}>
                    Cập nhật lịch nhóm
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
