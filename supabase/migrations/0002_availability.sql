-- Availability calendar
begin;

create type public.availability_status as enum ('available', 'unavailable', 'maybe');

create table public.availability_entries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  local_date date not null,
  start_time time,
  end_time time,
  status public.availability_status not null,
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, user_id, local_date),
  constraint availability_time_pair
    check ((start_time is null and end_time is null)
        or (start_time is not null and end_time is not null and end_time > start_time))
);

create index availability_entries_group_date_idx
  on public.availability_entries (group_id, local_date);
create index availability_entries_user_idx
  on public.availability_entries (group_id, user_id, local_date);

create trigger availability_entries_set_updated_at
  before update on public.availability_entries
  for each row execute function private.set_updated_at();

alter table public.availability_entries enable row level security;

revoke all on public.availability_entries from anon, authenticated;
grant select, insert, update, delete on public.availability_entries to authenticated;

create policy availability_select_group_member
on public.availability_entries for select to authenticated
using (private.is_active_group_member(group_id));

create policy availability_insert_self
on public.availability_entries for insert to authenticated
with check (
  user_id = (select auth.uid())
  and private.is_active_group_member(group_id)
);

create policy availability_update_self
on public.availability_entries for update to authenticated
using (
  user_id = (select auth.uid())
  and private.is_active_group_member(group_id)
)
with check (
  user_id = (select auth.uid())
  and private.is_active_group_member(group_id)
);

create policy availability_delete_self
on public.availability_entries for delete to authenticated
using (
  user_id = (select auth.uid())
  and private.is_active_group_member(group_id)
);

create or replace function public.upsert_availability_batch(
  p_group_id uuid,
  p_dates date[],
  p_status public.availability_status,
  p_start_time time default null,
  p_end_time time default null,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_date date;
  v_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not private.is_active_group_member(p_group_id) then
    raise exception 'Not a member of this group' using errcode = '42501';
  end if;

  if p_dates is null or cardinality(p_dates) = 0 then
    raise exception 'At least one date is required' using errcode = '22023';
  end if;

  if (p_start_time is null) <> (p_end_time is null) then
    raise exception 'Both start and end time are required' using errcode = '22023';
  end if;

  if p_start_time is not null and p_end_time <= p_start_time then
    raise exception 'End time must be after start time' using errcode = '22023';
  end if;

  foreach v_date in array p_dates loop
    insert into public.availability_entries
      (group_id, user_id, local_date, start_time, end_time, status, note)
    values
      (p_group_id, v_user_id, v_date, p_start_time, p_end_time, p_status,
       nullif(trim(coalesce(p_note, '')), ''))
    on conflict (group_id, user_id, local_date) do update
      set start_time = excluded.start_time,
          end_time = excluded.end_time,
          status = excluded.status,
          note = excluded.note,
          updated_at = now();

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.upsert_availability_batch(
  uuid, date[], public.availability_status, time, time, text
) from public;
grant execute on function public.upsert_availability_batch(
  uuid, date[], public.availability_status, time, time, text
) to authenticated;

commit;
