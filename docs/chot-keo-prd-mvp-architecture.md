# Chốt Kèo --- Product Requirements Document & MVP Architecture

> **Trạng thái:** Bản đề xuất MVP\
> **Ngày:** 19/11/2026\
> **Tên sản phẩm:** Chốt Kèo (codename tạm thời)\
> **Định hướng:** Mobile-first Progressive Web App (PWA)

------------------------------------------------------------------------

## 1. Tổng quan sản phẩm

### 1.1. Vấn đề

Các nhóm bạn thường khó thống nhất lịch gặp mặt vì: - Mỗi người có lịch
rảnh khác nhau, đặc biệt vào cuối tuần. - Việc hỏi lịch, đề xuất ngày
giờ và địa điểm thường bị trôi trong nhóm chat. - Người đề xuất hoặc
đứng ra tổ chức phải tự tổng hợp câu trả lời. - Sau khi đã chốt, thành
viên có thể thay đổi kế hoạch nhưng nhóm không có quy trình rõ ràng để
cập nhật.

### 1.2. Giải pháp

Chốt Kèo là ứng dụng web giúp một nhóm bạn: 1. Khai báo lịch rảnh/bận
theo ngày hoặc khung giờ. 2. Nhìn thấy mức độ phù hợp của các ngày cuối
tuần. 3. Đề xuất một buổi gặp mặt và cho các thành viên bình chọn ngày
giờ, địa điểm. 4. Xác nhận tham gia (RSVP), phân công người chủ trì (chủ
xị). 5. Quản lý thay đổi kế hoạch, yêu cầu hủy tham gia và lịch sử các
buổi gặp.

Sản phẩm ưu tiên các buổi tụ họp cuối tuần, có thể mở rộng cho ăn uống,
cà phê, thể thao hoặc hoạt động khác. Không giới hạn sản phẩm ở việc
uống rượu/bia.

### 1.3. Nguyên tắc sản phẩm

-   **Ít thao tác:** Thành viên có thể cập nhật lịch rảnh và phản hồi
    lời mời nhanh trên điện thoại.
-   **Minh bạch:** Nhóm nhìn thấy ai rảnh, ai chưa phản hồi và phương án
    nào được ủng hộ.
-   **Không ép buộc:** Quy trình xác nhận/hủy nhằm hỗ trợ điều phối,
    không tước quyền quyết định tham gia của cá nhân.
-   **Group-scoped:** Lịch rảnh và dữ liệu meetup được quản lý riêng
    trong từng nhóm.
-   **Share-friendly:** Mọi lời mời có đường dẫn dễ chia sẻ qua Zalo
    hoặc các ứng dụng chat khác.
-   **Không phụ thuộc Zalo ở MVP:** Người dùng có thể dùng sản phẩm mà
    không cần đăng nhập hay đồng bộ tài khoản Zalo.

------------------------------------------------------------------------

## 2. Đối tượng và vai trò

### 2.1. Đối tượng sử dụng

-   Nhóm bạn thường gặp nhau vào cuối tuần.
-   Nhóm đồng nghiệp hoặc cộng đồng nhỏ có lịch sinh hoạt định kỳ.
-   Người thường đứng ra tổ chức và cần tổng hợp lịch của nhiều thành
    viên.

### 2.2. Vai trò

  -----------------------------------------------------------------------
  Vai trò                 Phạm vi                 Quyền và trách nhiệm
                                                  chính
  ----------------------- ----------------------- -----------------------
  Owner                   Nhóm                    Quản lý nhóm, thành
                                                  viên, cài đặt và quyền
                                                  quản trị

  Admin                   Nhóm                    Hỗ trợ quản lý thành
                                                  viên, lời mời và hoạt
                                                  động nhóm

  Member                  Nhóm                    Cập nhật lịch, đề xuất
                                                  meetup, bình chọn và
                                                  RSVP

  Host / Chủ xị           Một meetup cụ thể       Điều phối meetup, theo
                                                  dõi RSVP và hỗ trợ xử
                                                  lý thay đổi
  -----------------------------------------------------------------------

Host là vai trò được gán theo từng meetup, không phải vai trò cố định
của thành viên trong nhóm. Một thành viên có thể làm host ở meetup này
và là người tham gia bình thường ở meetup khác.

------------------------------------------------------------------------

## 3. Phạm vi sản phẩm

### 3.1. MVP --- P0

  -----------------------------------------------------------------------
  Nhóm chức năng                      Phạm vi
  ----------------------------------- -----------------------------------
  Tài khoản                           Đăng ký/đăng nhập bằng email và mật
                                      khẩu; hồ sơ cơ bản

  Nhóm                                Tạo nhóm, tham gia bằng invite
                                      link, quản lý thành viên

  Lịch rảnh                           Khai báo available / unavailable /
                                      maybe; xem lịch theo nhóm

  Đề xuất meetup                      Tạo meetup, mô tả, nhiều phương án
                                      ngày giờ

  Bình chọn                           Bình chọn phương án ngày giờ và địa
                                      điểm

  RSVP                                Going / Maybe / Not going

  Chốt meetup                         Xác nhận một phương án sau khi nhóm
                                      thống nhất

  Host                                Gán một hoặc nhiều người phụ trách
                                      meetup

  Hủy tham gia                        Gửi yêu cầu/thông báo hủy sau khi
                                      meetup đã xác nhận; có thể kèm lý
                                      do riêng tư

  Thông báo                           Thông báo trong ứng dụng và email
                                      cho sự kiện quan trọng

  Lịch sử                             Danh sách meetup sắp tới và meetup
                                      đã diễn ra

  Chia sẻ                             Chia sẻ invite link hoặc meetup
                                      link qua Zalo/chat
  -----------------------------------------------------------------------

