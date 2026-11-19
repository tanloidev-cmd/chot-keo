"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { AvailabilityStatus } from "@/lib/types";

export type AvailabilityState = {
  error?: string;
  success?: string;
};

export async function saveAvailabilityAction(input: {
  groupId: string;
  dates: string[];
  status: AvailabilityStatus;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
}): Promise<AvailabilityState> {
  await requireUser();

  if (!input.groupId || !input.dates?.length) {
    return { error: "Chọn ít nhất một ngày." };
  }

  if (input.dates.length > 62) {
    return { error: "Chỉ cập nhật tối đa 62 ngày mỗi lần." };
  }

  for (const date of input.dates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { error: "Ngày không hợp lệ." };
    }
  }

  if (
    (input.startTime && !input.endTime) ||
    (!input.startTime && input.endTime)
  ) {
    return { error: "Cần nhập cả giờ bắt đầu và kết thúc." };
  }

  if (
    input.startTime &&
    input.endTime &&
    input.startTime >= input.endTime
  ) {
    return { error: "Giờ kết thúc phải sau giờ bắt đầu." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_availability_batch", {
    p_group_id: input.groupId,
    p_dates: input.dates,
    p_status: input.status,
    p_start_time: input.startTime || null,
    p_end_time: input.endTime || null,
    p_note: input.note || null,
  });

  if (error) {
    return { error: "Không thể lưu lịch rảnh. Kiểm tra quyền thành viên." };
  }

  revalidatePath(`/groups/${input.groupId}/calendar`);
  revalidatePath("/calendar");
  revalidatePath("/home");
  return { success: "Đã lưu lịch rảnh." };
}
