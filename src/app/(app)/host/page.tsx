import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, ChevronRight, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { CancellationRequests } from "@/components/meetups/meetup-detail-client";
import { MeetupStatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTimeInZone } from "@/lib/dates";
import { getHostedMeetups, getMeetupAttendeeCounts } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Kèo tôi phụ trách" };

export default async function HostPage() {
  const { meetups } = await getHostedMeetups();
  const counts = await getMeetupAttendeeCounts(meetups.map((meetup) => meetup.id));

  let pendingCancellations: any[] = [];
  if (meetups.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("cancellation_requests")
      .select(
        "*, profile:profiles!cancellation_requests_user_id_fkey(id, display_name, avatar_url)",
      )
      .in(
        "meetup_id",
        meetups.map((meetup) => meetup.id),
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    pendingCancellations = data ?? [];
  }

  const meetupTitleMap = new Map(meetups.map((meetup) => [meetup.id, meetup.title]));
  const cancellationsByMeetup = new Map<string, any[]>();
  for (const request of pendingCancellations) {
    const list = cancellationsByMeetup.get(request.meetup_id) ?? [];
    list.push(request);
    cancellationsByMeetup.set(request.meetup_id, list);
  }

  return (
    <div>
      <PageHeader
        title="Kèo tôi phụ trách"
        description="Các kèo bạn đang phụ trách và việc cần xử lý."
      />

      {cancellationsByMeetup.size > 0 ? (
        <section className="mb-5 space-y-3">
          <h2 className="font-semibold">Yêu cầu hủy cần xử lý</h2>
          {[...cancellationsByMeetup.entries()].map(([meetupId, requests]) => (
            <CancellationRequests
              key={meetupId}
              meetupId={meetupId}
              requests={requests}
              canManage
              meetupTitle={meetupTitleMap.get(meetupId)}
            />
          ))}
        </section>
      ) : null}

      {meetups.length === 0 ? (
        <EmptyState
          icon={<CalendarClock />}
          title="Bạn chưa phụ trách kèo nào"
          description="Khi được giao làm chủ xị, kèo sẽ xuất hiện ở đây."
        />
      ) : (
        <div className="space-y-3">
          {meetups.map((meetup) => {
            const count = counts.get(meetup.id) ?? {};
            const pending = pendingCancellations.filter(
              (item) => item.meetup_id === meetup.id,
            ).length;

            return (
              <Link key={meetup.id} href={`/meetups/${meetup.id}`}>
                <Card className="transition-colors hover:bg-muted/40">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{meetup.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTimeInZone(meetup.starts_at, meetup.timezone)}
                        </p>
                      </div>
                      <MeetupStatusBadge status={meetup.status} />
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                        <UsersRound className="size-3.5" />
                        {count.going ?? 0} sẽ đi
                      </span>
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                        {count.maybe ?? 0} có thể
                      </span>
                      {pending > 0 ? (
                        <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700">
                          {pending} yêu cầu hủy
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-end text-xs text-muted-foreground">
                      Mở kèo
                      <ChevronRight className="size-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
