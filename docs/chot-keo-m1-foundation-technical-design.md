# Chốt Kèo --- Milestone 1: Foundation Technical Design

> **Version:** 0.1\
> **Date:** 19/11/2026\
> **Status:** Implementation-ready draft for review\
> **Scope:** PostgreSQL schema, RLS, authorization helpers, invite
> redemption, Next.js project structure, and security test plan.

------------------------------------------------------------------------

## 1. Mục tiêu và nguyên tắc thiết kế

Milestone 1 tạo nền móng có thể kiểm thử trước khi triển khai các màn
hình nghiệp vụ.

### 1.1. Phạm vi M1

-   Supabase project cho staging và production.
-   Supabase Auth email/password.
-   Profile được tạo tự động khi có Auth user.
-   Group, membership, invite link.
-   PostgreSQL schema và migration.
-   Row Level Security (RLS) cho các bảng.
-   Authorization helper functions.
-   Atomic invite redemption để không vượt số lượt dùng khi có request
    đồng thời.
-   Next.js App Router skeleton và Supabase SSR clients.
-   Test các tình huống truy cập được phép/không được phép.

### 1.2. Quyết định kỹ thuật

  -----------------------------------------------------------------------
  Hạng mục                            Quyết định
  ----------------------------------- -----------------------------------
  Database                            Supabase PostgreSQL

  Schema namespace                    `public` cho bảng ứng dụng;
                                      `private` cho helper functions

  Auth identity                       `auth.users.id` là UUID gốc

  Profile                             `public.profiles.id` tham chiếu
                                      `auth.users.id`

  Group roles                         `owner`, `admin`, `member`

  Membership status                   `active`, `removed`

  Migrations                          SQL migrations được commit vào Git;
                                      Drizzle Kit quản lý/generate
                                      migration theo quy trình đã chọn

  RLS                                 Bật trên toàn bộ bảng `public`

  Authorization                       RLS là lớp bảo vệ dữ liệu; server
                                      actions/route handlers vẫn kiểm tra
                                      input và quyền nghiệp vụ

  Invite token                        Token ngẫu nhiên, chỉ trả plaintext
                                      một lần; database chỉ lưu SHA-256
                                      hash

  Host                                Quyền theo meetup, không phải group
                                      role

  Timezone                            Lưu thời điểm thực tế bằng
                                      `timestamptz`; lưu timezone IANA
                                      khi cần tái hiện giờ địa phương
  -----------------------------------------------------------------------

### 1.3. Những gì chưa làm trong M1

-   Availability calendar.
-   Voting, RSVP, cancellation workflow.
-   Venue discovery/Maps.
-   Zalo OAuth hoặc Zalo group sync.
-   Push notification.
-   Billing, expenses, photo album.

Các bảng nghiệp vụ này sẽ được thêm ở M2/M3 bằng migration riêng, tránh
tạo schema quá rộng trước khi luồng cốt lõi được xác nhận.

------------------------------------------------------------------------

## 2. Permission model

### 2.1. Group permission matrix

  Action                      Owner   Admin   Member   Non-member
  ------------------------- ------- ------- -------- ------------
  Read group details            Yes     Yes      Yes           No
  Read active member list       Yes     Yes      Yes           No
  Update group settings         Yes     Yes       No           No
  Invite members                Yes     Yes       No           No
  Revoke/manage invites         Yes     Yes       No           No
  Remove ordinary member        Yes     Yes       No           No
  Remove admin                  Yes      No       No           No
  Promote/demote admin          Yes      No       No           No
  Delete group                  Yes      No       No           No

**MVP simplification:** Không cho Owner rời nhóm nếu chưa chuyển quyền
Owner cho người khác. Không cho phép xóa thành viên cuối cùng có role
Owner.

### 2.2. Group creation

Khi tạo group: 1. Authenticated user insert một row vào `groups` với
`owner_id = auth.uid()`. 2. Database trigger tự tạo membership `owner`
cho user đó. 3. Client không được tự insert role Owner cho một group đã
tồn tại.

Cách này tránh tình trạng tạo group thành công nhưng quên tạo
membership, đồng thời không cho member tự nâng quyền.

### 2.3. Host permissions

Host là assignment của một meetup. Không đưa `host` vào enum group role.

