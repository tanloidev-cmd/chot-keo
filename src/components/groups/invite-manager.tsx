"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Copy,
  Link2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { SubmitButton } from "@/components/forms/submit-button";
import { ShareLinkButton } from "@/components/share-link-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createInviteAction,
  revokeInviteAction,
  type InviteState,
} from "@/lib/actions/groups";
import { format } from "date-fns";
import type { GroupInvite } from "@/lib/types";

const initialState: InviteState = {};

export function InviteManager({
  groupId,
  invites,
  canManage,
}: {
  groupId: string;
  invites: GroupInvite[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(createInviteAction, initialState);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    if (state.success || state.url) router.refresh();
  }, [router, state.success, state.url]);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Đã copy link mời");
    } catch {
      toast.error("Không copy được. Hãy chọn và copy thủ công.");
    }
  }

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Link mời</CardTitle>
          <CardDescription>
            Chỉ Owner/Admin mới có thể tạo và quản lý link mời.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="size-5 text-primary" />
            Tạo link mời
          </CardTitle>
          <CardDescription>
            Link chỉ hiển thị đầy đủ một lần. Có thể giới hạn lượt dùng và thời hạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="groupId" value={groupId} />

            {state.error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}

            {state.url ? (
              <Alert className="border-emerald-200 bg-emerald-50">
                <Check className="text-emerald-700" />
                <AlertDescription>
                  <p className="font-medium text-emerald-900">
                    Link mời đã tạo — copy ngay
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-2 py-2 text-xs">
                      {state.url}
                    </code>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      onClick={() => copy(state.url ?? "")}
                      aria-label="Copy link mời"
                    >
                      <Copy />
                    </Button>
                    <ShareLinkButton
                      path={state.url ?? ""}
                      title="Tham gia nhóm trên Chốt Kèo"
                      label="Chia sẻ"
                    />
                  </div>
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="invite-label">Nhãn (tùy chọn)</Label>
              <Input
                id="invite-label"
                name="label"
                placeholder="Ví dụ: Mời nhóm cấp 3"
                maxLength={80}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="maxUses">Giới hạn lượt</Label>
                <Input
                  id="maxUses"
                  name="maxUses"
                  type="number"
                  min={1}
                  placeholder="Không giới hạn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresDays">Hết hạn sau (ngày)</Label>
                <Input
                  id="expiresDays"
                  name="expiresDays"
                  type="number"
                  min={1}
                  placeholder="Không hết hạn"
                />
              </div>
            </div>

            <SubmitButton className="w-full">
              <Plus />
              Tạo link mời
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Link đã tạo</CardTitle>
          <CardDescription>
            Không thể xem lại token đầy đủ sau khi rời trang.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có link mời.</p>
          ) : (
            invites.map((invite) => {
              const revoked = Boolean(invite.revoked_at);
              const exhausted =
                invite.max_uses !== null && invite.uses_count >= invite.max_uses;
              const expired =
                invite.expires_at && new Date(invite.expires_at) < new Date();

              return (
                <div
                  key={invite.id}
                  className="flex items-center justify-between gap-2 rounded-xl border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {invite.label || "Link mời"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invite.uses_count}
                      {invite.max_uses ? `/${invite.max_uses}` : ""} lượt •{" "}
                      {invite.expires_at
                        ? `HH ${format(new Date(invite.expires_at), "dd/MM/yyyy")}`
                        : "Không hết hạn"}
                    </p>
                    <div className="mt-1">
                      {revoked ? (
                        <Badge className="bg-rose-100 text-rose-700">Đã thu hồi</Badge>
                      ) : exhausted ? (
                        <Badge className="bg-muted text-muted-foreground">Hết lượt</Badge>
                      ) : expired ? (
                        <Badge className="bg-muted text-muted-foreground">Hết hạn</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800">Đang hoạt động</Badge>
                      )}
                    </div>
                  </div>

                  {!revoked ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={revoking === invite.id}
                      onClick={() => {
                        setRevoking(invite.id);
                        revokeInviteAction(groupId, invite.id).then((result) => {
                          if (result.error) toast.error(result.error);
                          else {
                            toast.success("Đã thu hồi link");
                            router.refresh();
                          }
                          setRevoking(null);
                        });
                      }}
                      aria-label="Thu hồi link"
                    >
                      {revoking === invite.id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Trash2 />
                      )}
                    </Button>
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
