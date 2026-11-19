import { notFound } from "next/navigation";

import { EditGroupForm } from "@/components/groups/edit-group-form";
import { GroupAvatarUploader } from "@/components/groups/group-avatar-uploader";
import { GroupDangerZone } from "@/components/groups/group-danger-zone";
import { InviteManager } from "@/components/groups/invite-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGroup } from "@/lib/queries";

export default async function GroupSettingsPage(
  props: PageProps<"/groups/[groupId]/settings">,
) {
  const { groupId } = await props.params;
  const data = await getGroup(groupId);
  if (!data) notFound();

  const { group, my_role, invites } = data;
  const canManage = my_role === "owner" || my_role === "admin";
  const isOwner = my_role === "owner";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin nhóm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManage ? (
            <GroupAvatarUploader
              groupId={group.id}
              groupName={group.name}
              avatarUrl={group.avatar_url}
            />
          ) : null}
          {canManage ? (
            <EditGroupForm group={group} />
          ) : (
            <div className="rounded-xl border p-4">
              <p className="font-medium">{group.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {group.description || "Chưa có mô tả"}
              </p>
              {group.rules ? (
                <p className="mt-2 whitespace-pre-line rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                  Quy tắc: {group.rules}
                </p>
              ) : null}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Múi giờ nhóm: {group.timezone}
          </p>
        </CardContent>
      </Card>

      <InviteManager
        groupId={group.id}
        invites={invites}
        canManage={canManage}
      />

      <GroupDangerZone groupId={group.id} isOwner={isOwner} />
    </div>
  );
}