Khi triển khai M3: - Host chỉ có quyền điều phối meetup được giao. -
Host không tự có quyền quản lý group. - Host không có quyền xem dữ liệu
riêng tư ngoài phạm vi meetup. - Việc xử lý cancellation chỉ phục vụ
điều phối; không thể ép người dùng tham dự.

------------------------------------------------------------------------

## 3. Database schema --- M1

### 3.1. Entity relationship overview

``` mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : has
    PROFILES ||--o{ GROUPS : owns
    GROUPS ||--o{ GROUP_MEMBERS : contains
    PROFILES ||--o{ GROUP_MEMBERS : joins
    GROUPS ||--o{ GROUP_INVITES : issues
    PROFILES ||--o{ GROUP_INVITES : creates

    AUTH_USERS {
        uuid id PK
    }
    PROFILES {
        uuid id PK
        text display_name
        text avatar_url
        timestamptz created_at
    }
    GROUPS {
        uuid id PK
        uuid owner_id FK
        text name
        text description
        timestamptz created_at
    }
    GROUP_MEMBERS {
        uuid group_id PK,FK
        uuid user_id PK,FK
        text role
        text status
        timestamptz joined_at
    }
    GROUP_INVITES {
        uuid id PK
        uuid group_id FK
        uuid created_by FK
        text token_hash UK
        timestamptz expires_at
        integer max_uses
        integer uses_count
        timestamptz revoked_at
    }
```

### 3.2. Tables

  -----------------------------------------------------------------------
  Table                   Mục đích                Ghi chú
  ----------------------- ----------------------- -----------------------
  `profiles`              Hồ sơ public trong app  Không lưu
                                                  email/password; Auth
                                                  quản lý credential

  `groups`                Nhóm bạn                Owner được tham chiếu
                                                  bằng `owner_id`

  `group_members`         Membership và role      Một user có thể tham
                                                  gia nhiều group

  `group_invites`         Invite links            Chỉ lưu token hash, có
                                                  expiry/usage
                                                  limit/revocation
  -----------------------------------------------------------------------

### 3.3. Initial SQL migration

Tạo file:

`supabase/migrations/0001_foundation.sql`