Địa điểm trong MVP được nhập thủ công. Chưa cần tích hợp Google Maps
hoặc API khám phá địa điểm.

### 3.2. Giai đoạn sau --- P1

-   Đăng nhập bằng Zalo (sau khi xác minh điều kiện API, quyền và quy
    trình phê duyệt).
-   Web Push Notification.
-   Meetup định kỳ.
-   Gợi ý địa điểm và tích hợp bản đồ.
-   Quản lý chi phí/chia tiền.
-   Album ảnh sau meetup.
-   Thành tích hoặc ghi nhận đóng góp của thành viên.
-   Quy tắc luân phiên host.

### 3.3. Giai đoạn mở rộng --- P2

-   Đối tác địa điểm, đặt chỗ.
-   Meetup được tài trợ.
-   Gói premium cho nhóm hoặc cộng đồng.
-   Phân tích hoạt động dành cho nhóm/đối tác kinh doanh.

### 3.4. Ngoài phạm vi MVP

-   Đồng bộ hoặc đọc nội dung tin nhắn của nhóm Zalo.
-   Bot tự động tham gia và quản lý nhóm chat Zalo.
-   Tự động đặt bàn hoặc thanh toán.
-   Hệ thống chat riêng thay thế Zalo.
-   Microservices, Kubernetes, ECS/EKS, Redis hoặc message queue riêng.

------------------------------------------------------------------------

## 4. Luồng nghiệp vụ chính

### 4.1. Tạo nhóm và mời thành viên

1.  Người dùng đăng ký/đăng nhập.
2.  Người dùng tạo nhóm và trở thành Owner.
3.  Hệ thống tạo invite link có token ngẫu nhiên.
4.  Owner/Admin chia sẻ link qua Zalo hoặc ứng dụng chat.
5.  Người nhận mở link, đăng nhập/đăng ký và tham gia nhóm nếu lời mời
    còn hiệu lực.
6.  Thành viên xuất hiện trong danh sách nhóm.

Invite link cần hỗ trợ thời hạn, giới hạn số lượt sử dụng và khả năng
thu hồi.

### 4.2. Khai báo lịch rảnh

Mỗi thành viên khai báo trạng thái cho ngày hoặc khung giờ:

-   `available`: Có thể tham gia.
-   `unavailable`: Không thể tham gia.
-   `maybe`: Chưa chắc chắn.
-   `unknown`: Chưa khai báo.

Lịch rảnh phải thuộc một nhóm cụ thể. Một người có thể rảnh trong nhóm A
nhưng chưa khai báo hoặc có lịch khác trong nhóm B.

MVP nên cho phép: - Chọn nhanh trạng thái cho cả ngày. - Chọn khung giờ
nếu cần chi tiết hơn. - Cập nhật nhiều ngày liên tiếp. - Xem trạng thái
của các thành viên theo lịch nhóm.

### 4.3. Đề xuất và chốt meetup

1.  Thành viên tạo meetup ở trạng thái `draft`.
2.  Người tạo nhập tên, mô tả, loại hoạt động và các phương án ngày/giờ.
3.  Meetup chuyển sang `proposed`.
4.  Thành viên bình chọn các phương án ngày/giờ và địa điểm.
5.  Hệ thống tổng hợp số người available / maybe / unavailable và lượt
    bình chọn.
6.  Người có quyền chốt chọn phương án cuối cùng.
7.  Meetup chuyển sang `confirmed`; thành viên được yêu cầu RSVP.
8.  Host được gán cho meetup.

Không tự động chốt chỉ dựa trên điểm số. Việc chốt cần có hành động xác
nhận rõ ràng của người có quyền.

### 4.4. Hủy tham gia sau khi đã xác nhận

Cần phân biệt quyền tự quyết cá nhân và quy trình điều phối nhóm:

-   Trước khi meetup được xác nhận, thành viên có thể chọn không tham
    gia mà không cần xin phép.
-   Sau khi đã RSVP Going, thành viên có thể cập nhật không tham gia
    hoặc gửi cancellation request tùy chính sách nhóm.
-   Lý do hủy có thể được nhập và đặt ở chế độ riêng tư, chỉ
    Host/Owner/Admin được xem.
-   Host có thể ghi nhận/acknowledge yêu cầu để nhóm cập nhật số người
    và logistics.
-   Không được hiểu việc host không đồng ý là thành viên bị buộc phải
    tham gia. Không có trạng thái nghiệp vụ nào tước quyền không tham dự
    của người dùng.
-   Nếu có chi phí đã cam kết, việc xử lý khoản chi phí là quy trình
    riêng, không phải quyền ép buộc tham dự.

