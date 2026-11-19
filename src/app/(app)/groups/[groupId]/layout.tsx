import { notFound } from "next/navigation";
import Link from "next/link";
import { Settings2, UserPlus, UsersRound } from "lucide-react";

import { GroupTabs } from "@/components/groups/group-tabs";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { RoleBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";
import { getGroup } from "@/lib/queries";

export default async function GroupLayout(
  props: LayoutProps<"/groups/[groupId]">,
) {
  const { groupId } = await props.params;
  const data = await getGroup(groupId);

  if (!data) notFound();

  const { group, my_role, members } = data;

  return (
    <div>
      <div className="mb-4 rounded-2xl border bg-card p-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-14">
            {group.avatar_url ? (
              <AvatarImage src={group.avatar_url} alt={group.name} />
            ) : null}
            <AvatarFallback className="text-lg">
              {initials(group.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold">{group.name}</h1>
              {my_role ? <RoleBadge role={my_role} /> : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {group.description || "Chưa có mô tả cho nhóm này."}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <UsersRound className="size-3.5" />
              {members.length} thành viên
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button asChild variant="ghost" size="icon" aria-label="Mời thành viên">
              <Link href={`/groups/${group.id}/settings`}>
                <UserPlus />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Cài đặt nhóm">
              <Link href={`/groups/${group.id}/settings`}>
                <Settings2 />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <GroupTabs groupId={group.id} />
      <div className="mt-4">{props.children}</div>

      <RealtimeRefresh
        tables={["availability_entries", "meetups"]}
        filter={`group_id=eq.${group.id}`}
      />
    </div>
  );
}