``` sql
-- Chot Keo / M1 Foundation
-- Apply using Supabase CLI migration workflow.
-- Do not run this against production before staging tests pass.

begin;

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

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

create index groups_owner_id_idx
  on public.groups (owner_id);

create table public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  token_hash text not null unique
    check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz,
  max_uses integer
    check (max_uses is null or max_uses > 0),
  uses_count integer not null default 0
    check (uses_count >= 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint group_invites_usage_limit
    check (max_uses is null or uses_count <= max_uses)
);

create index group_invites_group_id_idx
  on public.group_invites (group_id);

create index group_invites_active_lookup_idx
  on public.group_invites (token_hash)
  where revoked_at is null;

-- Profile bootstrap. The Auth user's metadata is untrusted input:
-- use only a bounded display name and fall back to a safe default.
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
    v_display_name := 'New member';
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

-- Create owner membership automatically whenever a group is created.
create or replace function private.create_group_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_members (group_id, user_id, role, status)
  values (new.id, new.owner_id, 'owner', 'active');

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

-- Authorization helpers. They live in a non-exposed schema and use
-- a fixed empty search_path with fully-qualified object names.
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

revoke all on function private.is_active_group_member(uuid) from public;
revoke all on function private.has_group_role(uuid, public.group_role[]) from public;
grant execute on function private.is_active_group_member(uuid) to authenticated;
grant execute on function private.has_group_role(uuid, public.group_role[]) to authenticated;

-- Atomic invite redemption:
-- The caller sends a SHA-256 hex digest of the raw invite token.
-- The raw token must never be stored in the database.
create or replace function private.redeem_group_invite(p_token_hash text)
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
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid invite'
      using errcode = '22023';
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
    raise exception 'Invite is invalid or expired'
      using errcode = '22023';
  end if;

  -- Do not consume another use when the user is already an active member.
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
  on conflict (group_id, user_id)
  do update set
    role = 'member',
    status = 'active',
    joined_at = now(),
    updated_at = now();

  return v_invite.group_id;
end;
$$;

revoke all on function private.redeem_group_invite(text) from public;
grant execute on function private.redeem_group_invite(text) to authenticated;

-- RLS
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;

-- Explicit table grants; RLS still decides which rows are visible/writable.
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.groups to authenticated;
grant select, insert, update, delete on public.group_members to authenticated;
grant select, insert, update, delete on public.group_invites to authenticated;

-- Profiles: authenticated users can read profiles of people sharing a group,
-- and can update only their own profile.
create policy profiles_select_self_or_shared_group
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.group_members mine
    join public.group_members theirs
      on theirs.group_id = mine.group_id
    where mine.user_id = (select auth.uid())
      and mine.status = 'active'
      and theirs.user_id = profiles.id
      and theirs.status = 'active'
  )
);

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Group: members can read; only owner/admin can update.
create policy groups_select_member
on public.groups
for select
to authenticated
using (private.is_active_group_member(id));

create policy groups_insert_owner
on public.groups
for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy groups_update_admin
on public.groups
for update
to authenticated
using (
  private.has_group_role(id, array['owner', 'admin']::public.group_role[])
)
with check (
  private.has_group_role(id, array['owner', 'admin']::public.group_role[])
);

create policy groups_delete_owner
on public.groups
for delete
to authenticated
using (
  private.has_group_role(id, array['owner']::public.group_role[])
);

-- Membership: group members can read the roster.
-- Self-join is intentionally not allowed through direct INSERT; invite redemption
-- is the only member join path in M1.
create policy group_members_select_member
on public.group_members
for select
to authenticated
using (private.is_active_group_member(group_id));

create policy group_members_insert_owner_bootstrap
on public.group_members
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'owner'
  and status = 'active'
  and exists (
    select 1
    from public.groups g
    where g.id = group_id
      and g.owner_id = (select auth.uid())
  )
);

create policy group_members_update_admin
on public.group_members
for update
to authenticated
using (
  private.has_group_role(
    group_id,
    array['owner', 'admin']::public.group_role[]
  )
  and not (role = 'owner')
)
with check (
  private.has_group_role(
    group_id,
    array['owner', 'admin']::public.group_role[]
  )
  and not (role = 'owner')
);

create policy group_members_delete_admin
on public.group_members
for delete
to authenticated
using (
  private.has_group_role(
    group_id,
    array['owner', 'admin']::public.group_role[]
  )
  and role <> 'owner'
);

-- Invites: only active owners/admins can read or manage invite records.
-- Invite redemption is performed through private.redeem_group_invite().
create policy group_invites_select_admin
on public.group_invites
for select
to authenticated
using (
  private.has_group_role(
    group_id,
    array['owner', 'admin']::public.group_role[]
  )
);

create policy group_invites_insert_admin
on public.group_invites
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_group_role(
    group_id,
    array['owner', 'admin']::public.group_role[]
  )
);

create policy group_invites_update_admin
on public.group_invites
for update
to authenticated
using (
  private.has_group_role(
    group_id,
    array['owner', 'admin']::public.group_role[]
  )
)
with check (
  private.has_group_role(
    group_id,
    array['owner', 'admin']::public.group_role[]
  )
);

create policy group_invites_delete_admin
on public.group_invites
for delete
to authenticated
using (
  private.has_group_role(
    group_id,
    array['owner', 'admin']::public.group_role[]
  )
);

commit;
```

### 3.4. Important migration notes

1.  **Profile trigger:** Auth metadata is user-controlled. It is only
    used as a display-name suggestion, length-limited and given a
    fallback. Do not copy arbitrary metadata into privileged columns.
2.  **Private schema:** Add `private` to no Supabase API exposed-schema
    list. The helper functions are not public API endpoints.
3.  **Security definer:** All such functions pin `search_path` to the
    empty string and fully qualify table/function names. Review function
    ownership and grants in staging.
4.  **Invite token:** Generate at least 32 random bytes in the server,
    encode as base64url/hex, show raw token once, and store only SHA-256
    hex digest. The route handler hashes the token before calling the
    RPC.
5.  **Invite redemption:** The row lock serializes simultaneous
    redemptions of the same invite, so `uses_count` cannot race past
    `max_uses`.
6.  **Owner bootstrap:** Group insert is followed by a database trigger
    creating the owner membership in the same transaction.
7.  **No direct membership self-join:** New members must use invite
    redemption. Admin role changes should be implemented through a
    dedicated server-side operation with explicit validation.
8.  **Group deletion:** This draft permits only Owner to delete a group.
    Consider replacing hard delete with `archived_at` once audit/history
    requirements are finalized.
