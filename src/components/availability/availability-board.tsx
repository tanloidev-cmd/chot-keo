"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarCheck2,
  Check,
  Clock,
  Loader2,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { AvailabilityBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { saveAvailabilityAction } from "@/lib/actions/availability";
import { formatDateKey, groupWeekends, nextWeekendDates, toDateKey } from "@/lib/dates";
import type {
  AvailabilityEntry,
  AvailabilityStatus,
  GroupMember,
} from "@/lib/types";

export function AvailabilityBoard({
  groupId,
  groupName,
  members,
  entries,
  currentUserId,
}: {
  groupId: string;
  groupName: string;
  members: GroupMember[];
  entries: AvailabilityEntry[];
  currentUserId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<AvailabilityStatus>("available");
  const [timeMode, setTimeMode] = useState<"all_day" | "custom">("all_day");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("21:00");
  const [note, setNote] = useState("");
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [memberFilter, setMemberFilter] = useState("all");

  const dates = useMemo(() => nextWeekendDates(6), []);
  const weekends = useMemo(() => groupWeekends(dates), [dates]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, AvailabilityEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.local_date) ?? [];
      list.push(entry);
      map.set(entry.local_date, list);
    }
    return map;
  }, [entries]);

  const myEntryByDate = useMemo(() => {
    const map = new Map<string, AvailabilityEntry>();
    for (const entry of entries) {
      if (entry.user_id === currentUserId) {
        map.set(entry.local_date, entry);
      }
    }
    return map;
  }, [entries, currentUserId]);

  function toggleDate(key: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectWeekend(days: Date[]) {
    setSelected((current) => {
      const next = new Set(current);
      const keys = days.map(toDateKey);
      const allSelected = keys.every((key) => next.has(key));
      for (const key of keys) {
        if (allSelected) next.delete(key);
        else next.add(key);
      }
      return next;
    });
  }

  function save() {
    if (selected.size === 0) {
      toast.error("Chọn ít nhất một ngày");
      return;
    }

    startTransition(async () => {
      const result = await saveAvailabilityAction({
        groupId,
        dates: [...selected],
        status,
        startTime: timeMode === "custom" ? startTime : null,
        endTime: timeMode === "custom" ? endTime : null,
        note: note || null,
      });

      if (result.error) toast.error(result.error);
      else {
        toast.success(`Đã lưu ${selected.size} ngày cho ${groupName}`);
        setSelected(new Set());
      }
    });
  }

  const detailEntries = detailDate ? entriesByDate.get(detailDate) ?? [] : [];
  const detailMembers =
    memberFilter === "all"
      ? members
      : members.filter((member) => member.user_id === memberFilter);

  return (
    <div className="space-y-4">
      <Card className="border-orange-200 bg-orange-50/60">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="size-5 text-primary" />
            <div>
              <p className="font-medium">Cập nhật nhanh lịch rảnh</p>
              <p className="text-xs text-muted-foreground">
                Chọn các ngày bên dưới rồi đặt trạng thái.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as AvailabilityStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Rảnh</SelectItem>
                  <SelectItem value="maybe">Có thể</SelectItem>
                  <SelectItem value="unavailable">Bận</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Thời gian</Label>
              <Select
                value={timeMode}
                onValueChange={(value) =>
                  setTimeMode(value as "all_day" | "custom")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_day">Cả ngày</SelectItem>
                  <SelectItem value="custom">Khung giờ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {timeMode === "custom" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startTime">Từ</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Đến</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="availability-note">Ghi chú (tùy chọn)</Label>
            <Input
              id="availability-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ví dụ: chỉ rảnh buổi sáng"
              maxLength={200}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary">{selected.size} ngày đã chọn</Badge>
            <Button onClick={save} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Check />}
              Lưu lịch
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {weekends.map((weekend) => (
          <Card key={weekend.key}>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Cuối tuần {formatDateKey(toDateKey(weekend.days[0]))}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => selectWeekend(weekend.days)}
                >
                  Chọn cả tuần
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {weekend.days.map((date) => {
                  const key = toDateKey(date);
                  const dayEntries = entriesByDate.get(key) ?? [];
                  const myEntry = myEntryByDate.get(key);
                  const available = dayEntries.filter(
                    (entry) => entry.status === "available",
                  ).length;
                  const maybe = dayEntries.filter(
                    (entry) => entry.status === "maybe",
                  ).length;
                  const unavailable = dayEntries.filter(
                    (entry) => entry.status === "unavailable",
                  ).length;
                  const unknown = Math.max(
                    members.length - dayEntries.length,
                    0,
                  );

                  return (
                    <div
                      key={key}
                      className={`rounded-xl border p-3 transition-colors ${
                        selected.has(key)
                          ? "border-primary bg-primary/5"
                          : "bg-card"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={selected.has(key)}
                          onCheckedChange={() => toggleDate(key)}
                          aria-label={`Chọn ${key}`}
                          className="mt-0.5"
                        />
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => setDetailDate(key)}
                        >
                          <p className="text-sm font-medium">
                            {formatDateKey(key)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {myEntry
                              ? `Bạn: ${
                                  myEntry.status === "available"
                                    ? "rảnh"
                                    : myEntry.status === "maybe"
                                      ? "có thể"
                                      : "bận"
                                }`
                              : "Bạn chưa khai báo"}
                          </p>
                          {myEntry ? (
                            <div className="mt-1.5">
                              <AvailabilityBadge status={myEntry.status} />
                            </div>
                          ) : null}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDetailDate(key)}
                        className="mt-2 flex w-full items-center justify-between rounded-lg bg-muted/60 px-2 py-1.5 text-[11px]"
                      >
                        <span className="text-emerald-700">{available} rảnh</span>
                        <span className="text-amber-700">{maybe} có thể</span>
                        <span className="text-rose-700">{unavailable} bận</span>
                        <span className="text-muted-foreground">
                          {unknown} chưa
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={Boolean(detailDate)}
        onOpenChange={(open) => !open && setDetailDate(null)}
      >
        <DialogContent className="max-h-[85dvh]">
          <DialogHeader>
            <DialogTitle>
              {detailDate ? formatDateKey(detailDate) : "Chi tiết"}
            </DialogTitle>
            <DialogDescription>
              Trạng thái của từng thành viên trong nhóm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Select value={memberFilter} onValueChange={setMemberFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Lọc thành viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thành viên</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.profile?.display_name ?? "Thành viên"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ScrollArea className="h-72 pr-3">
              <div className="space-y-1">
                {detailMembers.map((member) => {
                  const entry = detailEntries.find(
                    (item) => item.user_id === member.user_id,
                  );
                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between gap-3 rounded-lg px-1 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm">
                          {member.profile?.display_name ?? "Thành viên"}
                        </p>
                        {entry?.start_time ? (
                          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {entry.start_time.slice(0, 5)} –{" "}
                            {entry.end_time?.slice(0, 5)}
                          </p>
                        ) : null}
                      </div>
                      {entry ? (
                        <AvailabilityBadge status={entry.status} />
                      ) : (
                        <Badge variant="outline">Chưa khai báo</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <Separator />
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <UsersRound className="size-3.5" />
              {detailEntries.length}/{members.length} thành viên đã phản hồi
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
