export type GroupRole = "owner" | "admin" | "member";
export type MembershipStatus = "active" | "removed";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type Group = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  rules: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type GroupMember = {
  group_id: string;
  user_id: string;
  role: GroupRole;
  status: MembershipStatus;
  joined_at: string;
  profile: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
};

export type GroupInvite = {
  id: string;
  group_id: string;
  created_by: string;
  token_hash: string;
  label: string | null;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  revoked_at: string | null;
  created_at: string;
};

export type AvailabilityStatus = "available" | "unavailable" | "maybe";

export type AvailabilityEntry = {
  id: string;
  group_id: string;
  user_id: string;
  local_date: string;
  start_time: string | null;
  end_time: string | null;
  status: AvailabilityStatus;
  note: string | null;
  profile?: Pick<Profile, "display_name" | "avatar_url"> | null;
};

export type MeetupStatus =
  | "draft"
  | "proposed"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ActivityType = "food" | "coffee" | "hangout" | "sport" | "other";

export type Meetup = {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  activity_type: ActivityType;
  status: MeetupStatus;
  voting_deadline: string | null;
  confirmed_time_option_id: string | null;
  confirmed_venue_option_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type MeetupTimeOption = {
  id: string;
  meetup_id: string;
  starts_at: string;
  ends_at: string;
  label: string | null;
  position: number;
};

export type MeetupVenueOption = {
  id: string;
  meetup_id: string;
  name: string;
  address: string | null;
  note: string | null;
  position: number;
};

export type RsvpStatus =
  | "going"
  | "maybe"
  | "not_going"
  | "cancellation_pending"
  | "cancelled"
  | "waitlisted";

export type MeetupAttendee = {
  meetup_id: string;
  user_id: string;
  status: RsvpStatus;
  note: string | null;
  responded_at: string;
  profile?: Pick<Profile, "display_name" | "avatar_url"> | null;
};

export type HostAssignment = {
  meetup_id: string;
  user_id: string;
  assigned_by: string | null;
  assigned_at: string;
  profile?: Pick<Profile, "display_name" | "avatar_url"> | null;
};

export type CancellationRequest = {
  id: string;
  meetup_id: string;
  user_id: string;
  reason: string | null;
  status: "pending" | "acknowledged";
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
  profile?: Pick<Profile, "display_name" | "avatar_url"> | null;
};

export type Notification = {
  id: string;
  user_id: string;
  group_id: string | null;
  meetup_id: string | null;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  dedupe_key: string | null;
  read_at: string | null;
  created_at: string;
};

export type MeetupWithVotes = Meetup & {
  time_options: (MeetupTimeOption & { vote_count: number; my_vote: boolean })[];
  venue_options: (MeetupVenueOption & { vote_count: number; my_vote: boolean })[];
  attendees: MeetupAttendee[];
  hosts: HostAssignment[];
};