9.  **Profile visibility:** The policy allows reading a profile only for
    self or active members sharing at least one group. If the product
    later needs public profile previews, create a separate safe view
    rather than broadening this table.
10. **Review before production:** This is a starting migration, not a
    substitute for running SQL and authorization tests against a real
    staging Supabase project.

------------------------------------------------------------------------

## 4. Important hardening follow-ups before production

The initial migration is intentionally conservative, but the following
controls should be completed before launch:

### 4.1. Prevent privilege escalation in membership updates

The policy above is a row-level boundary, not a complete role-transition
state machine. In particular, role changes should not be exposed as a
generic client update.

Implement a server-only operation or narrowly scoped RPC that: - Allows
only Owner to promote/demote Admin. - Allows Owner/Admin to remove
ordinary Members. - Does not allow Admin to promote another Admin or
change Owner. - Prevents removing/demoting the last Owner. - Prevents an
Owner from leaving without transferring ownership. - Writes an audit
event for role changes/removals.

For the first implementation, **do not expose generic `UPDATE` on
`group_members` to the client**. Revoke the table update grant and add
only the dedicated RPC after the role-transition rules are finalized.

### 4.2. Avoid trusting group owner fields from the client

The group insert policy requires `owner_id = auth.uid()`. The database
trigger creates the owner membership. Do not allow an update policy to
change `groups.owner_id`; ownership transfer must be a separate atomic
operation.

### 4.3. Restrict profile columns

RLS controls rows, not which columns a user can update. For stronger
protection, use column-level grants or a server-side profile update
function. Do not let profile updates modify fields that later become
privileged (e.g. internal flags).

### 4.4. RPC exposure and schema configuration

The `private` schema must not be exposed through the Supabase Data API.
Grant `EXECUTE` only to the roles that need it. Security-definer
functions must have a minimal owner and minimal behavior.

### 4.5. Service role

Do not use a service-role/secret key in ordinary user-facing server
actions. Prefer an SSR Supabase client carrying the user's session so
Postgres sees the authenticated user and RLS applies. If an
administrative background task truly requires service role, isolate it
in a server-only module and validate every input.

------------------------------------------------------------------------

## 5. Next.js project structure

Recommended starting structure:

``` text
chot-keo/
├── public/
│   ├── icons/
│   ├── images/
│   └── manifest.webmanifest
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   └── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── auth/callback/route.ts
│   │   ├── (app)/
│   │   │   ├── layout.tsx
│   │   │   ├── home/page.tsx
│   │   │   ├── groups/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [groupId]/page.tsx
│   │   │   └── settings/profile/page.tsx
│   │   ├── api/
│   │   │   └── invites/redeem/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   ├── navigation/
│   │   ├── groups/
│   │   └── forms/
│   ├── features/
│   │   ├── auth/
│   │   ├── groups/
│   │   └── invites/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   └── schema/
│   │   ├── auth/
│   │   ├── validation/
│   │   └── utils/
│   └── types/
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   └── tests/
├── drizzle/
├── drizzle.config.ts
├── middleware.ts
├── .env.example
├── package.json
└── tsconfig.json
```

### 5.1. Responsibility boundaries

-   `app/`: routing, layouts, page composition and route handlers.
-   `features/`: use cases and feature-specific UI.
-   `lib/supabase/client.ts`: browser client only.
-   `lib/supabase/server.ts`: server client using request cookies.
-   `lib/db/`: Drizzle connection and typed schema.
-   `supabase/migrations/`: SQL migrations, RLS, triggers and functions.
-   `supabase/tests/`: pgTAP database tests.
-   `drizzle/`: Drizzle Kit generated migration artifacts if the team
    chooses Drizzle Kit as the migration runner.

**Migration source of truth:** Do not maintain two independent migration
histories. If Supabase CLI migrations are used to apply SQL, Drizzle Kit
must not separately apply the same DDL. If Drizzle Kit is the migration
runner, keep the custom RLS/function SQL in the same Drizzle migration
history. Pick one runner and document it in the repository.

------------------------------------------------------------------------

## 6. Supabase SSR client pattern

Use the current `@supabase/ssr` package and cookie-based sessions.

### 6.1. Browser client

`src/lib/supabase/client.ts`

``` ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

### 6.2. Server client

`src/lib/supabase/server.ts`

``` ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always write cookies.
            // Refresh/session cookie writes should be handled in the
            // request proxy/middleware integration recommended by Supabase.
          }
        },
      },
    },
  );
}
```

The exact Next.js request proxy/middleware integration should follow the
current Supabase SSR guide for the installed Next.js version. Do not
copy an old middleware example without checking the current guide.

### 6.3. Authentication check

For protected server pages/actions: - Create the server Supabase
client. - Verify the user using the current Supabase SSR guidance
(`getUser()` where a verified user identity is required). - Do not
authorize from an unverified client-side session object. - Return a
controlled unauthenticated response or redirect. - Let RLS enforce
row-level access on the database.

------------------------------------------------------------------------

## 7. Invite link implementation

### 7.1. Token generation

Server-side only:

``` ts
import { createHash, randomBytes } from "node:crypto";

export function createInviteToken() {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  return { rawToken, tokenHash };
}
```

The URL contains the raw token:

`https://<app-domain>/join/<raw-token>`

Database stores only `token_hash`.

### 7.2. Redemption flow

1.  User opens `/join/[token]`.
2.  If not authenticated, redirect to login/register and preserve the
    return URL safely.
3.  After authentication, send the raw token to a server Route Handler
    over HTTPS.
4.  Route Handler hashes token using SHA-256.
5.  Call `private.redeem_group_invite(hash)` through an authenticated
    Supabase session/RPC path.
6.  Database locks invite row, validates expiry/revocation/usage,
    increments usage and inserts membership atomically.
7.  Redirect to `/groups/<groupId>`.

Do not log raw invite tokens in analytics, server logs, error messages
or tracing breadcrumbs.

### 7.3. Important behavior

-   Invalid, expired, revoked and exhausted links should show a generic
    invalid-invite message.
-   An already-active member opening the same invite should be
    idempotent and should not consume another use.
-   A removed member may rejoin only if the invite is valid; the RPC
    reactivates them as `member`, not their previous elevated role.
-   Invite redemption must be tested with concurrent requests.

------------------------------------------------------------------------

## 8. Environment variables

`.env.example`

``` dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Server only. Do not expose to browser.
SUPABASE_SECRET_KEY=

# Server only. Use the Supabase pooler connection string appropriate
# for the runtime and migration process.
DATABASE_URL=

RESEND_API_KEY=
CRON_SECRET=
```

Do not prefix secrets with `NEXT_PUBLIC_`. Keep separate credentials for
local, staging and production.

------------------------------------------------------------------------

## 9. Test plan

### 9.1. Database tests

Use Supabase database tests/pgTAP. Tests should run against a disposable
local or CI database, not production.

  -----------------------------------------------------------------------
  Test                                Expected result
  ----------------------------------- -----------------------------------
  Unauthenticated user reads groups   No rows

  User A reads group A                Allowed

  User A reads group B without        No rows
  membership                          

  User A reads group A member roster  Allowed

  User A reads profile of unrelated   No rows
  user                                

  User A updates own profile          Allowed

  User A updates User B profile       No rows / rejected

  Member updates group settings       Rejected

  Admin updates group settings        Allowed

  Member creates group with self as   Allowed; owner membership
  owner                               auto-created

  User creates group with another     Rejected
  user as owner                       

  Member inserts self into arbitrary  Rejected
  group_members                       

  Member reads invite hashes          No rows

  Admin creates invite                Allowed

  Non-admin creates invite            Rejected

  Valid invite redemption             Membership created

  Expired/revoked invite redemption   Rejected

  Invite at max_uses under concurrent Usage never exceeds max
  redemption                          

  Removed member redeems a valid      Membership reactivated as member
  invite                              
  -----------------------------------------------------------------------

### 9.2. Application tests

-   Registration creates profile.
-   Login and logout work.
-   Session survives refresh.
-   Protected routes redirect unauthenticated users.
-   Group creation shows the new group and Owner role.
-   Invite link can be copied/shared.
-   Invalid invite has a safe error state.
-   A user cannot switch group IDs in the URL to access another group's
    page.
-   No secret key appears in browser bundles.

### 9.3. Example pgTAP test skeleton

`supabase/tests/001_foundation_rls.test.sql`