### 4.5. Vòng đời meetup

`draft → proposed → confirmed → in_progress → completed`

Meetup có thể chuyển sang `cancelled` từ các trạng thái phù hợp theo
quyền và quy tắc nghiệp vụ.

### 4.6. Trạng thái RSVP

-   `going`
-   `maybe`
-   `not_going`
-   `cancellation_pending`
-   `cancelled`
-   `waitlisted` (để dành cho trường hợp giới hạn chỗ ở giai đoạn sau)

------------------------------------------------------------------------

## 5. Quy tắc lịch rảnh và bình chọn

### 5.1. Không đồng nhất lịch rảnh với bình chọn

Hai dữ liệu này có mục đích khác nhau:

-   **Availability:** Thành viên có thể tham gia vào thời gian đó hay
    không.
-   **Vote/preference:** Thành viên muốn chọn phương án nào trong các
    phương án được đề xuất.

Một người có thể available ở nhiều ngày nhưng chỉ thích một ngày cụ thể.
Vì vậy không nên tự động chuyển availability thành vote.

### 5.2. Điểm tham khảo cho phương án ngày/giờ

Có thể dùng điểm tham khảo:

`Score(d,t) = 2A(d,t) + M(d,t) - 2U(d,t)`

Trong đó: - `A`: Số thành viên đánh dấu available. - `M`: Số thành viên
đánh dấu maybe. - `U`: Số thành viên đánh dấu unavailable.

Điểm này chỉ dùng để sắp xếp/gợi ý. UI vẫn phải hiển thị riêng số lượng
available, maybe, unavailable và unknown. Không dùng điểm này làm quyết
định tự động.

### 5.3. Quorum

Nên cấu hình ngưỡng tham gia tối thiểu hoặc tỷ lệ phản hồi theo nhóm.
MVP có thể chỉ hiển thị tổng số phản hồi và để người tạo/Owner/Admin
quyết định chốt; chưa cần cơ chế quorum phức tạp.

------------------------------------------------------------------------

## 6. Đề xuất UI/UX

### 6.1. Định hướng tổng thể

-   Mobile-first PWA, tối ưu cho màn hình điện thoại.
-   Có thể mở trực tiếp từ link được chia sẻ trong Zalo.
-   Giao diện thân thiện, vui vẻ, dễ sử dụng trong nhóm bạn; tránh cảm
    giác như phần mềm quản trị doanh nghiệp.
-   Các thao tác quan trọng (cập nhật lịch, bình chọn, RSVP) nên hoàn
    thành trong vài lần chạm.
-   Trạng thái phải có nhãn chữ và màu sắc, không chỉ dựa vào màu.
-   Responsive cho desktop nhưng không thiết kế desktop làm chuẩn trước.

### 6.2. Điều hướng chính

Đề xuất bottom navigation trên mobile gồm bốn mục:

1.  **Home** --- Tổng quan và meetup sắp tới.
2.  **Lịch** --- Lịch rảnh của tôi và lịch tổng hợp theo nhóm.
3.  **Meetup** --- Các meetup đang đề xuất, đã xác nhận và lịch sử.
4.  **Groups** --- Danh sách nhóm và quản lý nhóm.

Các màn hình phụ như thông báo, hồ sơ và cài đặt truy cập từ avatar/menu
hoặc từ trang nhóm.

### 6.3. Màn hình Home

Mục tiêu: giúp người dùng nhìn thấy ngay việc gì cần làm.

Thành phần đề xuất: - Header thương hiệu **Chốt Kèo** và avatar người
dùng. - Khối meetup sắp tới nổi bật: - Tên meetup. - Thời gian và địa
điểm đã chốt (nếu có). - Số người Going / Maybe / chưa phản hồi. - Nút
xem chi tiết và cập nhật RSVP. - Khối nhắc cập nhật lịch cuối tuần. -
Tóm tắt lịch rảnh của các nhóm. - Danh sách meetup đang chờ bình chọn
hoặc chờ phản hồi. - Nút hành động chính **"+ Tạo kèo mới"**.

Nếu người dùng chưa tham gia nhóm, Home nên hiển thị lời mời tạo nhóm
hoặc nhập invite link thay vì một màn hình trống.

### 6.4. Màn hình My Groups / Groups

-   Danh sách nhóm người dùng đang tham gia.
-   Mỗi nhóm hiển thị tên, ảnh đại diện, số thành viên và meetup tiếp
    theo.
-   Nút tạo nhóm.
-   Nút tham gia nhóm bằng invite link.
-   Có thể tìm kiếm nhóm nếu người dùng có nhiều nhóm.

### 6.5. Màn hình Group Detail

Đề xuất chia thành các tab hoặc section: - **Overview:** Thông tin nhóm,
meetup sắp tới, hoạt động gần đây. - **Calendar:** Lịch rảnh tổng hợp. -
**Meetups:** Meetup đang mở bình chọn, đã xác nhận và lịch sử. -
**Members:** Thành viên và vai trò. - **Settings:** Cài đặt nhóm, invite
link, quyền quản trị.

### 6.6. Màn hình Group Calendar

