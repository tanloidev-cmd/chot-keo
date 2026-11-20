"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
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
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  createInviteAction,
  revokeInviteAction,
  type InviteState,
} from "@/lib/actions/groups";
import { useFieldForm } from "@/lib/forms/use-field-form";
import { format } from "date-fns";
import type { GroupInvite } from "@/lib/types";

const initialState: InviteState = {};
const FIELDS = ["label", "maxUses", "expiresDays"] as const;

type SavedLinks = Record<string, string>;

const EMPTY_LINKS: SavedLinks = {};
const savedLinksCache = new Map<string, SavedLinks>();
const savedLinksListeners = new Map<string, Set<() => void>>();

function readSavedLinks(key: string): SavedLinks {
  const cached = savedLinksCache.get(key);
  if (cached) return cached;
  if (typeof window === "undefined") return EMPTY_LINKS;

  let links: SavedLinks = EMPTY_LINKS;
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object") {
      links = Object.fromEntries(
        Object.entries(parsed).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      );
    }
  } catch {
    links = EMPTY_LINKS;
  }

  savedLinksCache.set(key, links);
  return links;
}

function writeSavedLinks(key: string, links: SavedLinks) {
  savedLinksCache.set(key, links);
  try {
    window.localStorage.setItem(key, JSON.stringify(links));
  } catch {
    // Storage can be unavailable (private mode/quota); the links still stay
    // available for this session.
  }
  savedLinksListeners.get(key)?.forEach((listener) => listener());
}

function subscribeSavedLinks(key: string, listener: () => void) {
  let listeners = savedLinksListeners.get(key);
  if (!listeners) {
    listeners = new Set();
    savedLinksListeners.set(key, listeners);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) savedLinksListeners.delete(key);
  };
}

