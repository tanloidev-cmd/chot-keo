export function initials(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

export function activityLabel(value: string) {
  const map: Record<string, string> = {
    food: "Ăn uống",
    coffee: "Cà phê",
    hangout: "Gặp mặt",
    sport: "Thể thao",
    other: "Khác",
  };
  return map[value] ?? "Gặp mặt";
}

export function rsvpLabel(value: string | null | undefined) {
  const map: Record<string, string> = {
    going: "Sẽ đi",
    maybe: "Có thể",
    not_going: "Không đi",
    cancellation_pending: "Chờ ghi nhận hủy",
    cancelled: "Đã hủy",
    waitlisted: "Danh sách chờ",
  };
  return value ? (map[value] ?? value) : "Chưa phản hồi";
}
