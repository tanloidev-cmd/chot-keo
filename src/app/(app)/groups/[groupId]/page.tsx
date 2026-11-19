import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  MapPin,
  PartyPopper,
  Plus,
  UsersRound,
  Vote,
} from "lucide-react";

import { MeetupStatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTimeInZone } from "@/lib/dates";
import { initials } from "@/lib/format";
import { getGroup, getMeetupAttendeeCounts } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function GroupOverviewPage(
  props: PageProps<"/groups/[groupId]">,
) {
  const { groupId } = await props.params;
  const data = await getGroup(groupId);
  if (!data) notFound();

  const { group, members, meetups, my_role } = data;
  const upcoming = meetups
    .filter((meetup) => ["confirmed", "in_progress"].includes(meetup.status))
    .sort((a, b) => (a.starts_at ?? "").localeCompare(b.starts_at ?? ""));
  const proposed = meetups.filter((meetup) => meetup.status === "proposed");
  const nextMeetup = upcoming[0] ?? null;

  const counts = nextMeetup
    ? await getMeetupAttendeeCounts([nextMeetup.id])
    : new Map();

  let venue: { name: string; address: string | null } | null = null;
  if (nextMeetup?.confirmed_venue_option_id) {
    const supabase = await createClient();
    const { data: venueData } = await supabase
      .from("meetup_venue_options")
      .select("name, address")
      .eq("id", nextMeetup.confirmed_venue_option_id)
      .maybeSingle();
    venue = venueData;
  }

  const nextCounts = nextMeetup ? counts.get(nextMeetup.id) : null;
  const canManage = my_role === "owner" || my_role === "admin";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-semibold">{members.length}</p>
            <p className="text-xs text-muted-foreground">Thành viên</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-semibold text-sky-700">{proposed.length}</p>
            <p className="text-xs text-muted-foreground">Đang bình chọn</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-semibold text-emerald-700">
              {upcoming.length}
            </p>
            <p className="text-xs text-muted-foreground">Sắp tới</p>
          </CardContent>
        </Card>
      </div>

      {nextMeetup ? (
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>{nextMeetup.title}</CardTitle>
                <CardDescription className="mt-1">
                  {formatDateTimeInZone(nextMeetup.starts_at, group.timezone)}
                </CardDescription>
              </div>
              <MeetupStatusBadge status={nextMeetup.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {venue ? (
              <p className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 text-muted-foreground" />
                {venue.name}
                {venue.address ? ` — ${venue.address}` : ""}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                {nextCounts?.going ?? 0} sẽ đi
              </span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                {nextCounts?.maybe ?? 0} có thể
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                {nextCounts?.cancelled ?? 0} đã hủy
              </span>
            </div>
            <Button asChild className="w-full">
              <Link href={`/meetups/${nextMeetup.id}`}>
                Xem chi tiết & RSVP
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <CalendarPlus className="size-8 text-primary" />
            <div>
              <p className="font-medium">Chưa có kèo sắp tới</p>
              <p className="text-sm text-muted-foreground">
                Tạo kèo để nhóm chọn ngày giờ và địa điểm.
              </p>
            </div>
            <Button asChild>
              <Link href={`/meetups/new?groupId=${group.id}`}>
                <Plus />
                Tạo kèo mới
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {proposed.length > 0 ? (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <Vote className="size-4 text-primary" />
              Đang bình chọn
            </h2>
            <Button asChild variant="link" size="sm">
              <Link href={`/groups/${group.id}/meetups`}>Tất cả</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {proposed.slice(0, 3).map((meetup) => (
              <Link key={meetup.id} href={`/meetups/${meetup.id}`}>
                <Card className="transition-colors hover:bg-muted/40">
                  <CardContent className="flex items-center gap-3 p-3">
                    <PartyPopper className="size-5 text-sky-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{meetup.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {meetup.voting_deadline
                          ? `Hạn chốt ${formatDateTimeInZone(
                              meetup.voting_deadline,
                              group.timezone,
                            )}`
                          : "Chưa đặt hạn bình chọn"}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-2 sm:grid-cols-2">
        <Button asChild variant="outline" className="h-11 justify-start">
          <Link href={`/groups/${group.id}/calendar`}>
            <CalendarDays />
            Cập nhật lịch rảnh
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11 justify-start">
          <Link href={`/groups/${group.id}/members`}>
            <UsersRound />
            Xem thành viên
          </Link>
        </Button>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Thành viên</h2>
        <Card>
          <CardContent className="divide-y p-0">
            {members.slice(0, 5).map((member) => (
              <div key={member.user_id} className="flex items-center gap-3 p-3">
                <Avatar className="size-9">
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
                  <p className="truncate text-sm font-medium">
                    {member.profile?.display_name ?? "Thành viên"}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {canManage ? (
        <Button asChild variant="outline" className="w-full">
          <Link href={`/groups/${group.id}/settings`}>
            Quản lý nhóm & link mời
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
