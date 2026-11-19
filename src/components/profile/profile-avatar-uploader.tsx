"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateAvatarUrlAction } from "@/lib/auth/actions";
import { initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

export function ProfileAvatarUploader({
  userId,
  displayName,
  avatarUrl,
}: {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState(avatarUrl);

  function upload(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh tối đa 2MB");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Chỉ hỗ trợ PNG, JPG hoặc WebP");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type, upsert: true });

      if (error) {
        toast.error("Không thể upload ảnh. Kiểm tra Storage policy.");
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const result = await updateAvatarUrlAction(data.publicUrl);

      if (result.error) toast.error(result.error);
      else {
        setPreview(data.publicUrl);
        toast.success("Đã cập nhật ảnh đại diện");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        {preview ? <AvatarImage src={preview} alt={displayName} /> : null}
        <AvatarFallback className="text-lg">{initials(displayName)}</AvatarFallback>
      </Avatar>
      <div>
        <Button asChild variant="outline" size="sm" disabled={pending}>
          <label htmlFor="profile-avatar" className="cursor-pointer">
            {pending ? <Loader2 className="animate-spin" /> : <Camera />}
            Đổi ảnh
          </label>
        </Button>
        <Input
          id="profile-avatar"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
            event.target.value = "";
          }}
        />
        <p className="mt-1 text-xs text-muted-foreground">PNG/JPG/WebP, tối đa 2MB.</p>
      </div>
    </div>
  );
}
