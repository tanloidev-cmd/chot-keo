import {
  addDays,
  format,
  isWeekend,
  nextSaturday,
  parseISO,
  startOfDay,
} from "date-fns";
import { vi } from "date-fns/locale";

export function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function formatDateKey(key: string) {
  return format(parseISO(key), "EEEE, dd/MM", { locale: vi });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Chưa chốt";
  return format(new Date(value), "HH:mm • EEEE, dd/MM/yyyy", { locale: vi });
}

export function formatDateTimeInZone(
  value: string | null | undefined,
  timeZone = "Asia/Ho_Chi_Minh",
) {
  if (!value) return "Chưa chốt";

  const date = new Date(value);
  const datePart = new Intl.DateTimeFormat("vi-VN", {
    timeZone,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("vi-VN", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${timePart} • ${datePart}`;
}

export function dateKeyInZone(value: string, timeZone = "Asia/Ho_Chi_Minh") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function formatShortDateTime(value: string | null | undefined) {
  if (!value) return "Chưa chốt";
  return format(new Date(value), "dd/MM HH:mm", { locale: vi });
}

export function nextWeekendDates(count = 6) {
  const dates: Date[] = [];
  let cursor = startOfDay(nextSaturday(new Date()));

  while (dates.length < count * 2) {
    dates.push(new Date(cursor));
    if (isWeekend(addDays(cursor, 1))) {
      dates.push(addDays(cursor, 1));
      cursor = addDays(cursor, 7);
    } else {
      cursor = addDays(cursor, 1);
    }
  }

  return dates.slice(0, count * 2);
}

export function groupWeekends(dates: Date[]) {
  const groups = new Map<string, Date[]>();

  for (const date of dates) {
    const key = format(date, "yyyy-'W'II");
    const list = groups.get(key) ?? [];
    list.push(date);
    groups.set(key, list);
  }

  return [...groups.entries()].map(([key, days]) => ({ key, days }));
}

export function relativeTime(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60_000);

  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  return format(date, "dd/MM/yyyy");
}