-   Mặc định hiển thị 4--6 cuối tuần tiếp theo.
-   Có thể chuyển giữa chế độ xem theo tháng và danh sách cuối tuần.
-   Mỗi ngày hiển thị trạng thái của từng thành viên hoặc tổng hợp số
    người:
    -   Available
    -   Maybe
    -   Unavailable
    -   Chưa phản hồi
-   Có thao tác cập nhật nhanh trạng thái cá nhân.
-   Cho phép chuyển sang xem chi tiết một ngày/khung giờ.
-   Có bộ lọc thành viên khi nhóm đông.

Trên điện thoại, ưu tiên dạng danh sách các cuối tuần hoặc các card theo
ngày; tránh nhồi một bảng lịch desktop quá nhiều cột vào màn hình nhỏ.

### 6.7. Màn hình Create Meetup

Form tạo meetup nên ngắn và chia thành các bước hợp lý:

1.  Tên meetup và mô tả.
2.  Loại hoạt động (ăn uống, cà phê, gặp mặt, thể thao, khác).
3.  Chọn một hoặc nhiều phương án ngày/giờ.
4.  Thêm địa điểm gợi ý (nhập thủ công ở MVP).
5.  Chọn cách bình chọn và thời hạn bình chọn nếu cần.
6.  Xem lại và gửi đề xuất.

Người tạo có thể lưu nháp trước khi gửi.

### 6.8. Màn hình Meetup Detail

Đây là màn hình trung tâm của một meetup, nên có: - Tên, mô tả và trạng
thái meetup. - Thời gian/địa điểm đã chốt hoặc các phương án đang bình
chọn. - Người tạo và Host. - Danh sách thành viên cùng RSVP. - Tóm tắt
lượt bình chọn. - Timeline hoạt động: đề xuất, bình chọn, xác nhận, thay
đổi. - Các hành động phù hợp với trạng thái: Vote, RSVP, Edit, Confirm,
Cancel, Request cancellation.

Các hành động quản trị chỉ hiển thị cho người có quyền tương ứng.

### 6.9. Màn hình Date Voting và Venue Voting

-   Hiển thị từng phương án thành card dễ so sánh.
-   Với ngày/giờ: số người available, maybe, unavailable và số vote.
-   Với địa điểm: tên, địa chỉ/mô tả ngắn và số vote.
-   Người dùng có thể thay đổi lựa chọn trước khi bình chọn kết thúc.
-   Làm rõ đây là bình chọn sở thích, không phải xác nhận chắc chắn tham
    gia.

### 6.10. Màn hình Cancellation Requests

-   Danh sách yêu cầu hủy đang chờ ghi nhận.
-   Hiển thị thành viên, meetup và thời điểm gửi.
-   Lý do riêng tư chỉ hiển thị với Host/Owner/Admin được phép.
-   Host có thể acknowledge để nhóm cập nhật việc điều phối.
-   Không có thao tác "ép tham gia" hoặc từ chối quyền không tham dự.

### 6.11. Host Dashboard

-   Các meetup mà người dùng đang làm Host.
-   Tổng số người Going / Maybe / chưa phản hồi.
-   Yêu cầu hủy cần xử lý về mặt điều phối.
-   Thông tin thời gian, địa điểm và ghi chú.
-   Hành động gửi nhắc nhở hoặc cập nhật thông tin meetup nếu được cấp
    quyền.

### 6.12. Các màn hình còn lại

  -----------------------------------------------------------------------
  Màn hình                            Nội dung
  ----------------------------------- -----------------------------------
  Landing                             Giới thiệu ngắn, lợi ích, CTA đăng
                                      ký/đăng nhập

  Login / Register                    Email, mật khẩu, xác thực và khôi
                                      phục tài khoản

  Onboarding                          Tạo nhóm đầu tiên hoặc tham gia
                                      bằng invite link

  Group Members                       Danh sách thành viên, vai trò,
                                      trạng thái tham gia

  Group Settings                      Tên/ảnh nhóm, quyền, invite link,
                                      quy tắc nhóm

  Profile                             Tên hiển thị, avatar, timezone, tùy
                                      chọn thông báo

  Notifications                       Thông báo mới, đã đọc và điều hướng
                                      tới meetup liên quan
  -----------------------------------------------------------------------

### 6.13. UI states cần thiết

Mỗi màn hình cần thiết kế đầy đủ: - Loading/skeleton. - Empty state. -
Error state và nút thử lại. - Permission denied. - Invite link hết
hạn/đã thu hồi/đã hết lượt. - Offline hoặc kết nối chập chờn. - Form
validation. - Success feedback sau thao tác.

------------------------------------------------------------------------

## 7. Kiến trúc MVP

### 7.1. Quyết định kiến trúc

Chọn kiến trúc managed/serverless để giảm tối đa công việc vận hành:

-   **Frontend và application layer:** Next.js trên Vercel.
-   **Database:** Supabase PostgreSQL.
-   **Authentication:** Supabase Auth.
-   **Realtime:** Supabase Realtime.
-   **File storage:** Supabase Storage.
-   **ORM/migrations:** Drizzle ORM.
-   **Email:** Resend.
-   **Monitoring:** Sentry.

Không triển khai EC2, ECS, EKS, Docker host, Redis, message queue hoặc
WebSocket server riêng trong MVP.

