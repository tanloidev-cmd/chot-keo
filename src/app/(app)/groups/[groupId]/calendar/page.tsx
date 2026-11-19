import { notFound } from "next/navigation";

import { AvailabilityBoard } from "@/components/availability/availability-board";
import { getCurrentUser } from "@/lib/auth/session";
import { nextWeekendDates, toDateKey } from "@/lib/dates";
import { getGroup, getGroupAvailability } from "@/lib/queries";

export default async function GroupCalendarPage(
  props: PageProps<"/groups/[groupId]/calendar">,
) {
  const { groupId } = await props.params;
  const [data, user] = await Promise.all([getGroup(groupId), getCurrentUser()]);
  if (!data || !user) notFound();

  const dates = nextWeekendDates(6);
  const from = toDateKey(dates[0]);
  const to = toDateKey(dates[dates.length - 1]);
  const entries = await getGroupAvailability(groupId, from, to);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Lịch rảnh cuối tuần</h2>
        <p className="text-sm text-muted-foreground">
          Chạm vào một ngày để xem ai rảnh. Chọn nhiều ngày để cập nhật một lần.
        </p>
      </div>
      <AvailabilityBoard
        groupId={groupId}
        groupName={data.group.name}
        members={data.members}
        entries={entries}
        currentUserId={user.id}
      />
    </div>
  );
}
