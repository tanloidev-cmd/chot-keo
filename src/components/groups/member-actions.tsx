"use client";

import { useTransition } from "react";
import {
  Crown,
  Loader2,
  MoreHorizontal,
  Shield,
  UserMinus,
  UserRound,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  removeMemberAction,
  setMemberRoleAction,
  transferOwnershipAction,
} from "@/lib/actions/groups";
import type { GroupRole } from "@/lib/types";

export function MemberActions({
  groupId,
  userId,
  role,
  actorRole,
  actorId,
}: {
  groupId: string;
  userId: string;
  role: GroupRole;
  actorRole: GroupRole;
  actorId: string;
}) {
  const [pending, startTransition] = useTransition();

  if (role === "owner" || userId === actorId) return null;
  if (actorRole === "member") return null;
  if (role === "admin" && actorRole !== "owner") return null;

  function run(
    action: () => Promise<{ error?: string; success?: string }>,
    success: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else toast.success(result.success ?? success);
    });
  }

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" disabled={pending} aria-label="Thao tác">
            {pending ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actorRole === "owner" ? (
            <>
              {role === "member" ? (
                <DropdownMenuItem
                  onClick={() =>
                    run(
                      () => setMemberRoleAction(groupId, userId, "admin"),
                      "Đã thăng Admin",
                    )
                  }
                >
                  <Shield />
                  Thăng làm Admin
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() =>
                    run(
                      () => setMemberRoleAction(groupId, userId, "member"),
                      "Đã hạ xuống Member",
                    )
                  }
                >
                  <UserRound />
                  Hạ xuống Member
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <AlertDialogTrigger className="w-full">
                  <Crown />
                  Chuyển quyền Owner
                </AlertDialogTrigger>
              </DropdownMenuItem>
            </>
          ) : null}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              run(
                () => removeMemberAction(groupId, userId),
                "Đã xóa thành viên",
              )
            }
          >
            <UserMinus />
            Xóa khỏi nhóm
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Chuyển quyền Owner?</AlertDialogTitle>
          <AlertDialogDescription>
            Thành viên này sẽ toàn quyền quản lý nhóm. Bạn sẽ trở thành Admin.
            Hành động này không thể hoàn tác nếu không được chuyển lại.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              run(
                () => transferOwnershipAction(groupId, userId),
                "Đã chuyển quyền Owner",
              )
            }
          >
            Chuyển quyền
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
