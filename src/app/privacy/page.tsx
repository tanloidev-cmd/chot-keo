import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Về Chốt Kèo
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Chính sách riêng tư</h1>
      <div className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          Chốt Kèo lưu số điện thoại của bạn để đăng nhập, tên hiển thị, ảnh đại
          diện và dữ liệu nhóm (lịch rảnh, kèo, bình chọn, RSVP).
        </p>
        <p>
          Số điện thoại không hiển thị cho các thành viên khác. Dữ liệu nhóm chỉ
          được đọc bởi thành viên đang hoạt động của nhóm đó.
        </p>
        <p>
          Ứng dụng không gửi email, không gửi SMS và không chia sẻ dữ liệu cho
          bên thứ ba ngoài hạ tầng Supabase/Vercel cần thiết để vận hành.
        </p>
        <p>
          Bạn có thể rời nhóm bất kỳ lúc nào. Owner có thể xóa nhóm; khi đó dữ
          liệu của nhóm sẽ bị xóa khỏi hệ thống.
        </p>
      </div>
    </div>
  );
}
