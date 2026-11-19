import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Clock,
  MapPin,
  PartyPopper,
  Plus,
  UsersRound,
  Vote,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { MeetupStatusBadge, RsvpBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrentProfile } from "@/lib/auth/session";
import { formatDateTimeInZone } from "@/lib/dates";
import { initials } from "@/lib/format";
import {
  getMeetupAttendeeCounts,
  getMyGroupsWithMeta,
  getMyRsvpMap,
  getUpcomingMeetupsForUser,
} from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const { profile } = await getCurrentProfile();
  const groups = await getMyGroupsWithMeta();
  const { upcoming, proposed } = await getUpcomingMeetupsForUser();

  const allMeetups = [...upcoming, ...proposed];
  const meetupIds = allMeetups.map((meetup) => meetup.id);
  const [rsvpMap, countMap] = await Promise.all([
    getMyRsvpMap(meetupIds),
    getMeetupAttendeeCounts(meetupIds),
  ]);

  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const nextMeetup = upcoming[0] ?? null;
  const nextGroup = nextMeetup ? groupMap.get(nextMeetup.group_id) : null;

  let venue: { name: string; address: string | null } | null = null;
  if (nextMeetup?.confirmed_venue_option_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("meetup_venue_options")
      .select("name, address")
      .eq("id", nextMeetup.confirmed_venue_option_id)
      .maybeSingle();
    venue = data;
  }

  const nextCounts = nextMeetup ? countMap.get(nextMeetup.id) : null;
  const totalMembers = nextGroup?.member_count ?? 0;
  const responded = nextCounts
    ? (nextCounts.going ?? 0) +
      (nextCounts.maybe ?? 0) +
      (nextCounts.not_going ?? 0) +
      (nextCounts.cancelled ?? 0)
    : 0;

  return (
    <div>
      <PageHeader
        title={`Chào ${profile?.display_name ?? "bạn"} 👋`}
        description="Đây là những việc cần bạn để ý hôm nay."
        action={
          <Button asChild size="sm">
            <Link href="/meetups/new">
              <Plus />
              Tạo kèo
            </Link>
          </Button>
        }
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={<UsersRound />}
          title="Bạn chưa có nhóm nào"
          description="Tạo nhóm đầu tiên hoặc tham gia bằng link mời để bắt đầu."
          action={
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/onboarding">Tạo nhóm</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/groups">Nhập link mời</Link>
              </Button>
            </div>
          }
        />
      ) : null}

      {nextMeetup ? (
        <Card className="overflow-hidden border-orange-200">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-xs font-medium text-white">
            Kèo sắp tới
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl">{nextMeetup.title}</CardTitle>
                <CardDescription className="mt-1">
                  {nextGroup?.name ?? "Nhóm"} •{" "}
                  {formatDateTimeInZone(nextMeetup.starts_at, nextGroup?.timezone)}
                </CardDescription>
              </div>
              <MeetupStatusBadge status={nextMeetup.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5 text-sm">
              {venue ? (
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  {venue.name}
                  {venue.address ? (
                    <span className="text-muted-foreground">— {venue.address}</span>
                  ) : null}
                </p>
              ) : null}
              <p className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                {formatDateTimeInZone(nextMeetup.starts_at, nextGroup?.timezone)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-emerald-50 p-2.5">
                <p className="text-lg font-semibold text-emerald-700">
                  {nextCounts?.going ?? 0}
                </p>
                <p className="text-xs text-emerald-700">Sẽ đi</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-2.5">
                <p className="text-lg font-semibold text-amber-700">
                  {nextCounts?.maybe ?? 0}
                </p>
                <p className="text-xs text-amber-700">Có thể</p>
              </div>
              <div className="rounded-xl bg-muted p-2.5">
                <p className="text-lg font-semibold">
                  {Math.max(totalMembers - responded, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Chưa trả lời</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <RsvpBadge status={(rsvpMap.get(nextMeetup.id) as any) ?? null} />
              <Button asChild>
                <Link href={`/meetups/${nextMeetup.id}`}>
                  Xem & RSVP
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : groups.length > 0 ? (
        <EmptyState
          icon={<CalendarPlus />}
          title="Chưa có kèo nào sắp tới"
          description="Tạo kèo mới để cả nhóm bình chọn ngày giờ."
          action={
            <Button asChild>
              <Link href="/meetups/new">
                <Plus />
                Tạo kèo mới
              </Link>
            </Button>
          }
        />
      ) : null}

      {proposed.length > 0 ? (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Vote className="size-4 text-primary" />
              Đang chờ bình chọn
            </h2>
            <Button asChild variant="link" size="sm">
              <Link href="/meetups">Xem tất cả</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {proposed.slice(0, 4).map((meetup) => {
              const group = groupMap.get(meetup.group_id);
              return (
                <Link key={meetup.id} href={`/meetups/${meetup.id}`}>
                  <Card className="transition-colors hover:bg-muted/40">
                    <CardContent className="flex items-center gap-3 p-3.5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                        <PartyPopper className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{meetup.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {group?.name ?? "Nhóm"} •{" "}
                          {meetup.voting_deadline
                            ? `Hạn chốt ${formatDateTimeInZone(
                                meetup.voting_deadline,
                                group?.timezone,
                              )}`
                            : "Chưa đặt hạn"}
                        </p>
                      </div>
                      <Badge variant="secondary">Bình chọn</Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="size-4 text-primary" />
            Nhắc lịch cuối tuần
          </h2>
          <Button asChild variant="link" size="sm">
            <Link href="/calendar">Mở lịch</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">
              Cập nhật lịch rảnh để nhóm dễ chọn ngày. Bạn có thể đánh dấu nhiều
              ngày cùng lúc.
            </p>
            <div className="space-y-2">
              {groups.slice(0, 4).map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-3 rounded-xl border p-2.5"
                >
                  <Avatar className="size-8">
                    {group.avatar_url ? (
                      <AvatarImage src={group.avatar_url} alt={group.name} />
                    ) : null}
                    <AvatarFallback>{initials(group.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.member_count} thành viên
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/groups/${group.id}/calendar`}>
                      Cập nhật
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <RealtimeRefresh tables={["meetups", "meetup_attendees"]} />

      {groups.length > 0 ? (
        <section className="mt-6">
          <Separator className="mb-6" />
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Nhóm của bạn</h2>
            <Button asChild variant="link" size="sm">
              <Link href="/groups">Quản lý</Link>
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {groups.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardContent className="flex items-center gap-3 p-3.5">
                    <Avatar className="size-10">
                      {group.avatar_url ? (
                        <AvatarImage src={group.avatar_url} alt={group.name} />
                      ) : null}
                      <AvatarFallback>{initials(group.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{group.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.member_count} thành viên
                        {group.next_meetup
                          ? ` • ${group.next_meetup.title}`
                          : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
