import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, UsersRound } from "lucide-react";

import {
  JoinGroupButton,
  JoinLoginButtons,
} from "@/components/groups/join-group-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hashInviteToken } from "@/lib/auth/recovery";
import { getCurrentUser } from "@/lib/auth/session";
import { initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tham gia nhóm" };

type Preview = {
  valid: boolean;
  group_id?: string;
  group_name?: string;
  group_avatar_url?: string | null;
  member_count?: number;
  label?: string | null;
};

export default async function JoinPage(props: PageProps<"/join/[token]">) {
  const { token } = await props.params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("preview_group_invite", {
    p_token_hash: hashInviteToken(token),
  });

  const preview = (data ?? { valid: false }) as Preview;
  const user = await getCurrentUser();
  const next = `/join/${token}`;

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-orange-50 via-background to-background">
      <header className="mx-auto flex h-16 w-full max-w-md items-center px-5">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icons/logo.png"
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0"
            priority
          />
          <span className="text-lg font-semibold">Chốt Kèo</span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-5 pb-10">
        <Card className="w-full">
          {!preview.valid ? (
            <>
              <CardHeader>
                <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <AlertTriangle />
                </div>
                <CardTitle>Link mời không hợp lệ</CardTitle>
                <CardDescription>
                  Link đã hết hạn, bị thu hồi hoặc đã hết lượt. Hãy xin link mới
                  từ Owner/Admin của nhóm.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Về trang chủ</Link>
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="mb-3 flex items-center gap-3">
                  <Avatar className="size-14">
                    {preview.group_avatar_url ? (
                      <AvatarImage
                        src={preview.group_avatar_url}
                        alt={preview.group_name ?? "Nhóm"}
                      />
                    ) : null}
                    <AvatarFallback className="text-lg">
                      {initials(preview.group_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{preview.group_name}</CardTitle>
                    <CardDescription className="mt-1 inline-flex items-center gap-1">
                      <UsersRound className="size-3.5" />
                      {preview.member_count ?? 0} thành viên
                    </CardDescription>
                  </div>
                </div>
                <CardDescription>
                  {preview.label
                    ? `Lời mời: ${preview.label}`
                    : "Bạn được mời tham gia nhóm này trên Chốt Kèo."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user ? (
                  <JoinGroupButton token={token} />
                ) : (
                  <JoinLoginButtons next={next} />
                )}
              </CardContent>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
