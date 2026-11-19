import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { MeetupTabs } from "@/components/meetups/meetup-tabs";
import { Button } from "@/components/ui/button";
import {
  getGroup,
  getGroupMeetups,
  getMeetupAttendeeCounts,
} from "@/lib/queries";

export default async function GroupMeetupsPage(
  props: PageProps<"/groups/[groupId]/meetups">,
) {
  const { groupId } = await props.params;
  const [group, meetups] = await Promise.all([
    getGroup(groupId),
    getGroupMeetups(groupId),
  ]);
  if (!group) notFound();

  const counts = await getMeetupAttendeeCounts(meetups.map((meetup) => meetup.id));
  const items = meetups.map((meetup) => {
    const count = counts.get(meetup.id) ?? {};
    return {
      ...meetup,
      group_name: group.group.name,
      group_timezone: group.group.timezone,
      going: count.going ?? 0,
      maybe: count.maybe ?? 0,
      cancelled: count.cancelled ?? 0,
    };
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Kèo của nhóm</h2>
          <p className="text-sm text-muted-foreground">
            Đang bình chọn, đã chốt và lịch sử.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={`/meetups/new?groupId=${group.group.id}`}>
            <Plus />
            Tạo kèo
          </Link>
        </Button>
      </div>

      <MeetupTabs
        proposed={items.filter((item) => item.status === "proposed")}
        upcoming={items.filter((item) =>
          ["confirmed", "in_progress"].includes(item.status),
        )}
        history={items.filter((item) =>
          ["completed", "cancelled", "draft"].includes(item.status),
        )}
        canCreate
      />
    </div>
  );
}