### 7.2. Sơ đồ thành phần

``` text
                         ┌─────────────────────────┐
                         │       End Users         │
                         │ Mobile Browser / PWA    │
                         │ Desktop Browser         │
                         └────────────┬────────────┘
                                      │ HTTPS
                                      ▼
                         ┌─────────────────────────┐
                         │       Vercel CDN        │
                         │      Next.js App        │
                         │ App Router / UI         │
                         └────────────┬────────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     │                                 │
                     ▼                                 ▼
          ┌─────────────────────┐          ┌─────────────────────┐
          │ Server Actions /    │          │ Supabase Auth       │
          │ Route Handlers      │◄────────►│ Session / JWT       │
          │ Business Logic      │          └─────────────────────┘
          └──────────┬──────────┘
                     │
          ┌──────────┼──────────────────────────┐
          │          │                          │
          ▼          ▼                          ▼
┌────────────────┐ ┌────────────────┐  ┌──────────────────────┐
│ Supabase       │ │ Supabase       │  │ Supabase Storage     │
│ PostgreSQL     │ │ Realtime       │  │ Group / User Assets  │
│ Drizzle ORM    │ │ Live Updates   │  └──────────────────────┘
└────────────────┘ └────────────────┘
          │
          ▼
┌───────────────────────────────┐
│ Vercel Cron / Scheduled Jobs  │
│ Reminder & Notification Tasks │
└───────────────┬───────────────┘
                │
                ▼
       ┌─────────────────┐
       │ Resend Email    │
       └─────────────────┘

External sharing: invite/meetup URLs → Zalo or other chat apps
```

### 7.3. Công nghệ đề xuất

  -----------------------------------------------------------------------
  Layer                   Công nghệ               Mục đích
  ----------------------- ----------------------- -----------------------
  Web framework           Next.js App Router +    UI, routing,
                          TypeScript              server-side logic

  Styling                 Tailwind CSS +          Responsive UI
                          shadcn/ui               components

  Form                    React Hook Form + Zod   Form state và
                                                  validation

  Database                Supabase PostgreSQL     Dữ liệu quan hệ

  ORM                     Drizzle ORM             Typed queries và
                                                  migrations

  Auth                    Supabase Auth +         Đăng nhập và session
                          `@supabase/ssr`         

  Realtime                Supabase Realtime       Cập nhật RSVP/vote/lịch

  Storage                 Supabase Storage        Avatar và ảnh nhóm

  Hosting                 Vercel                  Deploy, CDN, Functions,
                                                  Cron

  Email                   Resend                  Email thông báo

  Monitoring              Sentry                  Error tracking
  -----------------------------------------------------------------------

### 7.4. Region

-   Supabase project: Singapore (`ap-southeast-1`).
-   Vercel Functions: ưu tiên Singapore (`sin1`) nếu cấu hình/plan hiện
    tại hỗ trợ.
-   Giữ application và database gần nhau để giảm network latency.

Cần kiểm tra lại region availability và giới hạn theo gói dịch vụ tại
thời điểm tạo project.

### 7.5. Authentication và session

-   Dùng Supabase Auth với email/password ở MVP.
-   Tích hợp Next.js SSR qua `@supabase/ssr`.
-   Session được quản lý bằng cookie theo hướng dẫn chính thức của
    Supabase.
-   Mọi thao tác nhạy cảm phải xác thực người dùng ở server.
-   Không tin dữ liệu role/user ID do client tự gửi nếu chưa xác minh.

### 7.6. Database access

-   Drizzle ORM dùng cho typed SQL và migration.
-   Supabase client dùng cho Auth và Realtime.
-   Server-side business logic phải kiểm tra quyền trước khi ghi dữ
    liệu.
-   Dùng Supabase connection pooler phù hợp với môi trường serverless.
-   Tránh mở kết nối PostgreSQL trực tiếp mới cho từng request.

### 7.7. Realtime

Dùng Supabase Realtime cho: - Thay đổi lịch rảnh. - Bình chọn ngày/giờ
và địa điểm. - RSVP. - Trạng thái meetup. - Thông báo trong ứng dụng.

MVP có thể bắt đầu bằng Postgres Changes, subscribe theo group/meetup cụ
thể. Không subscribe toàn bộ bảng hoặc dữ liệu của mọi nhóm.

Khi số lượng subscriber tăng lớn, đánh giá Broadcast và mô hình phân
phối khác. Postgres Changes phải kiểm tra quyền theo từng subscriber nên
có thể trở thành nút thắt ở quy mô lớn.

### 7.8. Notification

Nguyên tắc: ghi notification vào database trước, sau đó mới gửi email
hoặc push.

Các sự kiện nên thông báo: - Có meetup mới được đề xuất. - Meetup được
xác nhận hoặc thay đổi. - Có yêu cầu hủy tham gia. - Có người được gán
làm Host. - Nhắc trước meetup (ví dụ 24 giờ và 2 giờ, có thể cấu hình).

Vercel Cron chỉ đóng vai trò kích hoạt job định kỳ, không phải durable
queue. Job phải idempotent, có trạng thái xử lý và có thể chạy lại an
toàn.

### 7.9. Zalo integration