``` sql
begin;

select plan(8);

-- Use Supabase pgTAP helpers / test JWT claims to assume authenticated users.
-- Seed two users, two groups and memberships in the test setup.
-- The exact helper calls should match the installed Supabase local version.

-- Examples of assertions to implement:
-- 1. member can select own group
-- 2. non-member cannot select another group
-- 3. member cannot update group
-- 4. admin can update group
-- 5. user cannot insert arbitrary membership
-- 6. invite hash is not visible to ordinary members
-- 7. profile update is self-only
-- 8. group owner membership is created by trigger

select * from finish();

rollback;
```

This is a test skeleton, not a runnable finished suite: user fixtures
and JWT switching helpers must be wired to the actual local Supabase
test setup.

------------------------------------------------------------------------

## 10. CI/CD and migration workflow

Recommended pull request checks:

``` text
Pull Request
   |
   +--> ESLint
   +--> TypeScript typecheck
   +--> Unit tests
   +--> Supabase local start
   +--> Apply migrations to clean database
   +--> pgTAP RLS tests
   +--> Next.js production build
   +--> E2E smoke tests
   |
   v
Vercel Preview + isolated staging/test database
```

Migration workflow: 1. Developer creates a migration. 2. Apply it to a
disposable local database. 3. Run schema and RLS tests. 4. Open PR with
migration SQL included. 5. CI applies all migrations to a clean
database. 6. Merge only after checks pass. 7. Apply migration to
staging. 8. Verify smoke tests. 9. Promote application and migration to
production using a controlled release step.

Never use `drizzle-kit push` as the production deployment mechanism. Use
reviewed, versioned migrations.

------------------------------------------------------------------------

## 11. M1 completion checklist

-   [ ] Create Supabase staging project in Singapore.
-   [ ] Create Supabase production project in Singapore.
-   [ ] Configure Auth email settings and redirect URLs.
-   [ ] Create Next.js App Router project.
-   [ ] Add Tailwind and shadcn/ui.
-   [ ] Add `@supabase/supabase-js` and `@supabase/ssr`.
-   [ ] Configure browser and server Supabase clients.
-   [ ] Add database schema and migration.
-   [ ] Review helper functions and grants.
-   [ ] Review the membership update policy; replace generic updates
    with dedicated RPC before enabling admin UI.
-   [ ] Run RLS tests for member/admin/owner/non-member.
-   [ ] Implement auth pages and protected app shell.
-   [ ] Implement group create/list/detail.
-   [ ] Implement invite creation/revocation/redemption.
-   [ ] Configure Vercel Preview to use staging only.
-   [ ] Configure Production to use production Supabase only.
-   [ ] Verify no secret key is present in client output.
-   [ ] Run a staging backup/restore exercise before production launch.

------------------------------------------------------------------------

## 12. Recommended implementation order

  Step   Deliverable                         Exit criteria
  ------ ----------------------------------- ----------------------------------------------------
  1      Repository and Next.js skeleton     Local app builds and runs
  2      Supabase local/staging setup        Auth and DB connectivity work
  3      Foundation migration                Clean DB can apply migration
  4      RLS helper functions and policies   Allow/deny tests pass
  5      Auth flow                           Register/login/logout/session refresh work
  6      Group CRUD                          Group data is isolated
  7      Invite flow                         Expiry, revocation and usage limit work atomically
  8      Vercel preview/staging              PR preview never touches production DB

**M1 is complete only when authorization tests pass.** A working UI
without proven RLS isolation is not a completed foundation.

------------------------------------------------------------------------

## 13. Official references

-   Supabase Row Level Security:
    https://supabase.com/docs/guides/database/postgres/row-level-security
-   Supabase SSR Auth: https://supabase.com/docs/guides/auth/server-side
-   Supabase SSR client creation for Next.js:
    https://supabase.com/docs/guides/auth/server-side/creating-a-client
-   Supabase database testing:
    https://supabase.com/docs/guides/database/extensions/pgtap
-   Supabase CLI local development:
    https://supabase.com/docs/guides/local-development
-   Drizzle migrations: https://orm.drizzle.team/docs/migrations
-   Drizzle Kit generate:
    https://orm.drizzle.team/docs/drizzle-kit-generate
-   Drizzle Kit migrate:
    https://orm.drizzle.team/docs/drizzle-kit-migrate

> **Important:** Before production, run this migration on a clean
> local/staging Supabase project and complete the RLS tests. The SQL is
> a reviewable implementation draft; it has not been executed against
> your Supabase project in this conversation.
