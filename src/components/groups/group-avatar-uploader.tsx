"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateGroupAvatarAction } from "@/lib/actions/groups";
import { initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

export function GroupAvatarUploader({
  groupId,
  groupName,
  avatarUrl,
}: {
  groupId: string;
  groupName: string;
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
      const path = `${groupId}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("group-avatars")
        .upload(path, file, { contentType: file.type, upsert: true });

      if (error) {
        toast.error("Không thể upload ảnh nhóm.");
        return;
      }

      const { data } = supabase.storage.from("group-avatars").getPublicUrl(path);
      const result = await updateGroupAvatarAction(groupId, data.publicUrl);

      if (result.error) toast.error(result.error);
      else {
        setPreview(data.publicUrl);
        toast.success("Đã cập nhật ảnh nhóm");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-14">
        {preview ? <AvatarImage src={preview} alt={groupName} /> : null}
        <AvatarFallback>{initials(groupName)}</AvatarFallback>
      </Avatar>
      <div>
        <Button asChild variant="outline" size="sm" disabled={pending}>
          <label htmlFor="group-avatar" className="cursor-pointer">
            {pending ? <Loader2 className="animate-spin" /> : <Camera />}
            Đổi ảnh nhóm
          </label>
        </Button>
        <Input
          id="group-avatar"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