function invalidateSavedLinks(key: string) {
  savedLinksCache.delete(key);
  savedLinksListeners.get(key)?.forEach((listener) => listener());
}

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
  const {
    state,
    fieldErrors,
    onSubmit,
    markEdited,
    formRef,
    errorId,
    pending: creating,
  } = useFieldForm({
    action: createInviteAction,
    initialState,
    id: "invite",
    fieldOrder: FIELDS,
  });
  const [revoking, setRevoking] = useState<string | null>(null);
  const storageKey = `chot-keo:invite-links:${groupId}`;
  const savedLinks = useSyncExternalStore(
    useCallback(
      (listener) => subscribeSavedLinks(storageKey, listener),
      [storageKey],
    ),
    useCallback(() => readSavedLinks(storageKey), [storageKey]),
    () => EMPTY_LINKS,
  );

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === storageKey) invalidateSavedLinks(storageKey);
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  useEffect(() => {
    if (!state.inviteId || !state.url) return;

    const current = readSavedLinks(storageKey);
    if (current[state.inviteId] === state.url) return;

    writeSavedLinks(storageKey, { ...current, [state.inviteId]: state.url });
  }, [state.inviteId, state.url, storageKey]);

  useEffect(() => {
    if (state.success || state.url) router.refresh();
  }, [router, state.success, state.url]);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Đã sao chép đường dẫn mời");
    } catch {
      toast.error("Không sao chép được. Hãy chọn và sao chép thủ công.");
    }
  }

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Đường dẫn mời</CardTitle>
          <CardDescription>
            Chỉ Chủ nhóm hoặc Trợ thủ mới có thể tạo và quản lý đường dẫn mời.
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
            Tạo đường dẫn mời
          </CardTitle>
          <CardDescription>
            Có thể giới hạn lượt dùng và thời hạn. Đường dẫn đầy đủ được lưu
            trên thiết bị này để sao chép lại khi cần.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-3">
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
                <AlertDescription className="min-w-0">
                  <p className="font-medium text-emerald-900">
                    Đường dẫn mời đã tạo — sao chép ngay
                  </p>
                  <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                    <code className="min-w-0 flex-1 rounded-lg bg-white px-2 py-2 text-xs break-all">
                      {state.url}
                    </code>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        onClick={() => copy(state.url ?? "")}
                        aria-label="Sao chép đường dẫn mời"
                      >
                        <Copy />
                      </Button>
                      <ShareLinkButton
                        path={state.url ?? ""}
                        title="Tham gia nhóm trên Chốt Kèo"
                        label="Chia sẻ"
                      />
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : null}

            <Field data-invalid={fieldErrors.label ? true : undefined}>
              <FieldLabel htmlFor="invite-label">Nhãn (tùy chọn)</FieldLabel>
              <Input
                id="invite-label"
                name="label"
                placeholder="Ví dụ: Mời nhóm cấp 3"
                maxLength={80}
                aria-invalid={fieldErrors.label ? true : undefined}
                aria-describedby={
                  fieldErrors.label ? errorId("label") : undefined
                }
                onChange={() => markEdited("label")}
              />
              <FieldError id={errorId("label")}>{fieldErrors.label}</FieldError>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={fieldErrors.maxUses ? true : undefined}>
                <FieldLabel htmlFor="maxUses">Giới hạn lượt</FieldLabel>
                <Input
                  id="maxUses"
                  name="maxUses"
                  type="number"
                  min={1}
                  placeholder="Không giới hạn"
                  aria-invalid={fieldErrors.maxUses ? true : undefined}
                  aria-describedby={
                    fieldErrors.maxUses ? errorId("maxUses") : undefined
                  }
                  onChange={() => markEdited("maxUses")}
                />
                <FieldError id={errorId("maxUses")}>
                  {fieldErrors.maxUses}
                </FieldError>
              </Field>
              <Field data-invalid={fieldErrors.expiresDays ? true : undefined}>
                <FieldLabel htmlFor="expiresDays">
                  Hết hạn sau (ngày)
                </FieldLabel>
                <Input
                  id="expiresDays"
                  name="expiresDays"
                  type="number"
                  min={1}
                  placeholder="Không hết hạn"
                  aria-invalid={fieldErrors.expiresDays ? true : undefined}
                  aria-describedby={
                    fieldErrors.expiresDays ? errorId("expiresDays") : undefined
                  }
                  onChange={() => markEdited("expiresDays")}
                />
                <FieldError id={errorId("expiresDays")}>
                  {fieldErrors.expiresDays}
                </FieldError>
              </Field>
            </div>

            <SubmitButton className="w-full" pending={creating}>
              <Plus />
              Tạo đường dẫn mời
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Đường dẫn đã tạo</CardTitle>
          <CardDescription>
            Đường dẫn đã tạo trên thiết bị này có thể sao chép lại. Trên thiết bị
            khác, hãy tạo đường dẫn mới nếu cần.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có đường dẫn mời.</p>
          ) : (
            invites.map((invite) => {
              const revoked = Boolean(invite.revoked_at);
              const exhausted =
                invite.max_uses !== null && invite.uses_count >= invite.max_uses;
              const expired =
                invite.expires_at && new Date(invite.expires_at) < new Date();
              const savedUrl = savedLinks[invite.id];

              return (
                <div
                  key={invite.id}
                  className="flex items-center justify-between gap-2 rounded-xl border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {invite.label || "Đường dẫn mời"}
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

                  <div className="flex shrink-0 items-center gap-1">
                    {!revoked && savedUrl ? (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => copy(savedUrl)}
                        aria-label="Sao chép đường dẫn mời"
                        title="Sao chép đường dẫn mời"
                      >
                        <Copy />
                        Sao chép
                      </Button>
                    ) : null}
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
                              const current = readSavedLinks(storageKey);
                              if (current[invite.id]) {
                                const next = { ...current };
                                delete next[invite.id];
                                writeSavedLinks(storageKey, next);
                              }
                              toast.success("Đã thu hồi đường dẫn");
                              router.refresh();
                            }
                            setRevoking(null);
                          });
                        }}
                        aria-label="Thu hồi đường dẫn"
                        title="Thu hồi đường dẫn"
                      >
                        {revoking === invite.id ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Trash2 />
                        )}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
