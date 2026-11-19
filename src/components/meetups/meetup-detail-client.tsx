"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  Clock,
  Loader2,
  Pencil,
  ShieldCheck,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { RsvpBadge } from "@/components/status-badge";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  acknowledgeCancellationAction,
  assignHostAction,
  confirmMeetupAction,
  publishMeetupAction,
  setMeetupStatusAction,
  setRsvpAction,
  unassignHostAction,
  voteTimeAction,
  voteVenueAction,
} from "@/lib/actions/meetups";
import { formatDateTimeInZone } from "@/lib/dates";
import type {
  CancellationRequest,
  GroupMember,
  HostAssignment,
  MeetupTimeOption,
  MeetupVenueOption,
} from "@/lib/types";

type TimeOptionView = MeetupTimeOption & {
  vote_count: number;
  my_vote: boolean;
  available: number;
  maybe: number;
  unavailable: number;
  unknown: number;
};

type VenueOptionView = MeetupVenueOption & {
  vote_count: number;
  my_vote: boolean;
};

export function VotePanel({
  meetupId,
  timezone,
  timeOptions,
  venueOptions,
  myTimeVoteId,
  myVenueVoteId,
  memberCount,
}: {
  meetupId: string;
  timezone: string;
  timeOptions: TimeOptionView[];
  venueOptions: VenueOptionView[];
  myTimeVoteId: string | null;
  myVenueVoteId: string | null;
  memberCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [selectedTime, setSelectedTime] = useState(myTimeVoteId ?? "");
  const [selectedVenue, setSelectedVenue] = useState(myVenueVoteId ?? "");

  function save() {
    startTransition(async () => {
      const timeResult = await voteTimeAction(
        meetupId,
        selectedTime || null,
      );
      if (timeResult.error) {
        toast.error(timeResult.error);
        return;
      }

      if (venueOptions.length > 0) {
        const venueResult = await voteVenueAction(
          meetupId,
          selectedVenue || null,
        );
        if (venueResult.error) {
          toast.error(venueResult.error);
          return;
        }
      }

      toast.success("Đã lưu bình chọn");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarCheck className="size-5 text-primary" />
          Bình chọn phương án
        </CardTitle>
        <CardDescription>
          Đây là bình chọn sở thích, chưa phải xác nhận tham gia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={selectedTime} onValueChange={setSelectedTime}>
          {timeOptions.map((option) => {
            const score = 2 * option.available + option.maybe - 2 * option.unavailable;
            return (
              <Label
                key={option.id}
                htmlFor={`time-${option.id}`}
                className={`flex cursor-pointer flex-col gap-2 rounded-xl border p-3 transition-colors ${
                  selectedTime === option.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem
                    id={`time-${option.id}`}
                    value={option.id}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {option.label ||
                        formatDateTimeInZone(option.starts_at, timezone)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTimeInZone(option.starts_at, timezone)} –{" "}
                      {new Intl.DateTimeFormat("vi-VN", {
                        timeZone: timezone,
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }).format(new Date(option.ends_at))}
                    </p>
                  </div>
                  <Badge variant="secondary">{option.vote_count} vote</Badge>
                </div>
                <div className="ml-7 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                    {option.available} rảnh
                  </span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                    {option.maybe} có thể
                  </span>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">
                    {option.unavailable} bận
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                    {Math.max(memberCount - option.available - option.maybe - option.unavailable, 0)}{" "}
                    chưa
                  </span>
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700">
                    Điểm {score}
                  </span>
                </div>
              </Label>
            );
          })}
        </RadioGroup>

        {venueOptions.length > 0 ? (
          <>
            <Separator />
            <div>
              <p className="mb-2 text-sm font-medium">Địa điểm</p>
              <RadioGroup value={selectedVenue} onValueChange={setSelectedVenue}>
                {venueOptions.map((option) => (
                  <Label
                    key={option.id}
                    htmlFor={`venue-${option.id}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                      selectedVenue === option.id ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <RadioGroupItem
                      id={`venue-${option.id}`}
                      value={option.id}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{option.name}</p>
                      {option.address ? (
                        <p className="text-xs text-muted-foreground">
                          {option.address}
                        </p>
                      ) : null}
                      {option.note ? (
                        <p className="text-xs text-muted-foreground">{option.note}</p>
                      ) : null}
                    </div>
                    <Badge variant="secondary">{option.vote_count} vote</Badge>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </>
        ) : null}

        <div className="flex gap-2">
          <Button onClick={save} disabled={pending || !selectedTime} className="flex-1">
            {pending ? <Loader2 className="animate-spin" /> : <Check />}
            Lưu bình chọn
          </Button>
          <Button
            variant="outline"
            disabled={pending || (!selectedTime && !selectedVenue)}
            onClick={() => {
              setSelectedTime("");
              setSelectedVenue("");
              startTransition(async () => {
                await voteTimeAction(meetupId, null);
                if (venueOptions.length > 0) {
                  await voteVenueAction(meetupId, null);
                }
                toast.success("Đã bỏ bình chọn");
              });
            }}
          >
            <X />
            Bỏ chọn
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConfirmMeetupDialog({
  meetupId,
  timeOptions,
  venueOptions,
}: {
  meetupId: string;
  timeOptions: TimeOptionView[];
  venueOptions: VenueOptionView[];
}) {
  const [open, setOpen] = useState(false);
  const [timeId, setTimeId] = useState(timeOptions[0]?.id ?? "");
  const [venueId, setVenueId] = useState("");
  const [pending, startTransition] = useTransition();

  function confirm() {
    if (!timeId) {
      toast.error("Chọn phương án thời gian");
      return;
    }
    startTransition(async () => {
      const result = await confirmMeetupAction(
        meetupId,
        timeId,
        venueId || null,
      );
      if (result.error) toast.error(result.error);
      else {
        toast.success("Đã chốt kèo");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ShieldCheck />
          Chốt kèo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chốt phương án cuối cùng</DialogTitle>
          <DialogDescription>
            Hành động này sẽ xác nhận kèo và mở RSVP cho cả nhóm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Thời gian</Label>
            <Select value={timeId} onValueChange={setTimeId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn phương án" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label || formatDateTimeInZone(option.starts_at)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {venueOptions.length > 0 ? (
            <div className="space-y-2">
              <Label>Địa điểm</Label>
              <Select value={venueId} onValueChange={setVenueId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn địa điểm (tùy chọn)" />
                </SelectTrigger>
                <SelectContent>
                  {venueOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <Button onClick={confirm} disabled={pending} className="w-full">
            {pending ? <Loader2 className="animate-spin" /> : <Check />}
            Xác nhận chốt kèo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RsvpPanel({
  meetupId,
  myStatus,
  counts,
  attendees,
}: {
  meetupId: string;
  myStatus: string | null;
  counts: { going: number; maybe: number; not_going: number; cancelled: number };
  attendees: { user_id: string; status: string; profile?: { display_name: string } | null }[];
}) {
  const [pending, startTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");

  function update(status: "going" | "maybe" | "not_going", reasonText?: string) {
    startTransition(async () => {
      const result = await setRsvpAction(
        meetupId,
        status,
        undefined,
        reasonText,
      );
      if (result.error) toast.error(result.error);
      else {
        toast.success("Đã cập nhật phản hồi");
        setCancelOpen(false);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Phản hồi tham gia</CardTitle>
        <CardDescription>
          Cập nhật để cả nhóm biết bạn có đi hay không.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-emerald-50 p-2.5">
            <p className="text-lg font-semibold text-emerald-700">{counts.going}</p>
            <p className="text-xs text-emerald-700">Sẽ đi</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-2.5">
            <p className="text-lg font-semibold text-amber-700">{counts.maybe}</p>
            <p className="text-xs text-amber-700">Có thể</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-2.5">
            <p className="text-lg font-semibold text-rose-700">
              {counts.cancelled + counts.not_going}
            </p>
            <p className="text-xs text-rose-700">Không đi</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Phản hồi của bạn</span>
          <RsvpBadge status={myStatus as any} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={myStatus === "going" ? "default" : "outline"}
            disabled={pending}
            onClick={() => update("going")}
          >
            Sẽ đi
          </Button>
          <Button
            variant={myStatus === "maybe" ? "default" : "outline"}
            disabled={pending}
            onClick={() => update("maybe")}
          >
            Có thể
          </Button>
          <Button
            variant={
              myStatus === "cancelled" || myStatus === "not_going"
                ? "destructive"
                : "outline"
            }
            disabled={pending}
            onClick={() => setCancelOpen(true)}
          >
            Không đi
          </Button>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">
            Danh sách phản hồi ({attendees.length})
          </p>
          <div className="space-y-1.5">
            {attendees.map((attendee) => (
              <div
                key={attendee.user_id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="truncate">
                  {attendee.profile?.display_name ?? "Thành viên"}
                </span>
                <RsvpBadge status={attendee.status as any} />
              </div>
            ))}
            {attendees.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có ai phản hồi.
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy tham gia</DialogTitle>
            <DialogDescription>
              Bạn vẫn có quyền không tham dự. Lý do là riêng tư, chỉ Host/Owner/Admin
              thấy.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Lý do (tùy chọn)</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ví dụ: bận việc gia đình"
              maxLength={500}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCancelOpen(false)}
            >
              Giữ phản hồi
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={pending}
              onClick={() => update("not_going", reason)}
            >
              {pending ? <Loader2 className="animate-spin" /> : null}
              Xác nhận không đi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function HostManager({
  meetupId,
  members,
  hosts,
  canManage,
}: {
  meetupId: string;
  members: GroupMember[];
  hosts: HostAssignment[];
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [pending, startTransition] = useTransition();

  function assign() {
    if (!userId) return;
    startTransition(async () => {
      const result = await assignHostAction(meetupId, userId);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Đã gán Host");
        setOpen(false);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Chủ xị</CardTitle>
          <CardDescription>Người phụ trách điều phối kèo.</CardDescription>
        </div>
        {canManage ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus />
                Gán
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gán Host</DialogTitle>
                <DialogDescription>
                  Host có thể theo dõi RSVP và xử lý yêu cầu hủy.
                </DialogDescription>
              </DialogHeader>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn thành viên" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.profile?.display_name ?? "Thành viên"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={assign} disabled={pending || !userId}>
                {pending ? <Loader2 className="animate-spin" /> : <Check />}
                Gán Host
              </Button>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        {hosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa gán Host.</p>
        ) : (
          <div className="space-y-2">
            {hosts.map((host) => (
              <div
                key={host.user_id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span>{host.profile?.display_name ?? "Thành viên"}</span>
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      startTransition(async () => {
                        const result = await unassignHostAction(
                          meetupId,
                          host.user_id,
                        );
                        if (result.error) toast.error(result.error);
                        else toast.success("Đã bỏ Host");
                      })
                    }
                    aria-label="Bỏ Host"
                  >
                    <UserMinus />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CancellationRequests({
  meetupId,
  requests,
  canManage,
  meetupTitle,
}: {
  meetupId: string;
  requests: CancellationRequest[];
  canManage: boolean;
  meetupTitle?: string;
}) {
  const [pending, startTransition] = useTransition();

  if (!canManage || requests.length === 0) return null;

  return (
    <Card className="border-rose-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="size-5 text-rose-600" />
          Yêu cầu hủy tham gia
        </CardTitle>
        <CardDescription>
          {meetupTitle ? `${meetupTitle} • ` : ""}
          Lý do riêng tư chỉ hiển thị cho Host/Owner/Admin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <div key={request.id} className="rounded-xl border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {request.profile?.display_name ?? "Thành viên"}
              </p>
              <Badge
                className={
                  request.status === "pending"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }
              >
                {request.status === "pending" ? "Chờ ghi nhận" : "Đã ghi nhận"}
              </Badge>
            </div>
            {request.reason ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Lý do: {request.reason}
              </p>
            ) : null}
            {request.status === "pending" ? (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await acknowledgeCancellationAction(
                      meetupId,
                      request.id,
                    );
                    if (result.error) toast.error(result.error);
                    else toast.success("Đã ghi nhận yêu cầu hủy");
                  })
                }
              >
                <Check />
                Ghi nhận
              </Button>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function MeetupManagerActions({
  meetupId,
  status,
  canManage,
}: {
  meetupId: string;
  status: string;
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (!canManage) return null;

  function change(next: "cancelled" | "completed" | "in_progress") {
    startTransition(async () => {
      const result = await setMeetupStatusAction(meetupId, next);
      if (result.error) toast.error(result.error);
      else toast.success("Đã cập nhật trạng thái");
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/meetups/${meetupId}/edit`}>
          <Pencil />
          Sửa kèo
        </Link>
      </Button>

      {status === "draft" ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await publishMeetupAction(meetupId);
              if (result.error) toast.error(result.error);
              else toast.success("Đã gửi đề xuất cho nhóm");
            })
          }
        >
          <Check />
          Gửi đề xuất
        </Button>
      ) : null}

      {status === "confirmed" ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => change("completed")}
        >
          <Check />
          Đánh dấu hoàn tất
        </Button>
      ) : null}

      {["draft", "proposed", "confirmed", "in_progress"].includes(status) ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <X />
              Hủy kèo
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hủy kèo này?</AlertDialogTitle>
              <AlertDialogDescription>
                Cả nhóm sẽ nhận thông báo. Kèo vẫn được lưu trong lịch sử.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Giữ kèo</AlertDialogCancel>
              <AlertDialogAction onClick={() => change("cancelled")}>
                Hủy kèo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}

export function CheckInBadge() {
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="size-3" />
      Giờ địa phương
    </Badge>
  );
}
