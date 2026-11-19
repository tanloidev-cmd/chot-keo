-- Public, token-scoped invite preview. The raw token is never stored.
begin;

create or replace function public.preview_group_invite(p_token_hash text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_invite public.group_invites%rowtype;
  v_group public.groups%rowtype;
  v_member_count integer;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('valid', false);
  end if;

  select * into v_invite
  from public.group_invites gi
  where gi.token_hash = p_token_hash
    and gi.revoked_at is null
    and (gi.expires_at is null or gi.expires_at > now())
    and (gi.max_uses is null or gi.uses_count < gi.max_uses);

  if not found then
    return jsonb_build_object('valid', false);
  end if;

  select * into v_group from public.groups where id = v_invite.group_id;
  if not found then
    return jsonb_build_object('valid', false);
  end if;

  select count(*) into v_member_count
  from public.group_members
  where group_id = v_group.id and status = 'active';

  return jsonb_build_object(
    'valid', true,
    'group_id', v_group.id,
    'group_name', v_group.name,
    'group_avatar_url', v_group.avatar_url,
    'member_count', v_member_count,
    'label', v_invite.label
  );
end;
$$;

revoke all on function public.preview_group_invite(text) from public;
grant execute on function public.preview_group_invite(text) to anon, authenticated;

commit;
