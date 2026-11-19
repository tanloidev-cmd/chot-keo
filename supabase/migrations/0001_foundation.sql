-- Chốt Kèo — M1 foundation + hardening
-- Phone + password auth, no SMS, no email. RLS is the data boundary.
begin;

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create type public.group_role as enum ('owner', 'admin', 'member');
create type public.membership_status as enum ('active', 'removed');

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null
    check (char_length(trim(display_name)) between 1 and 60),
  avatar_url text,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null
    check (char_length(trim(name)) between 1 and 80),
  description text
    check (description is null or char_length(description) <= 500),
  rules text
    check (rules is null or char_length(rules) <= 1000),
  avatar_url text,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.group_role not null default 'member',
  status public.membership_status not null default 'active',
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_status_idx
  on public.group_members (user_id, status, group_id);
create index groups_owner_id_idx on public.groups (owner_id);

create table public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  token_hash text not null unique
    check (token_hash ~ '^[0-9a-f]{64}$'),
  label text check (label is null or char_length(label) <= 80),
  expires_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint group_invites_usage_limit
    check (max_uses is null or uses_count <= max_uses)
);

create index group_invites_group_id_idx on public.group_invites (group_id);
create index group_invites_active_lookup_idx
  on public.group_invites (token_hash) where revoked_at is null;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_group_created_idx
  on public.audit_logs (group_id, created_at desc);

-- Private recovery + rate-limit storage. Never exposed through PostgREST.
create table private.account_recovery (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text not null unique,
  recovery_code_hash text not null
    check (recovery_code_hash ~ '^[0-9a-f]{64}$'),
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null default now()
);

create trigger account_recovery_set_updated_at
  before update on private.account_recovery
  for each row execute function private.set_updated_at();

-- Profile bootstrap from Auth metadata. Metadata is untrusted.
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
begin
  v_display_name :=
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');

  if v_display_name is null then
    v_display_name := 'Thành viên mới';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, left(v_display_name, 60))
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

create or replace function private.create_group_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_members (group_id, user_id, role, status)
  values (new.id, new.owner_id, 'owner', 'active')
  on conflict (group_id, user_id) do update
    set role = 'owner', status = 'active', updated_at = now();

  return new;
end;
$$;

revoke all on function private.create_group_owner_membership() from public;

create trigger on_group_created
  after insert on public.groups
  for each row execute function private.create_group_owner_membership();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function private.set_updated_at();

create trigger group_members_set_updated_at
  before update on public.group_members
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------------
create or replace function private.is_active_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = (select auth.uid())
      and gm.status = 'active'
  );
$$;

create or replace function private.has_group_role(
  p_group_id uuid,
  p_allowed_roles public.group_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = (select auth.uid())
      and gm.status = 'active'
      and gm.role = any(p_allowed_roles)
  );
$$;

