-- Storage buckets, storage policies, realtime publication
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152,
    array['image/png', 'image/jpeg', 'image/webp']),
  ('group-avatars', 'group-avatars', true, 2097152,
    array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "group_avatars_public_read" on storage.objects;
create policy "group_avatars_public_read"
on storage.objects for select
using (bucket_id = 'group-avatars');

drop policy if exists "group_avatars_admin_write" on storage.objects;
create policy "group_avatars_admin_write"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'group-avatars'
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and private.has_group_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner', 'admin']::public.group_role[]
  )
);

drop policy if exists "group_avatars_admin_update" on storage.objects;
create policy "group_avatars_admin_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'group-avatars'
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and private.has_group_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner', 'admin']::public.group_role[]
  )
)
with check (
  bucket_id = 'group-avatars'
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and private.has_group_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner', 'admin']::public.group_role[]
  )
);

drop policy if exists "group_avatars_admin_delete" on storage.objects;
create policy "group_avatars_admin_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'group-avatars'
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and private.has_group_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner', 'admin']::public.group_role[]
  )
);

-- Realtime: subscribe only to rows the user is allowed to see. RLS applies.
do $$
declare
  v_table text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach v_table in array array[
    'availability_entries',
    'meetups',
    'meetup_time_votes',
    'meetup_venue_votes',
    'meetup_attendees',
    'host_assignments',
    'cancellation_requests',
    'notifications'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end;
$$;

alter table public.availability_entries replica identity full;
alter table public.meetups replica identity full;
alter table public.meetup_attendees replica identity full;
alter table public.notifications replica identity full;
alter table public.cancellation_requests replica identity full;
alter table public.host_assignments replica identity full;

commit;
