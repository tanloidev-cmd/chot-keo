-- Group audit + membership cleanup
begin;

create or replace function private.audit_group_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.write_audit(
    new.id,
    coalesce(auth.uid(), new.owner_id),
    'group.created',
    'group',
    new.id,
    jsonb_build_object('name', new.name)
  );
  return new;
end;
$$;

revoke all on function private.audit_group_insert() from public;

create trigger group_audit_insert
  after insert on public.groups
  for each row execute function private.audit_group_insert();

create or replace function private.cleanup_removed_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'removed' and old.status = 'active' then
    delete from public.host_assignments h
    using public.meetups m
    where h.meetup_id = m.id
      and m.group_id = new.group_id
      and h.user_id = new.user_id;
  end if;

  return new;
end;
$$;

revoke all on function private.cleanup_removed_member() from public;

create trigger group_members_cleanup_removed
  after update of status on public.group_members
  for each row execute function private.cleanup_removed_member();

commit;
