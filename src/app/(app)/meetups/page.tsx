import type { Metadata } from "next";
import Link from "next/link";
import { PartyPopper } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { MeetupTabs } from "@/components/meetups/meetup-tabs";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getMeetupAttendeeCounts, getMyGroups } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { Meetup } from "@/lib/types";

export const metadata: Metadata = { title: "Meetup" };

export default async function MeetupsPage() {
  const groups = await getMyGroups();

  if (groups.length === 0) {
    return (
      <div>
        <PageHeader title="Meetup" />
        <EmptyState
          icon={<PartyPopper />}
          title="Chưa có nhóm nào"
          description="Tạo nhóm trước khi tạo kèo."
          action={
            <Button asChild>
              <Link href="/groups">Mở nhóm</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const supabase = await createClient();
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const { data } = await supabase
    .from("meetups")
    .select("*")
    .in(
      "group_id",
      groups.map((group) => group.id),
    )
    .order("created_at", { ascending: false });

  const meetups = (data ?? []) as Meetup[];
  const counts = await getMeetupAttendeeCounts(meetups.map((meetup) => meetup.id));

  const items = meetups.map((meetup) => {
    const group = groupMap.get(meetup.group_id);
    const count = counts.get(meetup.id) ?? {};
    return {
      ...meetup,
      group_name: group?.name ?? "Nhóm",
      group_timezone: group?.timezone ?? "Asia/Ho_Chi_Minh",
      going: count.going ?? 0,
      maybe: count.maybe ?? 0,
      cancelled: count.cancelled ?? 0,
    };
  });

  return (
    <div>
      <PageHeader
        title="Meetup"
        description="Kèo đang bình chọn, đã chốt và lịch sử."
        action={
          <Button asChild size="sm">
            <Link href="/meetups/new">Tạo kèo</Link>
          </Button>
        }
      />
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
