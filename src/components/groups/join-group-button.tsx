"use client";

import { useTransition } from "react";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { redeemInviteAction } from "@/lib/actions/groups";

export function JoinGroupButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      className="h-11 w-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await redeemInviteAction(token);
          if (result?.error) {
            toast.error(result.error);
            router.refresh();
          }
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
      Tham gia nhóm
    </Button>
  );
}

export function JoinLoginButtons({ next }: { next: string }) {
  return (
    <div className="space-y-2">
      <Button asChild className="h-11 w-full">
        <a href={`/login?next=${encodeURIComponent(next)}`}>
          <LogIn />
          Đăng nhập để tham gia
        </a>
      </Button>
      <Button asChild variant="outline" className="h-11 w-full">
        <a href={`/register?next=${encodeURIComponent(next)}`}>
          Tạo tài khoản mới
        </a>
      </Button>
    </div>
  );
}
