import { Badge } from "@/components/ui/badge";
import type {
  AvailabilityStatus,
  GroupRole,
  MeetupStatus,
  RsvpStatus,
} from "@/lib/types";

export function RoleBadge({ role }: { role: GroupRole }) {
  if (role === "owner") {
    return <Badge className="bg-amber-100 text-amber-800">Owner</Badge>;
  }
  if (role === "admin") {
    return <Badge className="bg-sky-100 text-sky-800">Admin</Badge>;
  }
  return <Badge variant="secondary">Member</Badge>;
}

export function MeetupStatusBadge({ status }: { status: MeetupStatus }) {
  const map: Record<MeetupStatus, { label: string; className: string }> = {
    draft: { label: "Nháp", className: "bg-muted text-muted-foreground" },
    proposed: { label: "Đang bình chọn", className: "bg-sky-100 text-sky-800" },
    confirmed: { label: "Đã chốt", className: "bg-emerald-100 text-emerald-800" },
    in_progress: {
      label: "Đang diễn ra",
      className: "bg-amber-100 text-amber-800",
    },
    completed: { label: "Đã xong", className: "bg-zinc-100 text-zinc-700" },
    cancelled: { label: "Đã hủy", className: "bg-rose-100 text-rose-700" },
  };
  const meta = map[status];

  return <Badge className={meta.className}>{meta.label}</Badge>;
}

export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const map: Record<AvailabilityStatus, { label: string; className: string }> = {
    available: { label: "Rảnh", className: "bg-emerald-100 text-emerald-800" },
    maybe: { label: "Có thể", className: "bg-amber-100 text-amber-800" },
    unavailable: { label: "Bận", className: "bg-rose-100 text-rose-700" },
  };
  const meta = map[status];

  return <Badge className={meta.className}>{meta.label}</Badge>;
}

export function RsvpBadge({ status }: { status: RsvpStatus | null }) {
  if (!status) {
    return <Badge variant="outline">Chưa phản hồi</Badge>;
  }

  const map: Record<RsvpStatus, { label: string; className: string }> = {
    going: { label: "Sẽ đi", className: "bg-emerald-100 text-emerald-800" },
    maybe: { label: "Có thể", className: "bg-amber-100 text-amber-800" },
    not_going: { label: "Không đi", className: "bg-rose-100 text-rose-700" },
    cancellation_pending: {
      label: "Chờ ghi nhận hủy",
      className: "bg-orange-100 text-orange-800",
    },
    cancelled: { label: "Đã hủy", className: "bg-rose-100 text-rose-700" },
    waitlisted: { label: "Danh sách chờ", className: "bg-sky-100 text-sky-800" },
  };
  const meta = map[status];

  return <Badge className={meta.className}>{meta.label}</Badge>;
}
