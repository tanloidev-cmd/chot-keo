-- Meetups, voting, RSVP, hosts, cancellations, notifications
begin;

create type public.activity_type as enum ('food', 'coffee', 'hangout', 'sport', 'other');
create type public.meetup_status as enum
  ('draft', 'proposed', 'confirmed', 'in_progress', 'completed', 'cancelled');
create type public.rsvp_status as enum
  ('going', 'maybe', 'not_going', 'cancellation_pending', 'cancelled', 'waitlisted');
create type public.cancellation_status as enum ('pending', 'acknowledged');

create table public.meetups (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  activity_type public.activity_type not null default 'hangout',
  status public.meetup_status not null default 'draft',
  voting_deadline timestamptz,
  confirmed_time_option_id uuid,
  confirmed_venue_option_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meetup_time_order
    check (starts_at is null or ends_at is null or starts_at < ends_at)
);

create index meetups_group_status_idx on public.meetups (group_id, status);
create index meetups_group_starts_idx on public.meetups (group_id, starts_at);

create table public.meetup_time_options (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  label text check (label is null or char_length(label) <= 80),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, meetup_id),
  constraint time_option_order check (starts_at < ends_at)
);

create index meetup_time_options_meetup_idx on public.meetup_time_options (meetup_id, position);

create table public.meetup_venue_options (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  address text check (address is null or char_length(address) <= 240),
  note text check (note is null or char_length(note) <= 300),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, meetup_id)
);

create index meetup_venue_options_meetup_idx on public.meetup_venue_options (meetup_id, position);

alter table public.meetups
  add constraint meetups_confirmed_time_fk
    foreign key (confirmed_time_option_id) references public.meetup_time_options(id)
    on delete set null,
  add constraint meetups_confirmed_venue_fk
    foreign key (confirmed_venue_option_id) references public.meetup_venue_options(id)
    on delete set null;

create table public.meetup_time_votes (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups(id) on delete cascade,
  time_option_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (meetup_id, user_id),
  foreign key (time_option_id, meetup_id)
    references public.meetup_time_options(id, meetup_id) on delete cascade
);

create index meetup_time_votes_option_idx on public.meetup_time_votes (time_option_id);

create table public.meetup_venue_votes (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups(id) on delete cascade,
  venue_option_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (meetup_id, user_id),
  foreign key (venue_option_id, meetup_id)
    references public.meetup_venue_options(id, meetup_id) on delete cascade
);

create index meetup_venue_votes_option_idx on public.meetup_venue_votes (venue_option_id);

create table public.meetup_attendees (
  meetup_id uuid not null references public.meetups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.rsvp_status not null default 'going',
  note text check (note is null or char_length(note) <= 300),
  responded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (meetup_id, user_id)
);

create index meetup_attendees_user_idx on public.meetup_attendees (user_id, status);

create table public.host_assignments (
  meetup_id uuid not null references public.meetups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (meetup_id, user_id)
);

create table public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text check (reason is null or char_length(reason) <= 500),
  status public.cancellation_status not null default 'pending',
  acknowledged_by uuid references public.profiles(id) on delete set null,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cancellation_requests_meetup_idx
  on public.cancellation_requests (meetup_id, status);

