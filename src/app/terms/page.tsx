import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Về Chốt Kèo
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Điều khoản sử dụng</h1>
      <div className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          Chốt Kèo là công cụ hỗ trợ nhóm bạn điều phối lịch gặp. Ứng dụng không
          ép buộc bất kỳ ai tham gia và không thay thế quyết định cá nhân.
        </p>
        <p>
          Bạn chịu trách nhiệm bảo mật mật khẩu và mã khôi phục. Không chia sẻ
          tài khoản cho người khác.
        </p>
        <p>
          Dữ liệu do bạn nhập (lịch rảnh, lý do hủy) được dùng để điều phối trong
          nhóm. Lý do hủy chỉ Chủ nhóm, Trợ thủ của nhóm hoặc Chủ xị của kèo
          được xem.
        </p>
        <p>
          Dịch vụ được cung cấp “nguyên trạng”. Chúng tôi có thể thay đổi tính
          năng hoặc tạm dừng dịch vụ để bảo trì.
        </p>
      </div>
    </div>
  );
}
