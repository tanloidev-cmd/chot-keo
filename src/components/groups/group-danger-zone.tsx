"use client";

import { useTransition } from "react";
import Link from "next/link";
import { LogOut, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteGroupAction, leaveGroupAction } from "@/lib/actions/groups";

export function GroupDangerZone({
  groupId,
  isOwner,
}: {
  groupId: string;
  isOwner: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Card className="border-rose-200">
      <CardHeader>
        <CardTitle className="text-lg text-rose-700">Vùng nguy hiểm</CardTitle>
        <CardDescription>
          Các thao tác này ảnh hưởng đến toàn bộ thành viên.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isOwner ? (
          <>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/groups/${groupId}/members`}>
                <UserCog />
                Chuyển quyền Chủ nhóm trước khi rời nhóm
              </Link>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 />
                  Xóa nhóm vĩnh viễn
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa nhóm này?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Toàn bộ kèo, lịch rảnh, thành viên và đường dẫn mời sẽ bị xóa.
                    Không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Giữ nhóm</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await deleteGroupAction(groupId);
                        if (result?.error) toast.error(result.error);
                      });
                    }}
                  >
                    Xóa vĩnh viễn
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <LogOut />
                Rời nhóm
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Rời nhóm này?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn sẽ không còn thấy lịch, kèo và thành viên của nhóm. Có thể
                  tham gia lại nếu có đường dẫn mời hợp lệ.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Ở lại</AlertDialogCancel>
                <AlertDialogAction
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await leaveGroupAction(groupId);
                      if (result?.error) toast.error(result.error);
                    });
                  }}
                >
                  Rời nhóm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
