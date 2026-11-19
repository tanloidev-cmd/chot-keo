# RUNBOOK — Chốt Kèo MVP

Tài liệu này đưa ứng dụng từ máy sạch đến một bản chạy được. Làm đúng thứ tự.

> **Mô hình auth đã chốt:** số điện thoại + mật khẩu, **không SMS, không email**.
> Supabase Auth lưu một email nội bộ không nhận thư (`849xxxxxxxx@phone.chotkeo.invalid`)
> để không cần SMS provider. Người dùng chỉ thấy và nhập số điện thoại.

---

## 0. Chuẩn bị

| Thứ cần có | Ghi chú |
|---|---|
| Node.js 22+ | `node -v` |
| npm | đi kèm Node |
| Docker Desktop | chỉ cần cho Supabase local |
| Tài khoản Supabase | gói Free là đủ |
| Tài khoản Vercel | gói Hobby là đủ cho demo |
| Cloudflare Turnstile | miễn phí, nên bật khi public |

Cài dependencies:

```bash
npm install
```

---

## 1. Chạy local (khuyến nghị)

> Nếu máy không có Docker/không chạy được Docker Desktop, bỏ qua mục 1.1–1.3,
> tạo project Supabase cloud ở mục 2 rồi dùng `.env.local` trỏ vào cloud.

### 1.1. Khởi động Supabase local

Mở Docker Desktop trước, sau đó:

```bash
npx supabase start
```

Lần đầu sẽ tải Docker images, có thể mất vài phút.

Lấy URL và keys:

```bash
npx supabase status
```

Ghi lại:

- `API URL` → `NEXT_PUBLIC_SUPABASE_URL` (thường `http://127.0.0.1:54321`)
- `anon key` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `service_role key` → `SUPABASE_SECRET_KEY`

> Không commit các key này. `.env.local` đã nằm trong `.gitignore`.

### 1.2. Điền `.env.local`

Tạo file `.env.local` (copy từ `.env.example`):

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key>
SUPABASE_SECRET_KEY=<service_role key>

AUTH_IDENTIFIER_MODE=email
AUTH_PHONE_EMAIL_DOMAIN=phone.chotkeo.invalid

NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

### 1.3. Áp dụng migration

```bash
npx supabase db reset
```

Lệnh này tạo lại database local, chạy toàn bộ migration trong
`supabase/migrations/`, rồi chạy `supabase/seed.sql`.

Nếu chỉ muốn áp migration mới:

```bash
npx supabase migration up
```

### 1.4. Chạy app

```bash
npm run dev
```

Mở http://localhost:3000.

### 1.5. Tạo dữ liệu demo (tùy chọn)

```bash
npm run seed:demo
```

Tài khoản demo:

| SĐT | Mật khẩu |
|---|---|
| 0900000001 | Chotkeo123 |
| 0900000002 | Chotkeo123 |
| 0900000003 | Chotkeo123 |

Đăng nhập bằng SĐT. Không có SMS nào được gửi.

### 1.6. Kiểm tra nhanh local

- [ ] Đăng ký SĐT mới → thấy hộp thoại mã khôi phục.
- [ ] Đăng xuất, đăng nhập lại bằng SĐT + mật khẩu.
- [ ] Tạo nhóm.
- [ ] Mở link mời ở cửa sổ ẩn danh, đăng ký tài khoản thứ hai, tham gia nhóm.
- [ ] Cập nhật lịch rảnh cho 2 ngày.
- [ ] Tạo kèo với 2 phương án, bình chọn, chốt kèo.
- [ ] RSVP “Sẽ đi”, sau đó “Không đi” kèm lý do.
- [ ] Chủ xị thấy yêu cầu hủy và bấm “Ghi nhận”.
- [ ] Thông báo xuất hiện ở chuông.

---

## 2. Triển khai Supabase cloud (miễn phí)

### 2.1. Tạo project

1. Vào https://supabase.com/dashboard → **New project**.
2. Region: **Southeast Asia (Singapore)**.
3. Lưu database password.
4. Chờ project khởi tạo xong.

### 2.2. Lấy keys

Vào **Project Settings → API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **Publishable / anon key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Secret / service_role key** → `SUPABASE_SECRET_KEY` (chỉ server)

### 2.3. Đẩy schema

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Nếu được hỏi reset database, chỉ chọn **Yes** khi đây là project mới.

Kiểm tra trong Dashboard:

- **Table Editor** có `profiles`, `groups`, `meetups`, `notifications`...
- **Storage** có bucket `avatars`, `group-avatars`.
- **Database → Publications** có `supabase_realtime` chứa các bảng realtime.

### 2.4. Cấu hình Auth

Vào **Authentication → Sign In / Providers**:

- **Email**: bật.
- **Confirm email**: **TẮT** (app dùng email nội bộ, không gửi thư).
- **Phone**: có thể để tắt. App không dùng phone provider ở chế độ mặc định.
- **Password**: tối thiểu 8 ký tự, yêu cầu chữ + số nếu Dashboard cho chọn.

Vào **Authentication → URL Configuration**:

