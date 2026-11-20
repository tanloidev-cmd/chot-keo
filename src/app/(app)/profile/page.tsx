import type { Metadata } from "next";
import { Bell, ShieldCheck, Smartphone } from "lucide-react";

import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { ProfileAvatarUploader } from "@/components/profile/profile-avatar-uploader";
import { ProfileForm } from "@/components/profile/profile-form";
import { RecoveryCodeCard } from "@/components/profile/recovery-code-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Hồ sơ" };

export default async function ProfilePage() {
  const { user, profile, phone } = await getCurrentProfile();

  if (!profile) {
    return (
      <div>
        <PageHeader title="Hồ sơ" />
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Không tìm thấy hồ sơ. Hãy đăng xuất và đăng nhập lại.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Hồ sơ & bảo mật"
        description="Quản lý tên, ảnh đại diện, mật khẩu và mã khôi phục."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ảnh đại diện</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileAvatarUploader
            userId={user.id}
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} phone={phone} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="size-5 text-primary" />
            Bảo mật tài khoản
          </CardTitle>
          <CardDescription>
            Không dùng email hay tin nhắn. Mọi thứ hoạt động bằng số điện thoại,
            mật khẩu và mã khôi phục.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <RecoveryCodeCard />
          <div className="border-t pt-4">
            <p className="mb-3 text-sm font-medium">Đổi mật khẩu</p>
            <ChangePasswordForm />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="size-5 text-primary" />
            Thông báo
          </CardTitle>
          <CardDescription>
            Thông báo trong ứng dụng luôn được bật. Không gửi email hay tin nhắn.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Bạn sẽ thấy thông báo khi có kèo mới, kèo được chốt, có người hủy tham
          gia, hoặc bạn được giao làm chủ xị.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="size-5 text-primary" />
            Cài như ứng dụng
          </CardTitle>
          <CardDescription>
            Trên Chrome/Safari, chọn “Thêm vào màn hình chính” để dùng như ứng
            dụng.
          </CardDescription>
        </CardHeader>
      </Card>

    </div>
  );
}
