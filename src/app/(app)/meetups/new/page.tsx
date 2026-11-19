import type { Metadata } from "next";
import Link from "next/link";
import { UsersRound } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { CreateMeetupForm } from "@/components/meetups/create-meetup-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getMyGroups } from "@/lib/queries";

export const metadata: Metadata = { title: "Tạo kèo" };

export default async function NewMeetupPage(
  props: PageProps<"/meetups/new">,
) {
  const groups = await getMyGroups();
  const searchParams = await props.searchParams;
  const groupId =
    typeof searchParams.groupId === "string" ? searchParams.groupId : undefined;

  return (
    <div>
      <PageHeader
        title="Tạo kèo mới"
        description="Đề xuất kèo, thêm phương án ngày giờ và địa điểm."
        backHref={groupId ? `/groups/${groupId}` : "/meetups"}
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={<UsersRound />}
          title="Cần một nhóm trước"
          description="Tạo hoặc tham gia nhóm rồi quay lại tạo kèo."
          action={
            <Button asChild>
              <Link href="/groups">Mở nhóm</Link>
            </Button>
          }
        />
      ) : (
        <CreateMeetupForm
          groups={groups.map((group) => ({ id: group.id, name: group.name }))}
          defaultGroupId={
            groupId && groups.some((group) => group.id === groupId)
              ? groupId
              : groups[0]?.id
          }
        />
      )}
    </div>
  );
}