- **Site URL**: `https://<domain-của-bạn>`
- **Redirect URLs**: thêm `https://<domain>/**` và `http://localhost:3000/**`.

> Không cần SMTP, Resend, Twilio, Zalo hay Google.

### 2.5. Kiểm tra đăng ký trên cloud

1. Chạy app local trỏ vào Supabase cloud (đổi `.env.local`).
2. Đăng ký một SĐT thật.
3. Nếu lỗi `Email address is invalid`, đổi `AUTH_PHONE_EMAIL_DOMAIN` sang một domain
   hợp lệ về cú pháp, ví dụ `users.chotkeo.app` (không cần nhận thư), rồi đăng ký lại.
   **Chốt domain này trước khi tạo user thật**: đổi domain sau đó sẽ làm email nội bộ
   của user cũ thay đổi và họ không đăng nhập được.

---

## 3. Triển khai Vercel (miễn phí)

### 3.1. Import project

1. Push code lên GitHub.
2. Vercel → **Add New → Project** → chọn repo.
3. Framework: **Next.js**.
4. Build command: `npm run build`.
5. Install command: `npm install`.

### 3.2. Environment variables

Thêm các biến giống `.env.local`, nhưng dùng giá trị production:

| Biến | Giá trị |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://<domain-vercel>` |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SECRET_KEY` | Secret key |
| `AUTH_IDENTIFIER_MODE` | `email` |
| `AUTH_PHONE_EMAIL_DOMAIN` | `phone.chotkeo.invalid` |
| `APP_TZ` | `Asia/Ho_Chi_Minh` (tùy chọn — xem ghi chú dưới) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | nếu bật Turnstile |
| `TURNSTILE_SECRET_KEY` | nếu bật Turnstile |

> **Không thêm `TZ` trên Vercel.** Vercel giữ tên `TZ` làm biến hệ thống (function
> luôn chạy UTC) nên giao diện báo *"The name of your Environment Variable is
> reserved"*. App tự đặt `process.env.TZ` lúc khởi động từ `APP_TZ`
> (`src/instrumentation.ts` → `src/lib/timezone.ts`), mặc định
> `Asia/Ho_Chi_Minh`. Chỉ cần thêm `APP_TZ` khi muốn múi giờ khác.

Deploy.

### 3.3. Cập nhật URL trong Supabase

Sau khi có domain Vercel:

- **Authentication → URL Configuration → Site URL**: domain Vercel.
- Thêm domain Vercel vào **Redirect URLs**.

### 3.4. Bật Turnstile (khuyến nghị khi public)

1. Cloudflare Dashboard → **Turnstile** → **Add site**.
2. Domain: domain Vercel (hoặc domain riêng).
3. Lấy **Site Key** và **Secret Key**.
4. Thêm vào Vercel env:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
5. Redeploy.

Local để trống hai biến này để bỏ qua CAPTCHA.

---

## 4. Checklist sau deploy

- [ ] `GET /api/health` trả `"ok": true` và các cờ cấu hình `true`.
- [ ] Trang chủ mở được, không lỗi 500.
- [ ] Đăng ký SĐT mới thành công, hiện mã khôi phục.
- [ ] Đăng xuất/đăng nhập lại.
- [ ] Tạo nhóm.
- [ ] Copy link mời, mở bằng cửa sổ ẩn danh, tham gia nhóm.
- [ ] Cập nhật lịch rảnh.
- [ ] Tạo kèo, bình chọn, chốt kèo.
- [ ] RSVP và hủy tham gia kèm lý do.
- [ ] Chủ xị ghi nhận yêu cầu hủy.
- [ ] Thông báo realtime xuất hiện.
- [ ] Cài PWA trên điện thoại (“Thêm vào màn hình chính”).
- [ ] Không thấy `SUPABASE_SECRET_KEY` trong DevTools → Sources/Network.

---

## 5. Quên mật khẩu / mất mã khôi phục

### 5.1. Người dùng còn mã khôi phục

Dùng trang **Quên mật khẩu**: nhập SĐT + mã khôi phục + mật khẩu mới.
Hệ thống tạo mã khôi phục mới và hiển thị một lần.

### 5.2. Người dùng mất cả mật khẩu và mã

Chạy script admin (dùng `SUPABASE_SECRET_KEY` production):

```bash
npm run admin:reset -- 0901234567 NewPassword123
```

Script in ra mã khôi phục mới. Gửi riêng cho người dùng qua kênh tin cậy.

Hoặc vào **Supabase Dashboard → Authentication → Users**, tìm user có email
`849xxxxxxxx@phone.chotkeo.invalid`, đổi mật khẩu thủ công.

> Không có khôi phục tự động qua SMS/email vì sản phẩm chạy 0 đồng.

---

## 6. Kiểm thử

```bash
npm run lint
npm run typecheck
npm test
npm run test:rls
npm run build
```

- `npm run test:rls` kiểm tra SQL migration và các case RLS bằng PGlite:
  cross-group, invite hết lượt, private cancellation reason, vote/RSVP.
- `npm run test:concurrency` cần Supabase local đang chạy và env hợp lệ; kiểm tra
  invite `max_uses=1` và confirm meetup khi hai request đồng thời.