MVP: - Chia sẻ invite link và meetup link qua Zalo. - Không yêu cầu Zalo
OAuth. - Không đọc hoặc đồng bộ nội dung nhóm chat.

Sau MVP: - Nghiên cứu Zalo Social API OAuth 2.0 và quy trình đăng
ký/duyệt ứng dụng. - Không mặc định Supabase Auth có sẵn provider Zalo;
có thể cần custom OAuth flow. - Xác minh chính xác scope, quyền truy
cập, điều kiện ứng dụng và chính sách hiện hành trước khi triển khai. -
Không giả định Zalo cung cấp API để đọc tin nhắn hoặc đồng bộ thành viên
của nhóm chat cá nhân.

------------------------------------------------------------------------

## 8. Thiết kế dữ liệu --- mức domain

### 8.1. Identity và Groups

-   `profiles`
-   `groups`
-   `group_members`
-   `group_invites`
-   `group_join_requests` (nếu dùng quy trình duyệt tham gia)

### 8.2. Availability

-   `availability_entries`
-   `availability_defaults` (để dành cho quy tắc lặp lại)

### 8.3. Meetup

-   `meetups`
-   `meetup_time_options`
-   `meetup_votes`
-   `meetup_attendees`
-   `cancellation_requests`
-   `host_assignments`

### 8.4. Venues

-   `venues`
-   `meetup_venue_options`
-   `venue_votes`

### 8.5. Engagement và operations

-   `notifications`
-   `meetup_reviews`
-   `meetup_expenses` (P1)
-   `audit_logs`

### 8.6. Ràng buộc dữ liệu quan trọng

-   `group_members`: unique `(group_id, user_id)`.
-   `meetup_attendees`: unique `(meetup_id, user_id)`.
-   `meetup_votes`: unique `(meetup_id, time_option_id, user_id)` hoặc
    thiết kế tương đương theo loại vote.
-   `starts_at < ends_at`.
-   Host phải là thành viên active của đúng group.
-   Venue option phải thuộc đúng group/meetup.
-   Invite usage limit phải được kiểm tra transactionally để tránh vượt
    giới hạn khi có request đồng thời.
-   Dùng `timestamptz` cho thời điểm thực tế; lưu timezone IANA của
    nhóm/người dùng khi cần hiển thị lịch địa phương.
-   Các ngày lịch rảnh theo ngày địa phương cần được mô hình hóa rõ,
    tránh sai lệch do UTC conversion.

------------------------------------------------------------------------

## 9. Bảo mật và phân quyền

### 9.1. RLS

Bật Row Level Security trên tất cả bảng được expose qua Supabase API.

Nguyên tắc policy: - Chỉ thành viên active của nhóm mới được đọc dữ liệu
nhóm. - Người dùng chỉ được sửa availability của chính mình. - Thành
viên chỉ được sửa RSVP của chính mình, trừ các thao tác quản trị được
định nghĩa rõ. - Chỉ người có quyền mới được sửa group settings hoặc
quản lý thành viên. - Chỉ người được phép mới được chốt meetup hoặc gán
Host. - Lý do cancellation riêng tư chỉ được đọc bởi người gửi và vai
trò được phép. - Storage cũng cần policy theo group/user.

### 9.2. Helper functions cho RLS

Nếu policy cần kiểm tra membership/role, tránh tạo policy đệ quy khi
policy trên `group_members` lại truy vấn chính bảng đó.

Có thể dùng helper function an toàn với `SECURITY DEFINER` trong schema
không expose: - Đặt `search_path` cố định. - Chỉ cấp quyền execute cần
thiết. - Không cho client tùy ý gọi các hàm có thể vượt quyền. - Review
kỹ quyền owner của function và các bảng được function truy cập.

### 9.3. Secrets

-   Publishable/anon key có thể xuất hiện ở client theo thiết kế
    Supabase.
-   Secret/service-role key chỉ được dùng server-side.
-   Service-role key bypass RLS, tuyệt đối không dùng cho các request
    người dùng thông thường.
-   Không commit secret vào Git hoặc đưa vào bundle frontend.

### 9.4. Kiểm thử bảo mật

Tối thiểu cần kiểm tra: - User A không đọc được availability của group
mà họ không tham gia. - User A không sửa RSVP của User B. - Member không
tự gán mình làm Host nếu không có quyền. - Invite đã thu hồi/hết hạn
không thể dùng. - Invite có giới hạn lượt không bị vượt khi có request
đồng thời. - Người không có quyền không đọc được cancellation reason
riêng tư. - Không thể chốt đồng thời hai phương án mâu thuẫn. - Secret
key không xuất hiện trong browser bundle hoặc client logs.

------------------------------------------------------------------------

## 10. Deployment và môi trường

### 10.1. Môi trường

Tối thiểu: - Local development. - Staging. - Production.

Nên dùng Supabase project riêng cho staging và production. Không dùng
database production cho Vercel Preview deployments.

### 10.2. Luồng CI/CD

``` text
Developer
   │
   ▼
GitHub Pull Request
   │
   ▼
Lint → Typecheck → Unit Tests → RLS Tests
   │
   ▼
Migration Validation → Build → E2E
   │
   ▼
Vercel Preview + Staging Supabase
   │
   ▼
Review / Approval
   │
   ▼
Merge to main
   │
   ▼
Vercel Production + Production Supabase
   │
   ▼
Smoke Tests
```

