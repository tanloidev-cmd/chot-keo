"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarPlus,
  Loader2,
  MapPin,
  Send,
  Trash2,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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
import { createMeetupAction } from "@/lib/actions/meetups";
import type { ActivityType } from "@/lib/types";

type GroupOption = {
  id: string;
  name: string;
};

type TimeOption = {
  startsAt: string;
  endsAt: string;
  label: string;
};

type VenueOption = {
  name: string;
  address: string;
  note: string;
};

type CreateFieldErrors = {
  groupId?: string;
  title?: string;
  timeOptions?: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toLocalInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function nextSaturday() {
  const date = new Date();
  const day = date.getDay();
  const diff = (6 - day + 7) % 7 || 7;
  date.setDate(date.getDate() + diff);
  date.setHours(18, 0, 0, 0);
  return date;
}

function addHours(date: Date, hours: number) {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

export function CreateMeetupForm({
  groups,
  defaultGroupId,
}: {
  groups: GroupOption[];
  defaultGroupId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CreateFieldErrors>({});

  const [groupId, setGroupId] = useState(defaultGroupId ?? groups[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("hangout");
  const [votingDeadline, setVotingDeadline] = useState("");

  const initialStart = useMemo(() => nextSaturday(), []);
  const [timeOptions, setTimeOptions] = useState<TimeOption[]>([
    {
      startsAt: toLocalInput(initialStart),
      endsAt: toLocalInput(addHours(initialStart, 3)),
      label: "",
    },
  ]);
  const [venueOptions, setVenueOptions] = useState<VenueOption[]>([]);

  function updateTime(index: number, patch: Partial<TimeOption>) {
    setTimeOptions((current) =>
      current.map((option, i) => (i === index ? { ...option, ...patch } : option)),
    );
  }

  function updateVenue(index: number, patch: Partial<VenueOption>) {
    setVenueOptions((current) =>
      current.map((option, i) => (i === index ? { ...option, ...patch } : option)),
    );
  }

  function clearFieldError(field: keyof CreateFieldErrors) {
    setFieldErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  }

  function submit() {
    setError("");

    const issues: CreateFieldErrors = {};

    if (!groupId) issues.groupId = "Chọn nhóm.";
    if (!title.trim()) issues.title = "Nhập tên kèo.";

    if (timeOptions.some((option) => !option.startsAt || !option.endsAt)) {
      issues.timeOptions = "Nhập đầy đủ thời gian bắt đầu và kết thúc.";
    }

    if (Object.values(issues).some(Boolean)) {
      setFieldErrors(issues);
      return;
    }

    const payloadTimeOptions = timeOptions.map((option) => ({
      startsAt: new Date(option.startsAt).toISOString(),
      endsAt: new Date(option.endsAt).toISOString(),
      label: option.label.trim() || undefined,
    }));

    if (payloadTimeOptions.some((option) => option.startsAt >= option.endsAt)) {
      setFieldErrors({
        timeOptions: "Thời gian kết thúc phải sau thời gian bắt đầu.",
      });
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const result = await createMeetupAction({
        groupId,
        title,
        description: description || undefined,
        activityType,
        votingDeadline: votingDeadline
          ? new Date(votingDeadline).toISOString()
          : null,
        timeOptions: payloadTimeOptions,
        venueOptions: venueOptions
          .filter((venue) => venue.name.trim())
          .map((venue) => ({
            name: venue.name,
            address: venue.address || undefined,
            note: venue.note || undefined,
          })),
      });

      if (result?.error) {
        setError(result.error);
        if (result.meetupId) router.push(`/meetups/${result.meetupId}`);
      }
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              1
            </span>
            Thông tin kèo
          </CardTitle>
          <CardDescription>Đặt tên ngắn gọn, dễ hiểu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field data-invalid={fieldErrors.groupId ? true : undefined}>
            <FieldLabel>Nhóm</FieldLabel>
            <Select
              value={groupId}
              onValueChange={(value) => {
                setGroupId(value);
                clearFieldError("groupId");
              }}
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={fieldErrors.groupId ? true : undefined}
                aria-describedby={
                  fieldErrors.groupId
                    ? "create-meetup-groupId-error"
                    : undefined
                }
              >
                <SelectValue placeholder="Chọn nhóm" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError id="create-meetup-groupId-error">
              {fieldErrors.groupId}
            </FieldError>
          </Field>

          <Field data-invalid={fieldErrors.title ? true : undefined}>
            <FieldLabel htmlFor="title">Tên kèo</FieldLabel>
            <Input
              id="title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                clearFieldError("title");
              }}
              placeholder="Ví dụ: Cà phê sáng thứ Bảy"
              maxLength={120}
              className="h-11"
              required
              aria-invalid={fieldErrors.title ? true : undefined}
              aria-describedby={
                fieldErrors.title ? "create-meetup-title-error" : undefined
              }
            />
            <FieldError id="create-meetup-title-error">
              {fieldErrors.title}
            </FieldError>
          </Field>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả (tùy chọn)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ghi chú thêm cho cả nhóm..."
              maxLength={1000}
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Loại hoạt động</Label>
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
              <Label htmlFor="deadline">Hạn bình chọn (tùy chọn)</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={votingDeadline}
                onChange={(event) => setVotingDeadline(event.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              2
            </span>
            Phương án ngày giờ
          </CardTitle>
          <CardDescription>
            Thêm một hoặc nhiều phương án để nhóm bình chọn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldError id="create-meetup-timeOptions-error">
            {fieldErrors.timeOptions}
          </FieldError>

          {timeOptions.map((option, index) => (
            <div key={index} className="space-y-2 rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Phương án {index + 1}</p>
                {timeOptions.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setTimeOptions((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                    aria-label="Xóa phương án"
                  >
                    <Trash2 />
                  </Button>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`start-${index}`}>Bắt đầu</Label>
                  <Input
                    id={`start-${index}`}
                    type="datetime-local"
                    value={option.startsAt}
                    aria-invalid={fieldErrors.timeOptions ? true : undefined}
                    onChange={(event) => {
                      updateTime(index, { startsAt: event.target.value });
                      clearFieldError("timeOptions");
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`end-${index}`}>Kết thúc</Label>
                  <Input
                    id={`end-${index}`}
                    type="datetime-local"
                    value={option.endsAt}
                    aria-invalid={fieldErrors.timeOptions ? true : undefined}
                    onChange={(event) => {
                      updateTime(index, { endsAt: event.target.value });
                      clearFieldError("timeOptions");
                    }}
                  />
                </div>
              </div>
              <Input
                value={option.label}
                onChange={(event) =>
                  updateTime(index, { label: event.target.value })
                }
                placeholder="Nhãn (tùy chọn): Sáng thứ Bảy"
                maxLength={80}
              />
            </div>
          ))}

          {timeOptions.length < 8 ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                const last = timeOptions[timeOptions.length - 1];
                const start = last
                  ? new Date(new Date(last.startsAt).getTime() + 86_400_000)
                  : nextSaturday();
                setTimeOptions((current) => [
                  ...current,
                  {
                    startsAt: toLocalInput(start),
                    endsAt: toLocalInput(addHours(start, 3)),
                    label: "",
                  },
                ]);
              }}
            >
              <CalendarPlus />
              Thêm phương án
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              3
            </span>
            Địa điểm gợi ý (tùy chọn)
          </CardTitle>
          <CardDescription>Tự nhập địa điểm, chưa cần bản đồ.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {venueOptions.map((venue, index) => (
            <div key={index} className="space-y-2 rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Địa điểm {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    setVenueOptions((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                  aria-label="Xóa địa điểm"
                >
                  <Trash2 />
                </Button>
              </div>
              <Input
                value={venue.name}
                onChange={(event) =>
                  updateVenue(index, { name: event.target.value })
                }
                placeholder="Tên địa điểm"
                maxLength={120}
              />
              <Input
                value={venue.address}
                onChange={(event) =>
                  updateVenue(index, { address: event.target.value })
                }
                placeholder="Địa chỉ"
                maxLength={240}
              />
              <Input
                value={venue.note}
                onChange={(event) =>
                  updateVenue(index, { note: event.target.value })
                }
                placeholder="Ghi chú"
                maxLength={300}
              />
            </div>
          ))}

          {venueOptions.length < 6 ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                setVenueOptions((current) => [
                  ...current,
                  { name: "", address: "", note: "" },
                ])
              }
            >
              <MapPin />
              Thêm địa điểm
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Button
        type="button"
        className="h-12 w-full"
        onClick={submit}
        disabled={pending}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Send />}
        Gửi đề xuất cho nhóm
      </Button>
    </div>
  );
}