- `npm run test:e2e` cần Supabase local đang chạy và Playwright browser:
  `npx playwright install chromium`.

---

## 7. Vận hành & giới hạn free tier

- **Supabase Free** có thể bị pause sau 1 tuần không hoạt động. Vào Dashboard bấm
  **Restore** nếu app báo lỗi kết nối.
- **Vercel Hobby** dành cho dự án cá nhân/phi thương mại. Nếu dùng thương mại,
  nâng lên Pro.
- Không có email/SMS/push. Nhắc kèo 24h/2h được tạo khi người dùng mở app.
- Không có Google/Zalo login trong P0. Có thể bổ sung sau khi có domain riêng.
- SĐT chưa được xác minh chủ sở hữu. Giảm rủi ro bằng:
  - Turnstile + rate limit khi đăng ký/đăng nhập.
  - Link mời nhóm có hạn/giới hạn lượt.
  - Chỉ thành viên nhóm thấy dữ liệu nhóm.
  - Owner/Admin có thể xóa thành viên.

### Backup

```bash
npx supabase db dump --project-ref <project-ref> -f backup.sql
```

Supabase Free không đảm bảo backup dài hạn. Với dữ liệu quan trọng, nâng Pro hoặc
tự chạy dump định kỳ.

### Rollback migration

Migration được version hóa trong `supabase/migrations/`. Nếu một migration lỗi:

1. Tạo migration mới để sửa (forward-fix), không sửa tay production.
2. Chạy `npx supabase db push`.
3. Kiểm tra smoke test.

---

## 8. Troubleshooting

| Lỗi | Nguyên nhân / cách xử lý |
|---|---|
| `Máy chủ chưa cấu hình SUPABASE_SECRET_KEY` | Thiếu `SUPABASE_SECRET_KEY` trong `.env.local`/Vercel. |
| `relation "private..." does not exist` | Chưa chạy migration. `npx supabase db reset` hoặc `db push`. |
| Đăng ký báo email invalid | Đổi `AUTH_PHONE_EMAIL_DOMAIN` sang domain hợp lệ cú pháp. |
| Đăng nhập sai dù đúng mật khẩu | `AUTH_IDENTIFIER_MODE`/domain khác giữa lúc tạo và lúc đăng nhập. |
| `new row violates row-level security` | User không phải thành viên nhóm, hoặc thao tác admin không đủ quyền. |
| Upload avatar lỗi | Kiểm tra bucket `avatars`/`group-avatars` và storage policies. |
| Realtime không cập nhật | Kiểm tra publication `supabase_realtime` và RLS của bảng. |
| App báo lỗi kết nối Supabase | Project Free bị pause, hoặc sai URL/key. |
| Turnstile luôn fail | Site key và secret key không cùng một widget/domain. |
| Không đăng nhập được trên preview Vercel | Thêm domain preview vào Supabase Redirect URLs hoặc dùng production domain. |
| Vercel báo `Environment variable "TZ" is invalid` / *name is reserved* | Vercel giữ tên `TZ` và chạy UTC. Bỏ biến đó đi; app đã tự áp `APP_TZ` (mặc định `Asia/Ho_Chi_Minh`) qua `src/instrumentation.ts`. |
| Ngày/giờ trên lịch lệch 7 tiếng khi deploy | Runtime thiếu timezone: kiểm tra `APP_TZ` và `src/instrumentation.ts`; xem log khởi động. |

---

## 9. Lệnh thường dùng

```bash
npm run dev            # chạy local
npm run build          # build production
npm run lint           # ESLint
npm run typecheck      # TypeScript
npm test               # unit tests
npm run test:rls       # SQL + RLS tests (PGlite)
npm run test:concurrency # invite/confirm race (cần Supabase chạy)
npm run db:start       # Supabase local
npm run db:reset       # reset + migrate + seed
npm run db:push        # đẩy migration lên cloud
npm run db:types       # sinh TypeScript types (sau khi có DB)
npm run seed:demo      # dữ liệu demo local
npm run admin:reset -- 0901234567 NewPassword123
```

---

## 10. Khác biệt so với PRD

| PRD | Bản triển khai | Lý do |
|---|---|---|
| Email/password | SĐT/password + email nội bộ không nhận thư | Không tốn phí SMS/email |
| Email notification | Chỉ in-app | 0 đồng, không cần Resend |
| OTP/verification | Không OTP; mã khôi phục | Không phát sinh phí SMS |
| Google/Zalo OAuth | P1 | Production cần domain riêng |
| Passkey | P1 | Supabase passkey còn beta |
| Cron nhắc lịch | Sinh lazily khi mở app | Không cần cron trả phí |
| Drizzle ORM | Supabase CLI migration + generated types | Một nguồn migration duy nhất |

Các phần còn lại của MVP P0 vẫn được triển khai: nhóm, invite, lịch rảnh, meetup,
bình chọn ngày/địa điểm, chốt kèo, RSVP, Host, hủy tham gia, thông báo in-app,
lịch sử, PWA, RLS và audit log.
