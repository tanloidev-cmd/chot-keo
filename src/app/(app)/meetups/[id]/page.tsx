import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock,
  MapPin,
  Pencil,
  Sparkles,
  UsersRound,
} from "lucide-react";

import {
  CancellationRequests,
  ConfirmMeetupDialog,
  HostManager,
  MeetupManagerActions,
  RsvpPanel,
  VotePanel,
} from "@/components/meetups/meetup-detail-client";
import { PageHeader } from "@/components/page-header";
import { ShareLinkButton } from "@/components/share-link-button";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { MeetupStatusBadge } from "@/components/status-badge";
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
import { getCurrentUser } from "@/lib/auth/session";
import { dateKeyInZone, formatDateTimeInZone } from "@/lib/dates";
import { activityLabel } from "@/lib/format";
import {
  getAvailabilityCountsForDates,
  getGroup,
  getGroupMembers,
  getMeetupBundle,
} from "@/lib/queries";

export default async function MeetupDetailPage(
  props: PageProps<"/meetups/[id]">,
) {
  const { id } = await props.params;
  const [bundle, user] = await Promise.all([getMeetupBundle(id), getCurrentUser()]);
  if (!bundle || !user) notFound();

  const { meetup, timeOptions, venueOptions, attendees, hosts, cancellations } =
    bundle;
  const [group, members] = await Promise.all([
    getGroup(meetup.group_id),
    getGroupMembers(meetup.group_id),
  ]);

  const myRole = group?.my_role ?? null;
  const isHost = hosts.some((host) => host.user_id === user.id);
  const canManage =
    myRole === "owner" ||
    myRole === "admin" ||
    meetup.created_by === user.id ||
    isHost;

  const optionDates = [
    ...new Set(
      timeOptions.map((option) =>
        dateKeyInZone(option.starts_at, meetup.timezone),
      ),
    ),
  ];
  const availability = await getAvailabilityCountsForDates(
    meetup.group_id,
    optionDates,
  );

  const timeOptionsView = timeOptions.map((option) => {
    const date = dateKeyInZone(option.starts_at, meetup.timezone);
    const counts = availability.get(date) ?? {
      available: 0,
      maybe: 0,
      unavailable: 0,
    };
    return {
      ...option,
      ...counts,
      unknown: Math.max(
        members.length - counts.available - counts.maybe - counts.unavailable,
        0,
      ),
    };
  });

  const counts = {
    going: attendees.filter((a) => a.status === "going").length,
    maybe: attendees.filter((a) => a.status === "maybe").length,
    not_going: attendees.filter((a) => a.status === "not_going").length,
    cancelled: attendees.filter((a) => a.status === "cancelled").length,
  };

  const confirmedTime = timeOptions.find(
    (option) => option.id === meetup.confirmed_time_option_id,
  );
  const confirmedVenue = venueOptions.find(
    (option) => option.id === meetup.confirmed_venue_option_id,
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={meetup.title}
        description={`${meetup.groups?.name ?? "Nhóm"} • ${activityLabel(
          meetup.activity_type,
        )}`}
        backHref={`/groups/${meetup.group_id}/meetups`}
        action={
          <div className="flex items-center gap-2">
            <ShareLinkButton
              path={`/meetups/${meetup.id}`}
              title={meetup.title}
              label="Chia sẻ"
            />
            <MeetupStatusBadge status={meetup.status} />
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <UsersRound className="size-3.5" />
            {members.length} thành viên
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            Tạo bởi {meetup.profiles?.display_name ?? "thành viên"}
          </span>
          {meetup.voting_deadline ? (
            <Badge variant="outline">
              Hạn chốt {formatDateTimeInZone(meetup.voting_deadline, meetup.timezone)}
            </Badge>
          ) : null}
        </div>
        <MeetupManagerActions
          meetupId={meetup.id}
          status={meetup.status}
          canManage={canManage}
        />
      </div>

      {meetup.description ? (
        <Card>
          <CardContent className="p-4 text-sm whitespace-pre-line">
            {meetup.description}
          </CardContent>
        </Card>
      ) : null}

      {meetup.status === "confirmed" ||
      meetup.status === "in_progress" ||
      meetup.status === "completed" ? (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5 text-emerald-600" />
              Kèo đã chốt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              {formatDateTimeInZone(meetup.starts_at, meetup.timezone)}
            </p>
            {confirmedTime?.label ? (
              <p className="text-muted-foreground">{confirmedTime.label}</p>
            ) : null}
            {confirmedVenue ? (
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                {confirmedVenue.name}
                {confirmedVenue.address ? ` — ${confirmedVenue.address}` : ""}
              </p>
            ) : (
              <p className="text-muted-foreground">Chưa chốt địa điểm.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {meetup.status === "draft" ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Kèo đang ở bản nháp</CardTitle>
            <CardDescription>
              Kiểm tra phương án rồi bấm “Gửi đề xuất” để cả nhóm bình chọn.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {meetup.status === "proposed" ? (
        <>
          <VotePanel
            meetupId={meetup.id}
            timezone={meetup.timezone}
            timeOptions={timeOptionsView}
            venueOptions={venueOptions}
            myTimeVoteId={bundle.myTimeVoteId}
            myVenueVoteId={bundle.myVenueVoteId}
            memberCount={members.length}
          />

        </>
      ) : null}

      {canManage && (meetup.status === "proposed" || meetup.status === "draft") ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Chốt kèo</CardTitle>
            <CardDescription>
              Chọn một phương án và xác nhận để mở RSVP.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConfirmMeetupDialog
              meetupId={meetup.id}
              timeOptions={timeOptionsView}
              venueOptions={venueOptions}
            />
          </CardContent>
        </Card>
      ) : null}

      {["confirmed", "in_progress", "completed"].includes(meetup.status) ? (
        <RsvpPanel
          meetupId={meetup.id}
          myStatus={bundle.myRsvp}
          counts={counts}
          attendees={attendees}
        />
      ) : null}

      <HostManager
        meetupId={meetup.id}
        members={members}
        hosts={hosts}
        canManage={canManage}
      />

      <CancellationRequests
        meetupId={meetup.id}
        requests={cancellations}
        canManage={canManage}
      />

      {canManage ? (
        <div className="flex justify-center">
          <Button asChild variant="link">
            <Link href={`/meetups/${meetup.id}/edit`}>
              <Pencil />
              Chỉnh sửa thông tin & phương án
            </Link>
          </Button>
        </div>
      ) : null}

      <Separator />
      <RealtimeRefresh
        tables={[
          "meetup_attendees",
          "meetup_time_votes",
          "meetup_venue_votes",
          "host_assignments",
          "cancellation_requests",
        ]}
        filter={`meetup_id=eq.${meetup.id}`}
      />
      <RealtimeRefresh tables={["meetups"]} filter={`id=eq.${meetup.id}`} />
    </div>
  );
}
