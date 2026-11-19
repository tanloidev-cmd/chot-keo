-- Auth-facing helpers for the signed-in user
begin;

create or replace function public.get_my_phone()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select phone
  from private.account_recovery
  where user_id = (select auth.uid());
$$;

create or replace function public.rotate_my_recovery_code(p_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid recovery code' using errcode = '22023';
  end if;

  update private.account_recovery
  set recovery_code_hash = p_hash,
      failed_attempts = 0,
      locked_until = null,
      updated_at = now()
  where user_id = (select auth.uid());

  if not found then
    raise exception 'Recovery record not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.get_my_phone() from public;
revoke all on function public.rotate_my_recovery_code(text) from public;
grant execute on function public.get_my_phone() to authenticated;
grant execute on function public.rotate_my_recovery_code(text) to authenticated;

commit;
