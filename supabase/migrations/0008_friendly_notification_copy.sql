-- Replace leftover English/abbreviations in notification copy.
-- Existing notifications keep the text they were created with, so update the
-- stored rows and refresh the functions that generate them.

update public.notifications
set body = replace(body, 'Vào xem thời gian, địa điểm và RSVP.', 'Vào xem thời gian, địa điểm và xác nhận tham gia.')
where body like '%RSVP%';

update public.notifications
set body = replace(body, 'Vào xem để cập nhật logistics.', 'Vào xem để sắp xếp lại kèo.')
where body like '%logistics%';

do $$
declare
  fn record;
  definition text;
  updated text;
begin
  for fn in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    definition := pg_get_functiondef(fn.oid);
    updated := replace(
      replace(
        definition,
        'Vào xem thời gian, địa điểm và RSVP.',
        'Vào xem thời gian, địa điểm và xác nhận tham gia.'
      ),
      'Vào xem để cập nhật logistics.',
      'Vào xem để sắp xếp lại kèo.'
    );

    if updated <> definition then
      execute updated;
    end if;
  end loop;
end
$$;
