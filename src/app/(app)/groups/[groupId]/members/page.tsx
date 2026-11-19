import { notFound } from "next/navigation";
import { UsersRound } from "lucide-react";

import { MemberActions } from "@/components/groups/member-actions";
import { RoleBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { format } from "date-fns";
import { initials } from "@/lib/format";
import { getGroup } from "@/lib/queries";
import type { GroupRole } from "@/lib/types";

export default async function GroupMembersPage(
  props: PageProps<"/groups/[groupId]/members">,
) {
  const { groupId } = await props.params;
  const [data, user] = await Promise.all([getGroup(groupId), getCurrentUser()]);
  if (!data || !user) notFound();

  const { members, my_role } = data;
  const actorRole = (my_role ?? "member") as GroupRole;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Thành viên</h2>
        <p className="text-sm text-muted-foreground">
          {members.length} thành viên đang hoạt động.
        </p>
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {members.map((member) => (
            <div key={member.user_id} className="flex items-center gap-3 p-3.5">
              <Avatar className="size-10">
                {member.profile?.avatar_url ? (
                  <AvatarImage
                    src={member.profile.avatar_url}
                    alt={member.profile.display_name}
                  />
                ) : null}
                <AvatarFallback>
                  {initials(member.profile?.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-medium">
                    {member.profile?.display_name ?? "Thành viên"}
                  </p>
                  {member.user_id === user.id ? (
                    <Badge variant="outline">Bạn</Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Tham gia {format(new Date(member.joined_at), "dd/MM/yyyy")}
                </p>
              </div>
              <RoleBadge role={member.role} />
              <MemberActions
                groupId={groupId}
                userId={member.user_id}
                role={member.role}
                actorRole={actorRole}
                actorId={user.id}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {members.length === 0 ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <UsersRound className="size-4" />
          Chưa có thành viên.
        </div>
      ) : null}
    </div>
  );
}
