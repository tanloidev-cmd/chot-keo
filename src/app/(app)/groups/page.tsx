import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronRight, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { GroupsToolbar } from "@/components/groups/groups-toolbar";
import { PageHeader } from "@/components/page-header";
import { RoleBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTimeInZone } from "@/lib/dates";
import { initials } from "@/lib/format";
import { getMyGroupsWithMeta } from "@/lib/queries";

export const metadata: Metadata = { title: "Nhóm" };

export default async function GroupsPage() {
  const groups = await getMyGroupsWithMeta();

  return (
    <div>
      <PageHeader
        title="Nhóm của bạn"
        description="Mỗi nhóm có lịch rảnh, kèo và thành viên riêng."
        action={<GroupsToolbar />}
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={<UsersRound />}
          title="Chưa có nhóm nào"
          description="Tạo nhóm đầu tiên hoặc tham gia bằng link mời."
          action={<GroupsToolbar />}
        />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center gap-3 p-4">
                  <Avatar className="size-12">
                    {group.avatar_url ? (
                      <AvatarImage src={group.avatar_url} alt={group.name} />
                    ) : null}
                    <AvatarFallback>{initials(group.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{group.name}</p>
                      <RoleBadge role={group.my_role} />
                    </div>
                    <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <UsersRound className="size-3.5" />
                        {group.member_count} thành viên
                      </span>
                      {group.next_meetup ? (
                        <span className="inline-flex items-center gap-1 truncate">
                          <CalendarDays className="size-3.5" />
                          {group.next_meetup.title}
                        </span>
                      ) : null}
                    </p>
                    {group.next_meetup?.starts_at ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTimeInZone(
                          group.next_meetup.starts_at,
                          group.timezone,
                        )}
                      </p>
                    ) : null}
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="mt-4 text-center">
          <Button asChild variant="link">
            <Link href="/onboarding">Mở trang bắt đầu</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
