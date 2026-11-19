# Chốt Kèo

Ứng dụng PWA giúp nhóm bạn khai báo lịch rảnh, bình chọn ngày giờ/địa điểm,
chốt kèo, RSVP và giao chủ xị — mobile-first, tiếng Việt, chạy 0 đồng.

## Stack

- **Next.js 16** App Router + TypeScript + Tailwind CSS 4
- **shadcn/ui** (Radix) + **lucide-react** icons
- **Supabase**: Postgres, Auth, Realtime, Storage
- **Supabase CLI** migrations + RLS + RPC
- **Cloudflare Turnstile** (tùy chọn, miễn phí)
- **Vercel Hobby** + **Supabase Free**

Không dùng email, SMS, Resend, cron trả phí, Redis, queue hay Drizzle.

## Auth

- Đăng ký/đăng nhập bằng **số điện thoại + mật khẩu**.
- Không gửi SMS/email. Supabase Auth lưu email nội bộ không nhận thư
  (`849xxxxxxxx@phone.chotkeo.invalid`).
- Mã khôi phục 16 ký tự, hiển thị một lần, lưu hash.
- Turnstile + rate limit khi public.

## Chạy nhanh

```bash
npm install
npx supabase start
# copy API URL, anon key, service_role key vào .env.local
npx supabase db reset
npm run dev
```

Chi tiết từng bước, deploy Vercel và troubleshooting: xem **[RUNBOOK.md](./RUNBOOK.md)**.

## Scripts

```bash
npm run dev          # dev server
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # tsc
npm test             # Vitest
npm run test:rls     # SQL + RLS tests bằng PGlite
npm run test:e2e     # Playwright
npm run db:reset     # migrate local
npm run db:push      # migrate cloud
npm run seed:demo    # dữ liệu demo
npm run admin:reset -- 0901234567 NewPassword123
```

## Cấu trúc

```text
src/
  app/
    (auth)/            login, register, forgot-password
    (app)/             home, calendar, meetups, groups, profile, host, notifications
    join/[token]/      invite landing
  components/
    ui/                shadcn components
    auth/              auth forms, recovery code dialog
    groups/            group forms, members, invites, avatar
    meetups/           create/detail/edit/vote/RSVP
    availability/      lịch rảnh
  lib/
    actions/           server actions
    auth/              phone, recovery, session, actions
    supabase/          browser/server/admin clients
    queries.ts         server-side data access
supabase/
  migrations/          SQL schema, RLS, RPC, storage, realtime
  seed.sql
scripts/
  validate-sql.mjs     chạy migration bằng PGlite
  test-rls.mjs         test RLS cross-group/invite/cancellation
  seed-demo.mjs
  admin-reset-password.mjs
docs/                  PRD & M1 technical design gốc
```

## Bảo mật

- RLS bật trên toàn bộ bảng `public`; helper functions trong schema `private`.
- Không expose generic update/delete `group_members`; mọi thay đổi vai trò qua RPC.
- `groups.owner_id` không sửa trực tiếp; chuyển quyền qua RPC.
- Invite chỉ lưu SHA-256 hash; redeem atomic bằng row lock.
- Cancellation reason chỉ người gửi + Host/Owner/Admin đọc được.
- `SUPABASE_SECRET_KEY` chỉ dùng server-side.
- Service role chỉ dùng cho auth admin (đăng ký, reset) và rate limit.

## Giới hạn

- SĐT chưa xác minh chủ sở hữu (đổi lại: không tốn SMS).
- Không email/SMS/push; nhắc kèo chỉ hiện khi mở app.
- Supabase Free có thể pause sau 1 tuần không hoạt động.
- Vercel Hobby dành cho dự án phi thương mại.
- Google/Zalo/passkey để P1 khi có domain riêng.
