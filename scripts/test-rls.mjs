import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'
import path from 'node:path'

const db = new PGlite()
const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const C = '33333333-3333-4333-8333-333333333333'
const groupA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const groupB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const meetupId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const optionId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'

await db.exec(`
  create schema if not exists auth;
  create schema if not exists storage;
  create schema if not exists extensions;
  create role anon;
  create role authenticated;
  create role service_role;
  grant usage on schema public, storage, auth, extensions to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key,
    phone text,
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb
  );
  create or replace function auth.uid() returns uuid
  language sql stable as $$
    select nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub','')::uuid
  $$;
  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets(id),
    name text not null,
    owner uuid,
    created_at timestamptz default now()
  );
  alter table storage.objects enable row level security;
  create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
    select string_to_array(name, '/')
  $$;
`)

const files = fs.readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort()
for (const file of files) {
  const sql = fs.readFileSync(path.join('supabase/migrations', file), 'utf8')
  await db.exec(sql.replace(/create extension if not exists pgcrypto with schema extensions;/g, ''))
}

async function asUser(userId, fn) {
  await db.exec('reset role')
  await db.exec(`set role authenticated`)
  await db.exec(`select set_config('request.jwt.claims', '${JSON.stringify({ sub: userId })}', false)`)
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
  }
}

async function count(sql) {
  const result = await db.query(sql)
  return Number(result.rows[0].count)
}

let failures = 0
function check(name, condition, detail = '') {
  if (condition) console.log('PASS', name)
  else {
    failures += 1
    console.error('FAIL', name, detail)
  }
}

await db.query(`insert into auth.users (id, phone, raw_user_meta_data) values
  ($1, '+84900000001', '{"display_name":"An"}'),
  ($2, '+84900000002', '{"display_name":"Bình"}'),
  ($3, '+84900000003', '{"display_name":"Chi"}')`, [A, B, C])

await asUser(A, async () => {
  await db.query(`insert into public.groups (id, owner_id, name) values ($1, $2, 'Nhóm A')`, [groupA, A])
})
await asUser(B, async () => {
  await db.query(`insert into public.groups (id, owner_id, name) values ($1, $2, 'Nhóm B')`, [groupB, B])
})

check('owner membership auto-created', await count(`select count(*) from public.group_members where group_id='${groupA}' and role='owner'`) === 1)

await asUser(A, async () => {
  check('A sees own group', await count(`select count(*) from public.groups`) === 1)
  check('A cannot see B group', await count(`select count(*) from public.groups where id='${groupB}'`) === 0)
  check('A cannot see B profile', await count(`select count(*) from public.profiles where id='${B}'`) === 0)
  const update = await db.query(`update public.groups set name='hacked' where id='${groupB}' returning id`)
  check('A cannot update B group', update.rows.length === 0)

  let denied = false
  try {
    await db.query(`insert into public.group_members (group_id, user_id, role, status) values ('${groupB}', '${A}', 'member', 'active')`)
  } catch {
    denied = true
  }
  check('member cannot self-insert membership', denied)

  await db.query(`insert into public.group_invites (group_id, created_by, token_hash, max_uses)
    values ('${groupA}', '${A}', repeat('a', 64), 1)`)
})

let redeemedGroup = null
await asUser(B, async () => {
  const result = await db.query(`select public.redeem_group_invite(repeat('a',64)) as group_id`)
  redeemedGroup = result.rows[0].group_id
})
check('valid invite redemption joins group', redeemedGroup === groupA)
check('invite use counted once', await count(`select count(*) from public.group_invites where token_hash=repeat('a',64) and uses_count=1`) === 1)

let exhausted = false
await asUser(C, async () => {
  try {
    await db.query(`select public.redeem_group_invite(repeat('a',64))`)
  } catch {
    exhausted = true
  }
})
check('exhausted invite rejected', exhausted)

await asUser(A, async () => {
  await db.query(`insert into public.meetups (id, group_id, created_by, title, activity_type)
    values ('${meetupId}', '${groupA}', '${A}', 'Cà phê', 'coffee')`)
  await db.query(`insert into public.meetup_time_options (id, meetup_id, starts_at, ends_at)
    values ('${optionId}', '${meetupId}', now() + interval '1 day', now() + interval '1 day 3 hours')`)
  await db.query(`select public.publish_meetup('${meetupId}')`)
})
check('publish sets proposed', await count(`select count(*) from public.meetups where id='${meetupId}' and status='proposed'`) === 1)
check('group member notified', await count(`select count(*) from public.notifications where user_id='${B}'`) === 1)

await asUser(B, async () => {
  await db.query(`insert into public.meetup_time_votes (meetup_id, time_option_id, user_id)
    values ('${meetupId}', '${optionId}', '${B}')`)
})
check('member can vote once', await count(`select count(*) from public.meetup_time_votes where meetup_id='${meetupId}' and user_id='${B}'`) === 1)

await asUser(A, async () => {
  await db.query(`select public.confirm_meetup('${meetupId}', '${optionId}', null)`)
})
check('confirm sets confirmed + starts_at', await count(`select count(*) from public.meetups where id='${meetupId}' and status='confirmed' and starts_at is not null`) === 1)

await asUser(B, async () => {
  await db.query(`select public.set_rsvp('${meetupId}', 'going', null, null)`)
  await db.query(`select public.set_rsvp('${meetupId}', 'not_going', null, 'Lý do riêng tư')`)
})
check('cancellation after going becomes cancelled', await count(`select count(*) from public.meetup_attendees where meetup_id='${meetupId}' and user_id='${B}' and status='cancelled'`) === 1)
check('cancellation request created', await count(`select count(*) from public.cancellation_requests where meetup_id='${meetupId}' and user_id='${B}' and status='pending'`) === 1)

await asUser(C, async () => {
  check('non-owner cannot read private cancellation reason', await count(`select count(*) from public.cancellation_requests where meetup_id='${meetupId}'`) === 0)
})
await asUser(A, async () => {
  check('owner can read cancellation reason', await count(`select count(*) from public.cancellation_requests where meetup_id='${meetupId}' and reason='Lý do riêng tư'`) === 1)
  await db.query(`select public.acknowledge_cancellation((select id from public.cancellation_requests where meetup_id='${meetupId}' limit 1))`)
})
check('acknowledge updates status', await count(`select count(*) from public.cancellation_requests where meetup_id='${meetupId}' and status='acknowledged'`) === 1)

let rsvpDenied = false
await asUser(B, async () => {
  try {
    await db.query(`update public.meetup_attendees set status='going' where meetup_id='${meetupId}' and user_id='${C}'`)
  } catch {
    rsvpDenied = true
  }
})
check('cannot update another user RSVP', rsvpDenied)

await asUser(B, async () => {
  check('non-admin cannot read audit logs', await count(`select count(*) from public.audit_logs where group_id='${groupA}'`) === 0)
})
await asUser(A, async () => {
  check('admin/owner can read audit logs', await count(`select count(*) from public.audit_logs where group_id='${groupA}'`) > 0)
})

await db.close()
if (failures > 0) {
  console.error(`\n${failures} RLS checks failed`)
  process.exitCode = 1
} else {
  console.log('\nAll RLS checks passed')
}
