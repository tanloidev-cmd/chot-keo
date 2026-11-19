"use client";

import { useActionState, useState, useTransition } from "react";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addTimeOptionAction,
  addVenueOptionAction,
  removeTimeOptionAction,
  removeVenueOptionAction,
  updateMeetupAction,
  type MeetupState,
} from "@/lib/actions/meetups";
import { formatDateTimeInZone } from "@/lib/dates";
import type {
  ActivityType,
  Meetup,
  MeetupTimeOption,
  MeetupVenueOption,
} from "@/lib/types";

const initialState: MeetupState = {};

function toLocalInput(value: string) {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EditMeetupForm({
  meetup,
  timeOptions,
  venueOptions,
}: {
  meetup: Meetup;
  timeOptions: MeetupTimeOption[];
  venueOptions: MeetupVenueOption[];
}) {
  const [state, formAction] = useActionState(updateMeetupAction, initialState);
  const [pending, startTransition] = useTransition();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [label, setLabel] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueNote, setVenueNote] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>(
    meetup.activity_type as ActivityType,
  );

  function addTime() {
    if (!start || !end) {
      toast.error("Chọn thời gian bắt đầu và kết thúc");
      return;
    }
    startTransition(async () => {
      const result = await addTimeOptionAction(
        meetup.id,
        new Date(start).toISOString(),
        new Date(end).toISOString(),
        label || undefined,
      );
      if (result.error) toast.error(result.error);
      else {
        toast.success("Đã thêm phương án");
        setStart("");
        setEnd("");
        setLabel("");
      }
    });
  }

  function addVenue() {
    if (!venueName.trim()) {
      toast.error("Nhập tên địa điểm");
      return;
    }
    startTransition(async () => {
      const result = await addVenueOptionAction(
        meetup.id,
        venueName,
        venueAddress || undefined,
        venueNote || undefined,
      );
      if (result.error) toast.error(result.error);
      else {
        toast.success("Đã thêm địa điểm");
        setVenueName("");
        setVenueAddress("");
        setVenueNote("");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin kèo</CardTitle>
          <CardDescription>Chỉnh sửa tên, mô tả và hạn bình chọn.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="meetupId" value={meetup.id} />
            {state.error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="title">Tên kèo</Label>
              <Input
                id="title"
                name="title"
                defaultValue={meetup.title}
                maxLength={120}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={meetup.description ?? ""}
                maxLength={1000}
                rows={3}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Loại hoạt động</Label>
                <input type="hidden" name="activityType" value={activityType} />
                <Select
                  value={activityType}
                  onValueChange={(value) => setActivityType(value as ActivityType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Ăn uống</SelectItem>
                    <SelectItem value="coffee">Cà phê</SelectItem>
                    <SelectItem value="hangout">Gặp mặt</SelectItem>
                    <SelectItem value="sport">Thể thao</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="votingDeadline">Hạn bình chọn</Label>
                <Input
                  id="votingDeadline"
                  name="votingDeadline"
                  type="datetime-local"
                  defaultValue={
                    meetup.voting_deadline
                      ? toLocalInput(meetup.voting_deadline)
                      : ""
                  }
                />
              </div>
            </div>

            <SubmitButton>Lưu thay đổi</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phương án thời gian</CardTitle>
          <CardDescription>
            Chỉ sửa được khi kèo còn nháp hoặc đang bình chọn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {timeOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có phương án.</p>
          ) : (
            timeOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between gap-2 rounded-xl border p-3"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-medium">
                    {option.label ||
                      formatDateTimeInZone(option.starts_at, meetup.timezone)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTimeInZone(option.starts_at, meetup.timezone)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await removeTimeOptionAction(
                        meetup.id,
                        option.id,
                      );
                      if (result.error) toast.error(result.error);
                      else toast.success("Đã xóa phương án");
                    })
                  }
                  aria-label="Xóa phương án"
                >
                  <Trash2 />
                </Button>
              </div>
            ))
          )}

          <div className="space-y-2 rounded-xl border p-3">
            <p className="text-sm font-medium">Thêm phương án</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="datetime-local"
                value={start}
                onChange={(event) => setStart(event.target.value)}
                aria-label="Bắt đầu"
              />
              <Input
                type="datetime-local"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
                aria-label="Kết thúc"
              />
            </div>
            <Input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Nhãn (tùy chọn)"
              maxLength={80}
            />
            <Button variant="outline" onClick={addTime} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Plus />}
              Thêm thời gian
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Địa điểm</CardTitle>
          <CardDescription>Thêm hoặc xóa địa điểm gợi ý.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {venueOptions.map((option) => (
            <div
              key={option.id}
              className="flex items-center justify-between gap-2 rounded-xl border p-3"
            >
              <div className="min-w-0 text-sm">
                <p className="font-medium">{option.name}</p>
                {option.address ? (
                  <p className="text-xs text-muted-foreground">{option.address}</p>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await removeVenueOptionAction(
                      meetup.id,
                      option.id,
                    );
                    if (result.error) toast.error(result.error);
                    else toast.success("Đã xóa địa điểm");
                  })
                }
                aria-label="Xóa địa điểm"
              >
                <Trash2 />
              </Button>
            </div>
          ))}

          <div className="space-y-2 rounded-xl border p-3">
            <Input
              value={venueName}
              onChange={(event) => setVenueName(event.target.value)}
              placeholder="Tên địa điểm"
              maxLength={120}
            />
            <Input
              value={venueAddress}
              onChange={(event) => setVenueAddress(event.target.value)}
              placeholder="Địa chỉ"
              maxLength={240}
            />
            <Input
              value={venueNote}
              onChange={(event) => setVenueNote(event.target.value)}
              placeholder="Ghi chú"
              maxLength={300}
            />
            <Button variant="outline" onClick={addVenue} disabled={pending}>
              <Plus />
              Thêm địa điểm
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