### 10.3. Environment variables

  ----------------------------------------------------------------------------------------
  Variable                                 Scope                   Mục đích
  ---------------------------------------- ----------------------- -----------------------
  `NEXT_PUBLIC_SUPABASE_URL`               Client/Server           Supabase project URL

  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`   Client/Server           Publishable key

  `SUPABASE_SECRET_KEY`                    Server only             Privileged server
                                                                   operations khi thật sự
                                                                   cần

  `DATABASE_URL`                           Server only             PostgreSQL
                                                                   connection/pooler

  `RESEND_API_KEY`                         Server only             Gửi email

  `CRON_SECRET`                            Server only             Bảo vệ cron endpoint

  `NEXT_PUBLIC_APP_URL`                    Client/Server           URL ứng dụng
  ----------------------------------------------------------------------------------------

Tên biến cần được thống nhất với phiên bản Supabase key đang sử dụng.
Không expose secret key.

### 10.4. Migration policy

-   Migration được commit vào Git.
-   Không sửa schema production thủ công mà không có migration tương
    ứng.
-   CI kiểm tra migration trên staging/test database.
-   Backup trước các thay đổi schema có rủi ro.
-   Có kế hoạch rollback hoặc forward-fix cho từng migration.

------------------------------------------------------------------------

## 11. Chi phí vận hành sơ bộ

Các con số dưới đây là mốc tham khảo từ mức giá được xem xét trong quá
trình lập kế hoạch; cần xác minh lại pricing, quota, thuế và usage thực
tế trước khi triển khai.

  ------------------------------------------------------------------------
  Dịch vụ                              Mốc tham khảo Ghi chú
  --------------------- ---------------------------- ---------------------
  Vercel Pro                     khoảng USD 20/tháng Có usage credit theo
                                                     gói; Hobby không phù
                                                     hợp cho commercial
                                                     use

  Supabase Pro                   khoảng USD 25/tháng Database, Auth,
                                                     Realtime, Storage
                                                     theo quota gói

  Resend                           Free tier ban đầu Tùy giới hạn gửi
                                                     email

  Sentry                           Free tier ban đầu Tùy volume event

  Domain                     Phụ thuộc TLD/registrar Chi phí riêng
  ------------------------------------------------------------------------

**Baseline production MVP:** khoảng **USD 45/tháng** cho Vercel Pro +
Supabase Pro, chưa tính domain, thuế, overage hoặc các dịch vụ phát
sinh.

Prototype cá nhân có thể thử trên free tiers, nhưng cần lưu ý: -
Supabase Free có giới hạn tài nguyên và project có thể bị pause sau một
thời gian không hoạt động. - Free tier không thay thế chiến lược backup
production. - Supabase database backup không đồng nghĩa với backup đầy
đủ các file trong Storage; cần chiến lược backup object riêng nếu dữ
liệu ảnh quan trọng.

------------------------------------------------------------------------

## 12. Kế hoạch triển khai

Ước lượng cho một developer, có thể thay đổi theo mức hoàn thiện UI và
phạm vi kiểm thử.

  ------------------------------------------------------------------------
  Milestone             Phạm vi                                  Ước lượng
  --------------------- --------------------- ----------------------------
  M1 --- Foundation     Next.js, Supabase                        3--5 ngày
                        projects, Auth,       
                        profiles, groups,     
                        members, invites,     
                        migrations, RLS,      
                        tests, Vercel         

  M2 --- Availability   Calendar,                                3--5 ngày
                        availability CRUD,    
                        group aggregation,    
                        responsive UI,        
                        realtime              

  M3 --- Meetup         Create/propose,                          4--6 ngày
                        time/venue voting,    
                        RSVP, confirmation,   
                        Host, cancellation    

  M4 --- Operations     Notifications, email,                    3--5 ngày
                        cron reminders,       
                        history, audit basics 

  M5 --- Quality &      E2E, security tests,                     3--5 ngày
  Launch                accessibility,        
                        performance,          
                        production readiness  
  ------------------------------------------------------------------------

**Tổng ước lượng:** khoảng **16--26 ngày công** cho MVP, chưa tính các
thay đổi lớn về scope.

------------------------------------------------------------------------

## 13. Tiêu chí nghiệm thu MVP

### 13.1. Functional acceptance

-   Người dùng đăng ký/đăng nhập và cập nhật profile.
-   Người dùng tạo nhóm và mời người khác bằng link.
-   Invite link hết hạn/thu hồi/đạt giới hạn không thể tiếp tục sử dụng.
-   Thành viên cập nhật availability theo nhóm.
-   Thành viên xem được tổng hợp lịch rảnh của nhóm.
-   Thành viên tạo meetup với nhiều phương án ngày/giờ.
-   Thành viên bình chọn ngày/giờ và địa điểm.
-   Người có quyền chốt một phương án.
-   Thành viên cập nhật RSVP.
-   Host được gán và xem danh sách người tham gia.
-   Thành viên có thể thông báo/yêu cầu hủy sau khi xác nhận.
-   Cancellation reason riêng tư được bảo vệ đúng quyền.
-   Các thay đổi quan trọng được cập nhật realtime.
-   Notification không bị gửi trùng khi cron/job chạy lại.
-   Meetup đã hoàn tất/hủy được lưu trong lịch sử.
-   UI hoạt động tốt trên mobile browser và có thể cài như PWA.

### 13.2. Non-functional acceptance

-   Không có cross-group data leakage.
-   Các thao tác nhạy cảm được authorize ở server và/hoặc RLS.
-   Không lộ secret/service-role key ở client.
-   Các API ghi dữ liệu quan trọng có validation và xử lý race
    condition.
-   Có logging/error tracking cho lỗi production.
-   Có backup database và quy trình khôi phục được kiểm tra.
-   Có trạng thái loading, empty, error và permission denied phù hợp.

------------------------------------------------------------------------

## 14. Rủi ro và quyết định cần xác minh

  -----------------------------------------------------------------------
  Vấn đề                  Rủi ro                  Hướng xử lý
  ----------------------- ----------------------- -----------------------
  Zalo OAuth              Điều kiện ứng dụng,     Không đưa vào MVP; xác
                          scope và approval có    minh bằng tài liệu
                          thể thay đổi            chính thức trước P1

  Zalo group sync         Không được mặc định có  Chỉ hỗ trợ chia sẻ link
                          API đọc chat/thành viên ở MVP

  RLS phức tạp            Policy đệ quy hoặc cấu  Thiết kế helper an
                          hình sai gây lộ dữ liệu toàn, test allow/deny

  Serverless DB           Quá nhiều connection từ Dùng pooler và giới hạn
  connections             function                connection

  Realtime scale          Postgres Changes có chi Subscribe theo phạm vi
                          phí authorization theo  nhỏ; đánh giá Broadcast
                          subscriber              khi tăng tải

  Cron reliability        Cron không phải durable Idempotency, trạng thái
                          queue                   xử lý, retry an toàn

  Timezone                Lịch cuối tuần hiển thị Lưu timezone IANA và
                          sai ngày/giờ            phân biệt date-local
                                                  với timestamp

  Storage backup          DB backup không bao gồm Xây dựng backup riêng
                          toàn bộ object storage  khi ảnh/file trở nên
                                                  quan trọng
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 15. Các quyết định đã thống nhất cho MVP

1.  Xây dựng **Next.js + Vercel + Supabase**.
2.  Chọn Supabase Singapore làm region database.
3.  Làm PWA mobile-first.
4.  Không tự vận hành EC2/ECS/EKS/Docker/Redis/queue ở giai đoạn đầu.
5.  Dùng email/password trước; Zalo OAuth để sau.
6.  MVP chỉ chia sẻ link qua Zalo, không đồng bộ nhóm chat.
7.  Địa điểm nhập thủ công trước, chưa tích hợp Maps API.
8.  Lịch rảnh và bình chọn là hai loại dữ liệu riêng.
9.  Host là vai trò theo từng meetup.
10. Không dùng quy trình cancellation để ép buộc thành viên phải tham
    dự.
11. Hoàn thiện schema, RLS và kiểm thử bảo mật trước khi mở rộng UI.

------------------------------------------------------------------------

## 16. Bước triển khai tiếp theo

Milestone tiếp theo nên là **M1 --- Foundation**, theo thứ tự:

1.  Chốt schema PostgreSQL chi tiết và enum/check constraints.
2.  Viết migrations bằng Drizzle.
3.  Thiết kế RLS policies và helper functions an toàn.
4.  Viết test cho các trường hợp allow/deny và race condition quan
    trọng.
5.  Tạo cấu trúc Next.js App Router, Supabase SSR clients và auth flow.
6.  Dựng các layout UI nền tảng: Landing, Auth, Home shell, Groups
    shell.
7.  Kết nối Vercel Preview với Supabase staging.
8.  Chỉ sau khi nền tảng và phân quyền đạt yêu cầu mới triển khai sâu
    các màn hình nghiệp vụ.

------------------------------------------------------------------------

## 17. Tài liệu tham khảo chính thức

Các tài liệu cần dùng làm nguồn chuẩn khi triển khai và cần kiểm tra lại
phiên bản mới nhất:

-   Vercel Pricing: https://vercel.com/pricing
-   Vercel Functions: https://vercel.com/docs/functions
-   Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
-   Supabase Pricing: https://supabase.com/pricing
-   Supabase Next.js Auth:
    https://supabase.com/docs/guides/auth/server-side/nextjs
-   Supabase Row Level Security:
    https://supabase.com/docs/guides/database/postgres/row-level-security
-   Supabase Realtime: https://supabase.com/docs/guides/realtime
-   Supabase Storage: https://supabase.com/docs/guides/storage
-   Supabase Database Connections:
    https://supabase.com/docs/guides/database/connecting-to-postgres
-   Zalo Developers: https://developers.zalo.me/

> Đây là PRD và kiến trúc đề xuất ở mức MVP. Các quyết định về pricing,
> quota, API eligibility và giới hạn nền tảng là thông tin có thể thay
> đổi; cần xác minh lại trên tài liệu chính thức trước khi go-live.
