import { createClient } from "@/lib/supabase/server";
import type {
  AvailabilityEntry,
  CancellationRequest,
  Group,
  GroupInvite,
  GroupMember,
  HostAssignment,
  Meetup,
  MeetupAttendee,
  MeetupTimeOption,
  MeetupVenueOption,
  Notification,
  Profile,
} from "@/lib/types";

export async function getMyGroups() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_members")
    .select(
      "group_id, role, status, joined_at, groups!inner(id, owner_id, name, description, rules, avatar_url, timezone, created_at, updated_at)",
    )
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  if (error) return [];

  return (data ?? []).map((row: any) => ({
    ...(row.groups as Group),
    my_role: row.role,
    joined_at: row.joined_at,
  }));
}

export async function getMyGroupsWithMeta() {
  const groups = await getMyGroups();
  if (groups.length === 0) return [];

  const supabase = await createClient();
  const groupIds = groups.map((group) => group.id);

  const [{ data: members }, { data: meetups }] = await Promise.all([
    supabase
      .from("group_members")
      .select("group_id, user_id")
      .in("group_id", groupIds)
      .eq("status", "active"),
    supabase
      .from("meetups")
      .select("*")
      .in("group_id", groupIds)
      .in("status", ["proposed", "confirmed", "in_progress"])
      .order("starts_at", { ascending: true }),
  ]);

  return groups.map((group) => {
    const memberCount = (members ?? []).filter(
      (member) => member.group_id === group.id,
    ).length;

    const nextMeetup =
      (meetups ?? []).find(
        (meetup) =>
          meetup.group_id === group.id &&
          ["confirmed", "in_progress"].includes(meetup.status),
      ) ??
      (meetups ?? []).find(
        (meetup) =>
          meetup.group_id === group.id && meetup.status === "proposed",
      ) ??
      null;

    return { ...group, member_count: memberCount, next_meetup: nextMeetup };
  });
}

export async function getGroup(groupId: string) {
  const supabase = await createClient();
  const [
    { data: group },
    { data: membership },
    { data: members },
    { data: meetups },
    { data: invites },
  ] = await Promise.all([
    supabase.from("groups").select("*").eq("id", groupId).maybeSingle(),
    supabase
      .from("group_members")
      .select("role, status")
      .eq("group_id", groupId)
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .maybeSingle(),
    supabase
      .from("group_members")
      .select(
        "group_id, user_id, role, status, joined_at, profiles!group_members_user_id_fkey(id, display_name, avatar_url)",
      )
      .eq("group_id", groupId)
      .eq("status", "active")
      .order("joined_at", { ascending: true }),
    supabase
      .from("meetups")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false }),
    supabase
      .from("group_invites")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false }),
  ]);

  if (!group) return null;

  return {
    group: group as Group,
    my_role: membership?.role ?? null,
    members: (members ?? []) as unknown as GroupMember[],
    meetups: (meetups ?? []) as Meetup[],
    invites: (invites ?? []) as GroupInvite[],
  };
}