create unique index cancellation_requests_one_pending_idx
  on public.cancellation_requests (meetup_id, user_id)
  where status = 'pending';

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  meetup_id uuid references public.meetups(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  href text,
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create index notifications_user_unread_idx
  on public.notifications (user_id, read_at, created_at desc);

create trigger meetups_set_updated_at
  before update on public.meetups
  for each row execute function private.set_updated_at();

create trigger meetup_attendees_set_updated_at
  before update on public.meetup_attendees
  for each row execute function private.set_updated_at();

create trigger cancellation_requests_set_updated_at
  before update on public.cancellation_requests
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Meetup authorization helpers
-- ---------------------------------------------------------------------------
create or replace function private.is_meetup_host(p_meetup_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.host_assignments h
    where h.meetup_id = p_meetup_id
      and h.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_manage_meetup(p_meetup_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.meetups m
    where m.id = p_meetup_id
      and private.is_active_group_member(m.group_id)
      and (
        private.has_group_role(
          m.group_id, array['owner', 'admin']::public.group_role[]
        )
        or m.created_by = (select auth.uid())
        or private.is_meetup_host(m.id)
      )
  );
$$;

create or replace function private.can_vote_meetup(p_meetup_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.meetups m
    where m.id = p_meetup_id
      and m.status = 'proposed'
      and (m.voting_deadline is null or m.voting_deadline > now())
      and private.is_active_group_member(m.group_id)
  );
$$;

revoke all on function private.is_meetup_host(uuid) from public;
revoke all on function private.can_manage_meetup(uuid) from public;
revoke all on function private.can_vote_meetup(uuid) from public;
grant execute on function private.is_meetup_host(uuid) to authenticated;
grant execute on function private.can_manage_meetup(uuid) to authenticated;
grant execute on function private.can_vote_meetup(uuid) to authenticated;

create or replace function private.notify_group_members(
  p_group_id uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_href text default null,
  p_meetup_id uuid default null,
  p_exclude_user uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer := 0;
begin
  insert into public.notifications (user_id, group_id, meetup_id, type, title, body, href)
  select gm.user_id, p_group_id, p_meetup_id, p_type, p_title, p_body, p_href
  from public.group_members gm
  where gm.group_id = p_group_id
    and gm.status = 'active'
    and (p_exclude_user is null or gm.user_id <> p_exclude_user);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function private.notify_group_members(
  uuid, text, text, text, text, uuid, uuid
) from public;

create or replace function private.notify_meetup_hosts(
  p_meetup_id uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_href text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group_id uuid;
  v_count integer := 0;
begin
  select group_id into v_group_id from public.meetups where id = p_meetup_id;

  insert into public.notifications (user_id, group_id, meetup_id, type, title, body, href)
  select h.user_id, v_group_id, p_meetup_id, p_type, p_title, p_body, p_href
  from public.host_assignments h
  where h.meetup_id = p_meetup_id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function private.notify_meetup_hosts(uuid, text, text, text, text) from public;

-- Audit meetup creation.
create or replace function private.audit_meetup_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.write_audit(
    new.group_id,
    coalesce(auth.uid(), new.created_by),
    'meetup.created',
    'meetup',
    new.id,
    jsonb_build_object('title', new.title)
  );
  return new;
end;
$$;

revoke all on function private.audit_meetup_insert() from public;

create trigger meetup_audit_insert
  after insert on public.meetups
  for each row execute function private.audit_meetup_insert();

-- A normal authenticated insert must always start as a draft. Status changes
-- and confirmed options go through the RPCs above.
create or replace function private.enforce_meetup_insert_draft()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    new.status := 'draft';
    new.confirmed_time_option_id := null;
    new.confirmed_venue_option_id := null;
    new.starts_at := null;
    new.ends_at := null;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_meetup_insert_draft() from public;

create trigger meetup_force_draft_on_insert
  before insert on public.meetups
  for each row execute function private.enforce_meetup_insert_draft();

-- ---------------------------------------------------------------------------
-- Publish / confirm / status / RSVP / hosts / cancellations
-- ---------------------------------------------------------------------------
create or replace function public.publish_meetup(p_meetup_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_meetup public.meetups%rowtype;
  v_count integer;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_meetup
  from public.meetups where id = p_meetup_id for update;

  if not found then
    raise exception 'Meetup not found' using errcode = 'P0002';
  end if;

  if not private.is_active_group_member(v_meetup.group_id) then
    raise exception 'Not a member of this group' using errcode = '42501';
  end if;

  if v_meetup.created_by <> v_actor
     and not private.has_group_role(
       v_meetup.group_id, array['owner', 'admin']::public.group_role[]
     ) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if v_meetup.status <> 'draft' then
    raise exception 'Only a draft can be published' using errcode = '22023';
  end if;

  select count(*) into v_count
  from public.meetup_time_options where meetup_id = p_meetup_id;

  if v_count = 0 then
    raise exception 'Add at least one time option before publishing' using errcode = '22023';
  end if;

  update public.meetups
  set status = 'proposed', updated_at = now()
  where id = p_meetup_id;

  perform private.notify_group_members(
    v_meetup.group_id,
    'meetup_proposed',
    'Kèo mới: ' || v_meetup.title,
    'Có kèo mới đang chờ mọi người bình chọn.',
    '/meetups/' || p_meetup_id::text,
    p_meetup_id,
    v_actor
  );

  perform private.write_audit(
    v_meetup.group_id, v_actor, 'meetup.published', 'meetup', p_meetup_id, '{}'::jsonb
  );
end;
$$;

create or replace function public.confirm_meetup(
  p_meetup_id uuid,
  p_time_option_id uuid,
  p_venue_option_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_meetup public.meetups%rowtype;
  v_time public.meetup_time_options%rowtype;
  v_venue public.meetup_venue_options%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_meetup
  from public.meetups where id = p_meetup_id for update;

  if not found then
    raise exception 'Meetup not found' using errcode = 'P0002';
  end if;

  if not private.can_manage_meetup(p_meetup_id) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if v_meetup.status not in ('proposed', 'draft') then
    raise exception 'Meetup cannot be confirmed from its current status'
      using errcode = '22023';
  end if;

  select * into v_time
  from public.meetup_time_options
  where id = p_time_option_id and meetup_id = p_meetup_id;

  if not found then
    raise exception 'Time option does not belong to this meetup' using errcode = '22023';
  end if;

  if p_venue_option_id is not null then
    select * into v_venue
    from public.meetup_venue_options
    where id = p_venue_option_id and meetup_id = p_meetup_id;

    if not found then
      raise exception 'Venue option does not belong to this meetup' using errcode = '22023';
    end if;
  end if;

  update public.meetups
  set status = 'confirmed',
      confirmed_time_option_id = p_time_option_id,
      confirmed_venue_option_id = p_venue_option_id,
      starts_at = v_time.starts_at,
      ends_at = v_time.ends_at,
      updated_at = now()
  where id = p_meetup_id;

  perform private.notify_group_members(
    v_meetup.group_id,
    'meetup_confirmed',
    'Đã chốt: ' || v_meetup.title,
    'Kèo đã được xác nhận. Vào xem thời gian, địa điểm và RSVP.',
    '/meetups/' || p_meetup_id::text,
    p_meetup_id,
    v_actor
  );

  perform private.write_audit(
    v_meetup.group_id, v_actor, 'meetup.confirmed', 'meetup', p_meetup_id,
    jsonb_build_object('time_option_id', p_time_option_id, 'venue_option_id', p_venue_option_id)
  );
end;
$$;

create or replace function public.set_meetup_status(
  p_meetup_id uuid,
  p_status public.meetup_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_meetup public.meetups%rowtype;
  v_allowed boolean := false;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_meetup
  from public.meetups where id = p_meetup_id for update;

  if not found then
    raise exception 'Meetup not found' using errcode = 'P0002';
  end if;

  if not private.can_manage_meetup(p_meetup_id) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  v_allowed := case v_meetup.status
    when 'draft' then p_status in ('proposed', 'cancelled')
    when 'proposed' then p_status in ('cancelled')
    when 'confirmed' then p_status in ('in_progress', 'completed', 'cancelled')
    when 'in_progress' then p_status in ('completed', 'cancelled')
    else false
  end;

  if not v_allowed then
    raise exception 'Invalid meetup status transition' using errcode = '22023';
  end if;

  update public.meetups
  set status = p_status, updated_at = now()
  where id = p_meetup_id;

  if p_status in ('cancelled', 'completed') then
    perform private.notify_group_members(
      v_meetup.group_id,
      'meetup_' || p_status::text,
      case when p_status = 'cancelled'
        then 'Kèo đã hủy: ' || v_meetup.title
        else 'Kèo đã kết thúc: ' || v_meetup.title
      end,
      case when p_status = 'cancelled'
        then 'Kèo này đã bị hủy.'
        else 'Cảm ơn mọi người đã tham gia.'
      end,
      '/meetups/' || p_meetup_id::text,
      p_meetup_id,
      v_actor
    );
  end if;

  perform private.write_audit(
    v_meetup.group_id, v_actor, 'meetup.status_changed', 'meetup', p_meetup_id,
    jsonb_build_object('from', v_meetup.status, 'to', p_status)
  );
end;
$$;

create or replace function public.set_rsvp(
  p_meetup_id uuid,
  p_status public.rsvp_status,
  p_note text default null,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_meetup public.meetups%rowtype;
  v_previous public.rsvp_status;
  v_effective public.rsvp_status;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_meetup
  from public.meetups where id = p_meetup_id;

  if not found then
    raise exception 'Meetup not found' using errcode = 'P0002';
  end if;

  if not private.is_active_group_member(v_meetup.group_id) then
    raise exception 'Not a member of this group' using errcode = '42501';
  end if;

  if v_meetup.status not in ('confirmed', 'in_progress', 'completed') then
    raise exception 'RSVP opens after the meetup is confirmed' using errcode = '22023';
  end if;

  if p_status not in ('going', 'maybe', 'not_going') then
    raise exception 'Invalid RSVP status' using errcode = '22023';
  end if;

  select status into v_previous
  from public.meetup_attendees
  where meetup_id = p_meetup_id and user_id = v_actor;

  if p_status = 'not_going' and v_meetup.status in ('confirmed', 'in_progress') then
    v_effective := 'cancelled';
  else
    v_effective := p_status;
  end if;

  insert into public.meetup_attendees (meetup_id, user_id, status, note, responded_at)
  values (p_meetup_id, v_actor, v_effective, nullif(trim(coalesce(p_note, '')), ''), now())
  on conflict (meetup_id, user_id) do update
    set status = excluded.status,
        note = excluded.note,
        responded_at = now(),
        updated_at = now();

  if v_effective = 'cancelled' and v_previous in ('going', 'maybe') then
    insert into public.cancellation_requests (meetup_id, user_id, reason)
    values (p_meetup_id, v_actor, nullif(trim(coalesce(p_reason, '')), ''))
    on conflict (meetup_id, user_id) where status = 'pending' do nothing;

    perform private.notify_meetup_hosts(
      p_meetup_id,
      'cancellation_requested',
      'Có người hủy tham gia',
      'Một thành viên vừa hủy tham gia kèo. Vào xem để cập nhật logistics.',
      '/meetups/' || p_meetup_id::text
    );
  elsif v_effective in ('going', 'maybe') then
    update public.cancellation_requests
    set status = 'acknowledged',
        acknowledged_by = null,
        acknowledged_at = now(),
        updated_at = now()
    where meetup_id = p_meetup_id
      and user_id = v_actor
      and status = 'pending';
  end if;

  perform private.write_audit(
    v_meetup.group_id, v_actor, 'meetup.rsvp_updated', 'meetup', p_meetup_id,
    jsonb_build_object('status', v_effective)
  );
end;
$$;

create or replace function public.assign_host(
  p_meetup_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_meetup public.meetups%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_meetup from public.meetups where id = p_meetup_id;
  if not found then
    raise exception 'Meetup not found' using errcode = 'P0002';
  end if;

  if not private.can_manage_meetup(p_meetup_id) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.group_members
    where group_id = v_meetup.group_id and user_id = p_user_id and status = 'active'
  ) then
    raise exception 'Host must be an active group member' using errcode = '22023';
  end if;

  insert into public.host_assignments (meetup_id, user_id, assigned_by)
  values (p_meetup_id, p_user_id, v_actor)
  on conflict (meetup_id, user_id) do nothing;

  insert into public.notifications (user_id, group_id, meetup_id, type, title, body, href)
  values (
    p_user_id, v_meetup.group_id, p_meetup_id, 'host_assigned',
    'Bạn được giao làm chủ xị',
    'Bạn vừa được giao phụ trách kèo "' || v_meetup.title || '".',
    '/meetups/' || p_meetup_id::text
  );

  perform private.write_audit(
    v_meetup.group_id, v_actor, 'meetup.host_assigned', 'profile', p_user_id,
    jsonb_build_object('meetup_id', p_meetup_id)
  );
end;
$$;

create or replace function public.unassign_host(
  p_meetup_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_group_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select group_id into v_group_id from public.meetups where id = p_meetup_id;
  if not found then
    raise exception 'Meetup not found' using errcode = 'P0002';
  end if;

  if not private.can_manage_meetup(p_meetup_id) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  delete from public.host_assignments
  where meetup_id = p_meetup_id and user_id = p_user_id;

  perform private.write_audit(
    v_group_id, v_actor, 'meetup.host_unassigned', 'profile', p_user_id,
    jsonb_build_object('meetup_id', p_meetup_id)
  );
end;
$$;

create or replace function public.acknowledge_cancellation(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.cancellation_requests%rowtype;
  v_group_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_request
  from public.cancellation_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;

  select group_id into v_group_id from public.meetups where id = v_request.meetup_id;

  if not private.can_manage_meetup(v_request.meetup_id) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  update public.cancellation_requests
  set status = 'acknowledged',
      acknowledged_by = v_actor,
      acknowledged_at = now(),
      updated_at = now()
  where id = p_request_id;

  insert into public.notifications (user_id, group_id, meetup_id, type, title, body, href)
  values (
    v_request.user_id, v_group_id, v_request.meetup_id, 'cancellation_acknowledged',
    'Chủ xị đã ghi nhận yêu cầu hủy',
    'Nhóm đã cập nhật việc bạn không tham gia kèo này.',
    '/meetups/' || v_request.meetup_id::text
  );

  perform private.write_audit(
    v_group_id, v_actor, 'cancellation.acknowledged', 'cancellation_request',
    p_request_id, '{}'::jsonb
  );
end;
$$;

create or replace function public.refresh_my_meetup_statuses()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer := 0;
  v_partial integer := 0;
begin
  update public.meetups m
  set status = 'in_progress', updated_at = now()
  where m.status = 'confirmed'
    and m.starts_at <= now()
    and m.ends_at > now()
    and m.group_id in (
      select group_id from public.group_members
      where user_id = (select auth.uid()) and status = 'active'
    );
  get diagnostics v_partial = row_count;
  v_count := v_count + v_partial;

  update public.meetups m
  set status = 'completed', updated_at = now()
  where m.status in ('confirmed', 'in_progress')
    and m.ends_at <= now()
    and m.group_id in (
      select group_id from public.group_members
      where user_id = (select auth.uid()) and status = 'active'
    );
  get diagnostics v_partial = row_count;
  v_count := v_count + v_partial;

  return v_count;
end;
$$;

create or replace function public.generate_my_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_count integer := 0;
  v_partial integer := 0;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  perform public.refresh_my_meetup_statuses();

  insert into public.notifications
    (user_id, group_id, meetup_id, type, title, body, href, dedupe_key)
  select
    v_user, m.group_id, m.id, 'meetup_reminder_24h',
    'Nhắc kèo: ' || m.title,
    'Kèo sẽ diễn ra trong vòng 24 giờ tới.',
    '/meetups/' || m.id::text,
    'meetup:' || m.id::text || ':reminder24'
  from public.meetups m
  join public.meetup_attendees a
    on a.meetup_id = m.id and a.user_id = v_user
  where m.status in ('confirmed', 'in_progress')
    and m.starts_at > now()
    and m.starts_at <= now() + interval '24 hours'
    and a.status in ('going', 'maybe')
  on conflict (user_id, dedupe_key) do nothing;
  get diagnostics v_partial = row_count;
  v_count := v_count + v_partial;

  insert into public.notifications
    (user_id, group_id, meetup_id, type, title, body, href, dedupe_key)
  select
    v_user, m.group_id, m.id, 'meetup_reminder_2h',
    'Sắp tới giờ: ' || m.title,
    'Kèo sẽ bắt đầu trong vòng 2 giờ tới.',
    '/meetups/' || m.id::text,
    'meetup:' || m.id::text || ':reminder2'
  from public.meetups m
  join public.meetup_attendees a
    on a.meetup_id = m.id and a.user_id = v_user
  where m.status in ('confirmed', 'in_progress')
    and m.starts_at > now()
    and m.starts_at <= now() + interval '2 hours'
    and a.status in ('going', 'maybe')
  on conflict (user_id, dedupe_key) do nothing;
  get diagnostics v_partial = row_count;
  v_count := v_count + v_partial;

  return v_count;
end;
$$;

revoke all on function public.publish_meetup(uuid) from public;
revoke all on function public.confirm_meetup(uuid, uuid, uuid) from public;
revoke all on function public.set_meetup_status(uuid, public.meetup_status) from public;
revoke all on function public.set_rsvp(uuid, public.rsvp_status, text, text) from public;
revoke all on function public.assign_host(uuid, uuid) from public;
revoke all on function public.unassign_host(uuid, uuid) from public;
revoke all on function public.acknowledge_cancellation(uuid) from public;
revoke all on function public.refresh_my_meetup_statuses() from public;
revoke all on function public.generate_my_reminders() from public;

grant execute on function public.publish_meetup(uuid) to authenticated;
grant execute on function public.confirm_meetup(uuid, uuid, uuid) to authenticated;
grant execute on function public.set_meetup_status(uuid, public.meetup_status) to authenticated;
grant execute on function public.set_rsvp(uuid, public.rsvp_status, text, text) to authenticated;
grant execute on function public.assign_host(uuid, uuid) to authenticated;
grant execute on function public.unassign_host(uuid, uuid) to authenticated;
grant execute on function public.acknowledge_cancellation(uuid) to authenticated;
grant execute on function public.refresh_my_meetup_statuses() to authenticated;
grant execute on function public.generate_my_reminders() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.meetups enable row level security;
alter table public.meetup_time_options enable row level security;
alter table public.meetup_venue_options enable row level security;
alter table public.meetup_time_votes enable row level security;
alter table public.meetup_venue_votes enable row level security;
alter table public.meetup_attendees enable row level security;
alter table public.host_assignments enable row level security;
alter table public.cancellation_requests enable row level security;
alter table public.notifications enable row level security;

-- Meetups
revoke all on public.meetups from anon, authenticated;
grant select, insert, delete on public.meetups to authenticated;
grant update (title, description, activity_type, voting_deadline, timezone)
  on public.meetups to authenticated;

create policy meetups_select_member
on public.meetups for select to authenticated
using (private.is_active_group_member(group_id));

create policy meetups_insert_member
on public.meetups for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.is_active_group_member(group_id)
);

create policy meetups_update_manager
on public.meetups for update to authenticated
using (private.can_manage_meetup(id))
with check (private.can_manage_meetup(id));

create policy meetups_delete_manager
on public.meetups for delete to authenticated
using (private.can_manage_meetup(id) and status in ('draft', 'proposed'));

-- Time options
revoke all on public.meetup_time_options from anon, authenticated;
grant select, insert, update, delete on public.meetup_time_options to authenticated;

create policy time_options_select_member
on public.meetup_time_options for select to authenticated
using (
  exists (
    select 1 from public.meetups m
    where m.id = meetup_time_options.meetup_id
      and private.is_active_group_member(m.group_id)
  )
);

create policy time_options_write_manager
on public.meetup_time_options for all to authenticated
using (private.can_manage_meetup(meetup_id))
with check (
  private.can_manage_meetup(meetup_id)
  and exists (
    select 1 from public.meetups m
    where m.id = meetup_time_options.meetup_id
      and m.status in ('draft', 'proposed')
  )
);

-- Venue options
revoke all on public.meetup_venue_options from anon, authenticated;
grant select, insert, update, delete on public.meetup_venue_options to authenticated;

create policy venue_options_select_member
on public.meetup_venue_options for select to authenticated
using (
  exists (
    select 1 from public.meetups m
    where m.id = meetup_venue_options.meetup_id
      and private.is_active_group_member(m.group_id)
  )
);

create policy venue_options_write_manager
on public.meetup_venue_options for all to authenticated
using (private.can_manage_meetup(meetup_id))
with check (
  private.can_manage_meetup(meetup_id)
  and exists (
    select 1 from public.meetups m
    where m.id = meetup_venue_options.meetup_id
      and m.status in ('draft', 'proposed')
  )
);

-- Votes
revoke all on public.meetup_time_votes from anon, authenticated;
grant select, insert, update, delete on public.meetup_time_votes to authenticated;

create policy time_votes_select_member
on public.meetup_time_votes for select to authenticated
using (
  exists (
    select 1 from public.meetups m
    where m.id = meetup_time_votes.meetup_id
      and private.is_active_group_member(m.group_id)
  )
);

create policy time_votes_write_self
on public.meetup_time_votes for all to authenticated
using (user_id = (select auth.uid()) and private.can_vote_meetup(meetup_id))
with check (user_id = (select auth.uid()) and private.can_vote_meetup(meetup_id));

revoke all on public.meetup_venue_votes from anon, authenticated;
grant select, insert, update, delete on public.meetup_venue_votes to authenticated;

create policy venue_votes_select_member
on public.meetup_venue_votes for select to authenticated
using (
  exists (
    select 1 from public.meetups m
    where m.id = meetup_venue_votes.meetup_id
      and private.is_active_group_member(m.group_id)
  )
);

create policy venue_votes_write_self
on public.meetup_venue_votes for all to authenticated
using (user_id = (select auth.uid()) and private.can_vote_meetup(meetup_id))
with check (user_id = (select auth.uid()) and private.can_vote_meetup(meetup_id));

-- Attendees
revoke all on public.meetup_attendees from anon, authenticated;
grant select on public.meetup_attendees to authenticated;

create policy attendees_select_member
on public.meetup_attendees for select to authenticated
using (
  exists (
    select 1 from public.meetups m
    where m.id = meetup_attendees.meetup_id
      and private.is_active_group_member(m.group_id)
  )
);

-- Hosts
revoke all on public.host_assignments from anon, authenticated;
grant select on public.host_assignments to authenticated;

create policy hosts_select_member
on public.host_assignments for select to authenticated
using (
  exists (
    select 1 from public.meetups m
    where m.id = host_assignments.meetup_id
      and private.is_active_group_member(m.group_id)
  )
);

-- Cancellations
revoke all on public.cancellation_requests from anon, authenticated;
grant select on public.cancellation_requests to authenticated;

create policy cancellations_select_own_or_manager
on public.cancellation_requests for select to authenticated
using (
  user_id = (select auth.uid())
  or private.can_manage_meetup(meetup_id)
);

-- Notifications
revoke all on public.notifications from anon, authenticated;
grant select, update (read_at), delete on public.notifications to authenticated;

create policy notifications_select_self
on public.notifications for select to authenticated
using (user_id = (select auth.uid()));

create policy notifications_update_self
on public.notifications for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy notifications_delete_self
on public.notifications for delete to authenticated
using (user_id = (select auth.uid()));

commit;