create or replace function private.is_group_admin(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_group_role(
    p_group_id,
    array['owner', 'admin']::public.group_role[]
  );
$$;

revoke all on function private.is_active_group_member(uuid) from public;
revoke all on function private.has_group_role(uuid, public.group_role[]) from public;
revoke all on function private.is_group_admin(uuid) from public;
grant execute on function private.is_active_group_member(uuid) to authenticated;
grant execute on function private.has_group_role(uuid, public.group_role[]) to authenticated;
grant execute on function private.is_group_admin(uuid) to authenticated;

create or replace function private.write_audit(
  p_group_id uuid,
  p_actor uuid,
  p_action text,
  p_target_type text default null,
  p_target_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs
    (group_id, actor_id, action, target_type, target_id, metadata)
  values
    (p_group_id, p_actor, p_action, p_target_type, p_target_id, coalesce(p_metadata, '{}'::jsonb));
$$;

revoke all on function private.write_audit(uuid, uuid, text, text, uuid, jsonb) from public;

-- ---------------------------------------------------------------------------
-- Service-role-only auth helpers (called from server actions)
-- ---------------------------------------------------------------------------
create or replace function public.consume_auth_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_key is null or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  insert into private.rate_limits (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update
    set count = case
          when private.rate_limits.reset_at <= now() then 1
          else private.rate_limits.count + 1
        end,
        reset_at = case
          when private.rate_limits.reset_at <= now()
            then now() + make_interval(secs => p_window_seconds)
          else private.rate_limits.reset_at
        end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_auth_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_auth_rate_limit(text, integer, integer) to service_role;

create or replace function public.create_account_recovery(
  p_user_id uuid,
  p_phone text,
  p_hash text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null or p_phone is null or p_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid recovery data' using errcode = '22023';
  end if;

  insert into private.account_recovery (user_id, phone, recovery_code_hash)
  values (p_user_id, p_phone, p_hash)
  on conflict (user_id) do update
    set phone = excluded.phone,
        recovery_code_hash = excluded.recovery_code_hash,
        failed_attempts = 0,
        locked_until = null,
        updated_at = now();
end;
$$;

revoke all on function public.create_account_recovery(uuid, text, text) from public;
grant execute on function public.create_account_recovery(uuid, text, text) to service_role;

create or replace function public.verify_account_recovery(
  p_phone text,
  p_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row private.account_recovery%rowtype;
begin
  if p_phone is null or p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid recovery code' using errcode = '22023';
  end if;

  select *
    into v_row
  from private.account_recovery
  where phone = p_phone
  for update;

  if not found then
    raise exception 'Invalid recovery code' using errcode = '22023';
  end if;

  if v_row.locked_until is not null and v_row.locked_until > now() then
    raise exception 'Too many attempts. Try again later.' using errcode = '42900';
  end if;

  if v_row.recovery_code_hash <> p_hash then
    update private.account_recovery
    set failed_attempts = failed_attempts + 1,
        locked_until = case
          when failed_attempts + 1 >= 5 then now() + interval '15 minutes'
          else locked_until
        end,
        updated_at = now()
    where user_id = v_row.user_id;

    raise exception 'Invalid recovery code' using errcode = '22023';
  end if;

  update private.account_recovery
  set failed_attempts = 0,
      locked_until = null,
      updated_at = now()
  where user_id = v_row.user_id;

  return v_row.user_id;
end;
$$;

revoke all on function public.verify_account_recovery(text, text) from public;
grant execute on function public.verify_account_recovery(text, text) to service_role;

create or replace function public.rotate_account_recovery(
  p_user_id uuid,
  p_hash text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null or p_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid recovery data' using errcode = '22023';
  end if;

  update private.account_recovery
  set recovery_code_hash = p_hash,
      failed_attempts = 0,
      locked_until = null,
      updated_at = now()
  where user_id = p_user_id;

  if not found then
    raise exception 'Recovery record not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.rotate_account_recovery(uuid, text) from public;
grant execute on function public.rotate_account_recovery(uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- Invite redemption
-- ---------------------------------------------------------------------------
create or replace function public.redeem_group_invite(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_invite public.group_invites%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invite is invalid or expired' using errcode = '22023';
  end if;

  select *
    into v_invite
  from public.group_invites gi
  where gi.token_hash = p_token_hash
    and gi.revoked_at is null
    and (gi.expires_at is null or gi.expires_at > now())
    and (gi.max_uses is null or gi.uses_count < gi.max_uses)
  for update;

  if not found then
    raise exception 'Invite is invalid or expired' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.group_members gm
    where gm.group_id = v_invite.group_id
      and gm.user_id = v_user_id
      and gm.status = 'active'
  ) then
    return v_invite.group_id;
  end if;

  update public.group_invites
  set uses_count = uses_count + 1
  where id = v_invite.id;

  insert into public.group_members (group_id, user_id, role, status)
  values (v_invite.group_id, v_user_id, 'member', 'active')
  on conflict (group_id, user_id) do update
    set role = 'member',
        status = 'active',
        joined_at = now(),
        updated_at = now();

  perform private.write_audit(
    v_invite.group_id,
    v_user_id,
    'member.join_via_invite',
    'group_invite',
    v_invite.id,
    '{}'::jsonb
  );

  return v_invite.group_id;
end;
$$;

revoke all on function public.redeem_group_invite(text) from public;
grant execute on function public.redeem_group_invite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Membership management RPCs (no generic client UPDATE/DELETE on group_members)
-- ---------------------------------------------------------------------------
create or replace function public.set_member_role(
  p_group_id uuid,
  p_user_id uuid,
  p_role public.group_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_target public.group_members%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_role not in ('admin', 'member') then
    raise exception 'Owner role can only be changed through ownership transfer'
      using errcode = '22023';
  end if;

  if not private.has_group_role(p_group_id, array['owner']::public.group_role[]) then
    raise exception 'Only the owner can change roles' using errcode = '42501';
  end if;

  select * into v_target
  from public.group_members
  where group_id = p_group_id and user_id = p_user_id and status = 'active'
  for update;

  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;

  if v_target.role = 'owner' then
    raise exception 'Cannot change the owner role' using errcode = '42501';
  end if;

  update public.group_members
  set role = p_role, updated_at = now()
  where group_id = p_group_id and user_id = p_user_id;

  perform private.write_audit(
    p_group_id, v_actor, 'member.role_changed', 'profile', p_user_id,
    jsonb_build_object('old_role', v_target.role, 'new_role', p_role)
  );
end;
$$;

create or replace function public.remove_group_member(
  p_group_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_target public.group_members%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not private.is_group_admin(p_group_id) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if p_user_id = v_actor then
    raise exception 'Use leave_group to leave the group' using errcode = '22023';
  end if;

  select * into v_target
  from public.group_members
  where group_id = p_group_id and user_id = p_user_id and status = 'active'
  for update;

  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;

  if v_target.role = 'owner' then
    raise exception 'Cannot remove the owner' using errcode = '42501';
  end if;

  if v_target.role = 'admin'
     and not private.has_group_role(p_group_id, array['owner']::public.group_role[]) then
    raise exception 'Only the owner can remove an admin' using errcode = '42501';
  end if;

  update public.group_members
  set status = 'removed', updated_at = now()
  where group_id = p_group_id and user_id = p_user_id;

  perform private.write_audit(
    p_group_id, v_actor, 'member.removed', 'profile', p_user_id, '{}'::jsonb
  );
end;
$$;

create or replace function public.transfer_group_ownership(
  p_group_id uuid,
  p_new_owner_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not private.has_group_role(p_group_id, array['owner']::public.group_role[]) then
    raise exception 'Only the owner can transfer ownership' using errcode = '42501';
  end if;

  if p_new_owner_id = v_actor then
    raise exception 'Already the owner' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_new_owner_id and status = 'active'
  ) then
    raise exception 'New owner must be an active member' using errcode = '22023';
  end if;

  update public.groups
  set owner_id = p_new_owner_id, updated_at = now()
  where id = p_group_id;

  update public.group_members
  set role = 'owner', updated_at = now()
  where group_id = p_group_id and user_id = p_new_owner_id;

  update public.group_members
  set role = 'admin', updated_at = now()
  where group_id = p_group_id and user_id = v_actor;

  perform private.write_audit(
    p_group_id, v_actor, 'group.ownership_transferred', 'profile', p_new_owner_id,
    '{}'::jsonb
  );
end;
$$;

create or replace function public.leave_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = v_actor
      and status = 'active' and role = 'owner'
  ) then
    raise exception 'Transfer ownership before leaving the group' using errcode = '42501';
  end if;

  update public.group_members
  set status = 'removed', updated_at = now()
  where group_id = p_group_id and user_id = v_actor and status = 'active';

  if not found then
    raise exception 'Membership not found' using errcode = 'P0002';
  end if;

  perform private.write_audit(
    p_group_id, v_actor, 'member.left', 'profile', v_actor, '{}'::jsonb
  );
end;
$$;

create or replace function public.revoke_group_invite(p_invite_id uuid)
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

  select group_id into v_group_id
  from public.group_invites
  where id = p_invite_id
  for update;

  if not found then
    raise exception 'Invite not found' using errcode = 'P0002';
  end if;

  if not private.is_group_admin(v_group_id) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  update public.group_invites
  set revoked_at = coalesce(revoked_at, now())
  where id = p_invite_id;

  perform private.write_audit(
    v_group_id, v_actor, 'invite.revoked', 'group_invite', p_invite_id, '{}'::jsonb
  );
end;
$$;

revoke all on function public.set_member_role(uuid, uuid, public.group_role) from public;
revoke all on function public.remove_group_member(uuid, uuid) from public;
revoke all on function public.transfer_group_ownership(uuid, uuid) from public;
revoke all on function public.leave_group(uuid) from public;
revoke all on function public.revoke_group_invite(uuid) from public;
grant execute on function public.set_member_role(uuid, uuid, public.group_role) to authenticated;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;
grant execute on function public.transfer_group_ownership(uuid, uuid) to authenticated;
grant execute on function public.leave_group(uuid) to authenticated;
grant execute on function public.revoke_group_invite(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url, timezone) on public.profiles to authenticated;

create policy profiles_select_self_or_shared_group
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.group_members mine
    join public.group_members theirs on theirs.group_id = mine.group_id
    where mine.user_id = (select auth.uid())
      and mine.status = 'active'
      and theirs.user_id = profiles.id
      and theirs.status = 'active'
  )
);

create policy profiles_update_self
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Groups
revoke all on public.groups from anon, authenticated;
grant select, insert, delete on public.groups to authenticated;
grant update (name, description, rules, avatar_url, timezone) on public.groups to authenticated;

create policy groups_select_member
on public.groups for select to authenticated
using (private.is_active_group_member(id));

create policy groups_insert_owner
on public.groups for insert to authenticated
with check (owner_id = (select auth.uid()));

create policy groups_update_admin
on public.groups for update to authenticated
using (private.is_group_admin(id))
with check (private.is_group_admin(id));

create policy groups_delete_owner
on public.groups for delete to authenticated
using (private.has_group_role(id, array['owner']::public.group_role[]));

-- Group members: read only through the Data API. Mutations go through RPCs.
revoke all on public.group_members from anon, authenticated;
grant select on public.group_members to authenticated;

create policy group_members_select_member
on public.group_members for select to authenticated
using (private.is_active_group_member(group_id));

-- Invites: admins can read/create/revoke; usage count changes only through RPC.
revoke all on public.group_invites from anon, authenticated;
grant select, insert, delete on public.group_invites to authenticated;
grant update (label, expires_at, max_uses, revoked_at) on public.group_invites to authenticated;

create policy group_invites_select_admin
on public.group_invites for select to authenticated
using (private.is_group_admin(group_id));

create policy group_invites_insert_admin
on public.group_invites for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.is_group_admin(group_id)
);

create policy group_invites_update_admin
on public.group_invites for update to authenticated
using (private.is_group_admin(group_id))
with check (private.is_group_admin(group_id));

create policy group_invites_delete_admin
on public.group_invites for delete to authenticated
using (private.is_group_admin(group_id));

-- Audit logs: admins can read only.
revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

create policy audit_logs_select_admin
on public.audit_logs for select to authenticated
using (group_id is not null and private.is_group_admin(group_id));

commit;