export async function getGroupMembers(groupId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select(
      "group_id, user_id, role, status, joined_at, profiles!group_members_user_id_fkey(id, display_name, avatar_url)",
    )
    .eq("group_id", groupId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  return (data ?? []) as unknown as GroupMember[];
}

export async function getGroupMeetups(groupId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meetups")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  return (data ?? []) as Meetup[];
}

export async function getGroupAvailability(
  groupId: string,
  from: string,
  to: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability_entries")
    .select(
      "*, profiles!availability_entries_user_id_fkey(display_name, avatar_url)",
    )
    .eq("group_id", groupId)
    .gte("local_date", from)
    .lte("local_date", to)
    .order("local_date", { ascending: true });

  return (data ?? []) as unknown as AvailabilityEntry[];
}

export async function getAvailabilityCountsForDates(
  groupId: string,
  dates: string[],
) {
  const empty = new Map<
    string,
    { available: number; maybe: number; unavailable: number }
  >();

  for (const date of dates) {
    empty.set(date, { available: 0, maybe: 0, unavailable: 0 });
  }

  if (dates.length === 0) return empty;

  const supabase = await createClient();
  const sorted = [...dates].sort();
  const { data } = await supabase
    .from("availability_entries")
    .select("local_date, status")
    .eq("group_id", groupId)
    .gte("local_date", sorted[0])
    .lte("local_date", sorted[sorted.length - 1]);

  for (const row of data ?? []) {
    const current = empty.get((row as any).local_date);
    if (!current) continue;
    const status = (row as any).status as string;
    if (status === "available") current.available += 1;
    if (status === "maybe") current.maybe += 1;
    if (status === "unavailable") current.unavailable += 1;
  }

  return empty;
}

export async function getMeetupBundle(meetupId: string) {
  const supabase = await createClient();
  const { data: meetup } = await supabase
    .from("meetups")
    .select(
      "*, groups!meetups_group_id_fkey(id, name, timezone), profiles!meetups_created_by_fkey(id, display_name, avatar_url)",
    )
    .eq("id", meetupId)
    .maybeSingle();

  if (!meetup) return null;

  const [
    { data: timeOptions },
    { data: venueOptions },
    { data: timeVotes },
    { data: venueVotes },
    { data: attendees },
    { data: hosts },
    { data: cancellations },
  ] = await Promise.all([
    supabase
      .from("meetup_time_options")
      .select("*")
      .eq("meetup_id", meetupId)
      .order("position", { ascending: true }),
    supabase
      .from("meetup_venue_options")
      .select("*")
      .eq("meetup_id", meetupId)
      .order("position", { ascending: true }),
    supabase.from("meetup_time_votes").select("*").eq("meetup_id", meetupId),
    supabase.from("meetup_venue_votes").select("*").eq("meetup_id", meetupId),
    supabase
      .from("meetup_attendees")
      .select(
        "*, profiles!meetup_attendees_user_id_fkey(id, display_name, avatar_url)",
      )
      .eq("meetup_id", meetupId),
    supabase
      .from("host_assignments")
      .select(
        "*, profiles!host_assignments_user_id_fkey(id, display_name, avatar_url)",
      )
      .eq("meetup_id", meetupId),
    supabase
      .from("cancellation_requests")
      .select(
        "*, profiles!cancellation_requests_user_id_fkey(id, display_name, avatar_url)",
      )
      .eq("meetup_id", meetupId)
      .order("created_at", { ascending: false }),
  ]);

  const userId = (await supabase.auth.getUser()).data.user?.id ?? "";

  const timeOptionRows = (timeOptions ?? []).map((option: any) => {
    const votes = (timeVotes ?? []).filter(
      (vote: any) => vote.time_option_id === option.id,
    );
    return {
      ...option,
      vote_count: votes.length,
      my_vote: votes.some((vote: any) => vote.user_id === userId),
    };
  });

  const venueOptionRows = (venueOptions ?? []).map((option: any) => {
    const votes = (venueVotes ?? []).filter(
      (vote: any) => vote.venue_option_id === option.id,
    );
    return {
      ...option,
      vote_count: votes.length,
      my_vote: votes.some((vote: any) => vote.user_id === userId),
    };
  });

  return {
    meetup: meetup as Meetup & {
      groups: { id: string; name: string; timezone: string };
      profiles: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
    },
    timeOptions: timeOptionRows as (MeetupTimeOption & {
      vote_count: number;
      my_vote: boolean;
    })[],
    venueOptions: venueOptionRows as (MeetupVenueOption & {
      vote_count: number;
      my_vote: boolean;
    })[],
    attendees: (attendees ?? []) as unknown as MeetupAttendee[],
    hosts: (hosts ?? []) as unknown as HostAssignment[],
    cancellations: (cancellations ?? []) as unknown as CancellationRequest[],
    myRsvp:
      (attendees ?? []).find((attendee: any) => attendee.user_id === userId)
        ?.status ?? null,
    myTimeVoteId:
      (timeVotes ?? []).find((vote: any) => vote.user_id === userId)
        ?.time_option_id ?? null,
    myVenueVoteId:
      (venueVotes ?? []).find((vote: any) => vote.user_id === userId)
        ?.venue_option_id ?? null,
  };
}

export async function getUpcomingMeetupsForUser() {
  const supabase = await createClient();
  const groups = await getMyGroups();
  if (groups.length === 0) return { upcoming: [], proposed: [] };

  const groupIds = groups.map((group) => group.id);
  const { data } = await supabase
    .from("meetups")
    .select("*")
    .in("group_id", groupIds)
    .in("status", ["proposed", "confirmed", "in_progress"])
    .order("starts_at", { ascending: true, nullsFirst: false });

  const meetups = (data ?? []) as Meetup[];
  const upcoming = meetups.filter((meetup) =>
    ["confirmed", "in_progress"].includes(meetup.status),
  );
  const proposed = meetups.filter((meetup) => meetup.status === "proposed");

  return { upcoming, proposed };
}

export async function getMyRsvpMap(meetupIds: string[]) {
  if (meetupIds.length === 0) return new Map<string, string>();

  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return new Map<string, string>();

  const { data } = await supabase
    .from("meetup_attendees")
    .select("meetup_id, status")
    .in("meetup_id", meetupIds)
    .eq("user_id", user.id);

  return new Map(
    (data ?? []).map((row: any) => [row.meetup_id, row.status as string]),
  );
}

export async function getNotifications(limit = 50) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Notification[];
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);

  return count ?? 0;
}

export async function getHostedMeetups() {
  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return { hosts: [], meetups: [] };

  const { data: hosts } = await supabase
    .from("host_assignments")
    .select("meetup_id, assigned_at")
    .eq("user_id", user.id);

  const ids = (hosts ?? []).map((row: any) => row.meetup_id);
  if (ids.length === 0) return { hosts: [], meetups: [] };

  const { data: meetups } = await supabase
    .from("meetups")
    .select("*")
    .in("id", ids)
    .order("starts_at", { ascending: true, nullsFirst: false });

  return { hosts: hosts ?? [], meetups: (meetups ?? []) as Meetup[] };
}

export async function getMeetupAttendeeCounts(meetupIds: string[]) {
  if (meetupIds.length === 0) return new Map<string, Record<string, number>>();

  const supabase = await createClient();
  const { data } = await supabase
    .from("meetup_attendees")
    .select("meetup_id, status")
    .in("meetup_id", meetupIds);

  const map = new Map<string, Record<string, number>>();
  for (const id of meetupIds) {
    map.set(id, { going: 0, maybe: 0, not_going: 0, cancelled: 0 });
  }

  for (const row of data ?? []) {
    const counts = map.get((row as any).meetup_id);
    if (!counts) continue;
    const status = (row as any).status as string;
    counts[status] = (counts[status] ?? 0) + 1;
  }

  return map;
}
