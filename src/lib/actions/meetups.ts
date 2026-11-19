"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import type { FieldErrors } from "@/lib/forms/field-errors";
import { createClient } from "@/lib/supabase/server";
import type { ActivityType, RsvpStatus } from "@/lib/types";

export type MeetupState = {
  error?: string;
  fieldErrors?: FieldErrors;
  success?: string;
  meetupId?: string;
};

const isoDate = z.string().refine(
  (value) => !Number.isNaN(new Date(value).getTime()),
  "Thời gian không hợp lệ",
);

const timeOptionSchema = z.object({
  startsAt: isoDate,
  endsAt: isoDate,
  label: z.string().trim().max(80).optional(),
});

const venueOptionSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên địa điểm").max(120),
  address: z.string().trim().max(240).optional(),
  note: z.string().trim().max(300).optional(),
});

const createMeetupSchema = z.object({
  groupId: z.string().uuid(),
  title: z.string().trim().min(1, "Nhập tên kèo").max(120),
  description: z.string().trim().max(1000).optional(),
  activityType: z.enum(["food", "coffee", "hangout", "sport", "other"]),
  votingDeadline: z.string().optional().nullable(),
  timeOptions: z
    .array(timeOptionSchema)
    .min(1, "Cần ít nhất một phương án thời gian")
    .max(8, "Tối đa 8 phương án thời gian"),
  venueOptions: z.array(venueOptionSchema).max(6).default([]),
});

export async function createMeetupAction(input: {
  groupId: string;
  title: string;
  description?: string;
  activityType: ActivityType;
  votingDeadline?: string | null;
  timeOptions: { startsAt: string; endsAt: string; label?: string }[];
  venueOptions: { name: string; address?: string; note?: string }[];
}): Promise<MeetupState> {
  const parsed = createMeetupSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ" };
  }

  for (const option of parsed.data.timeOptions) {
    if (new Date(option.startsAt) >= new Date(option.endsAt)) {
      return { error: "Thời gian kết thúc phải sau thời gian bắt đầu." };
    }
  }

  const user = await requireUser();
  const supabase = await createClient();
  const meetupId = crypto.randomUUID();
  const { data: group } = await supabase
    .from("groups")
    .select("timezone")
    .eq("id", parsed.data.groupId)
    .maybeSingle();

  const { error } = await supabase.from("meetups").insert({
    id: meetupId,
    group_id: parsed.data.groupId,
    created_by: user.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    activity_type: parsed.data.activityType,
    status: "draft",
    timezone: group?.timezone ?? "Asia/Ho_Chi_Minh",
    voting_deadline: parsed.data.votingDeadline || null,
  });

  if (error) {
    return { error: "Không thể tạo kèo. Cần là thành viên nhóm." };
  }

  const timeRows = parsed.data.timeOptions.map((option, index) => ({
    id: crypto.randomUUID(),
    meetup_id: meetupId,
    starts_at: option.startsAt,
    ends_at: option.endsAt,
    label: option.label || null,
    position: index,
  }));

  const { error: timeError } = await supabase
    .from("meetup_time_options")
    .insert(timeRows);

  if (timeError) {
    await supabase.from("meetups").delete().eq("id", meetupId);
    return { error: "Không thể lưu phương án thời gian." };
  }

  if (parsed.data.venueOptions.length > 0) {
    const venueRows = parsed.data.venueOptions.map((option, index) => ({
      id: crypto.randomUUID(),
      meetup_id: meetupId,
      name: option.name,
      address: option.address || null,
      note: option.note || null,
      position: index,
    }));

    const { error: venueError } = await supabase
      .from("meetup_venue_options")
      .insert(venueRows);

    if (venueError) {
      await supabase.from("meetups").delete().eq("id", meetupId);
      return { error: "Không thể lưu phương án địa điểm." };
    }
  }

  const { error: publishError } = await supabase.rpc("publish_meetup", {
    p_meetup_id: meetupId,
  });

  if (publishError) {
    return {
      error:
        "Đã lưu nháp nhưng chưa gửi được. Mở kèo để kiểm tra và gửi lại.",
      meetupId,
    };
  }

  revalidatePath(`/groups/${parsed.data.groupId}`);
  revalidatePath("/meetups");
  revalidatePath("/home");
  redirect(`/meetups/${meetupId}`);
}

export async function publishMeetupAction(
  meetupId: string,
): Promise<MeetupState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_meetup", {
    p_meetup_id: meetupId,
  });

  if (error) return { error: "Không thể gửi đề xuất. Kiểm tra phương án." };

  revalidatePath(`/meetups/${meetupId}`);
  revalidatePath("/meetups");
  revalidatePath("/home");
  return { success: "Đã gửi đề xuất cho nhóm." };
}

export async function voteTimeAction(
  meetupId: string,
  timeOptionId: string | null,
): Promise<MeetupState> {
  const user = await requireUser();
  const supabase = await createClient();

  if (!timeOptionId) {
    const { error } = await supabase
      .from("meetup_time_votes")
      .delete()
      .eq("meetup_id", meetupId)
      .eq("user_id", user.id);
    if (error) return { error: "Không thể bỏ bình chọn." };
    revalidatePath(`/meetups/${meetupId}`);
    return { success: "Đã bỏ bình chọn." };
  }

  const { error } = await supabase.from("meetup_time_votes").upsert(
    {
      id: crypto.randomUUID(),
      meetup_id: meetupId,
      time_option_id: timeOptionId,
      user_id: user.id,
    },
    { onConflict: "meetup_id,user_id" },
  );

  if (error) return { error: "Không thể bình chọn thời gian." };

  revalidatePath(`/meetups/${meetupId}`);
  return { success: "Đã lưu bình chọn thời gian." };
}

export async function voteVenueAction(
  meetupId: string,
  venueOptionId: string | null,
): Promise<MeetupState> {
  const user = await requireUser();
  const supabase = await createClient();

  if (!venueOptionId) {
    const { error } = await supabase
      .from("meetup_venue_votes")
      .delete()
      .eq("meetup_id", meetupId)
      .eq("user_id", user.id);
    if (error) return { error: "Không thể bỏ bình chọn." };
    revalidatePath(`/meetups/${meetupId}`);
    return { success: "Đã bỏ bình chọn." };
  }

  const { error } = await supabase.from("meetup_venue_votes").upsert(
    {
      id: crypto.randomUUID(),
      meetup_id: meetupId,
      venue_option_id: venueOptionId,
      user_id: user.id,
    },
    { onConflict: "meetup_id,user_id" },
  );

  if (error) return { error: "Không thể bình chọn địa điểm." };

  revalidatePath(`/meetups/${meetupId}`);
  return { success: "Đã lưu bình chọn địa điểm." };
}

export async function confirmMeetupAction(
  meetupId: string,
  timeOptionId: string,
  venueOptionId: string | null,
): Promise<MeetupState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_meetup", {
    p_meetup_id: meetupId,
    p_time_option_id: timeOptionId,
    p_venue_option_id: venueOptionId,
  });

  if (error) return { error: "Không thể chốt kèo. Kiểm tra quyền và phương án." };

  revalidatePath(`/meetups/${meetupId}`);
  revalidatePath("/meetups");
  revalidatePath("/home");
  return { success: "Đã chốt kèo." };
}

export async function setMeetupStatusAction(
  meetupId: string,
  status: "cancelled" | "completed" | "in_progress",
): Promise<MeetupState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_meetup_status", {
    p_meetup_id: meetupId,
    p_status: status,
  });

  if (error) return { error: "Không thể đổi trạng thái kèo." };

  revalidatePath(`/meetups/${meetupId}`);
  revalidatePath("/meetups");
  revalidatePath("/home");
  return { success: "Đã cập nhật trạng thái kèo." };
}

export async function setRsvpAction(
  meetupId: string,
  status: Extract<RsvpStatus, "going" | "maybe" | "not_going">,
  note?: string,
  reason?: string,
): Promise<MeetupState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_rsvp", {
    p_meetup_id: meetupId,
    p_status: status,
    p_note: note || null,
    p_reason: reason || null,
  });

  if (error) return { error: "Không thể cập nhật RSVP." };

  revalidatePath(`/meetups/${meetupId}`);
  revalidatePath("/home");
  return { success: "Đã cập nhật phản hồi." };
}

export async function assignHostAction(
  meetupId: string,
  userId: string,
): Promise<MeetupState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_host", {
    p_meetup_id: meetupId,
    p_user_id: userId,
  });

  if (error) return { error: "Không thể gán Host." };

  revalidatePath(`/meetups/${meetupId}`);
  return { success: "Đã gán Host." };
}

export async function unassignHostAction(
  meetupId: string,
  userId: string,
): Promise<MeetupState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("unassign_host", {
    p_meetup_id: meetupId,
    p_user_id: userId,
  });

  if (error) return { error: "Không thể bỏ Host." };

  revalidatePath(`/meetups/${meetupId}`);
  return { success: "Đã bỏ Host." };
}

export async function acknowledgeCancellationAction(
  meetupId: string,
  requestId: string,
): Promise<MeetupState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("acknowledge_cancellation", {
    p_request_id: requestId,
  });

  if (error) return { error: "Không thể ghi nhận yêu cầu hủy." };

  revalidatePath(`/meetups/${meetupId}`);
  return { success: "Đã ghi nhận yêu cầu hủy." };
}

export async function updateMeetupAction(
  _previous: MeetupState,
  formData: FormData,
): Promise<MeetupState> {
  const meetupId = String(formData.get("meetupId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawActivityType = String(formData.get("activityType") ?? "hangout");
  const votingDeadline = String(formData.get("votingDeadline") ?? "").trim();

  if (!meetupId) return { error: "Thiếu kèo." };

  const fieldErrors: FieldErrors = {};

  if (!title) {
    fieldErrors.title = "Nhập tên kèo.";
  } else if (title.length > 120) {
    fieldErrors.title = "Tên kèo tối đa 120 ký tự.";
  }

  if (description.length > 1000) {
    fieldErrors.description = "Mô tả tối đa 1000 ký tự.";
  }

  // `new Date("").toISOString()` and invalid dates throw, so validate first.
  const deadline = votingDeadline ? new Date(votingDeadline) : null;

  if (deadline && Number.isNaN(deadline.getTime())) {
    fieldErrors.votingDeadline = "Hạn bình chọn không hợp lệ.";
  }

  if (Object.values(fieldErrors).some(Boolean)) {
    return { fieldErrors };
  }

  const activityType = [
    "food",
    "coffee",
    "hangout",
    "sport",
    "other",
  ].includes(rawActivityType)
    ? rawActivityType
    : "hangout";

  const supabase = await createClient();
  const { error } = await supabase
    .from("meetups")
    .update({
      title,
      description: description || null,
      activity_type: activityType,
      voting_deadline: deadline ? deadline.toISOString() : null,
    })
    .eq("id", meetupId);

  if (error) return { error: "Không thể cập nhật kèo." };

  revalidatePath(`/meetups/${meetupId}`);
  return { success: "Đã cập nhật kèo." };
}

export async function addTimeOptionAction(
  meetupId: string,
  startsAt: string,
  endsAt: string,
  label?: string,
): Promise<MeetupState> {
  if (new Date(startsAt) >= new Date(endsAt)) {
    return { error: "Thời gian kết thúc phải sau thời gian bắt đầu." };
  }

  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("meetup_time_options").insert({
    id: crypto.randomUUID(),
    meetup_id: meetupId,
    starts_at: new Date(startsAt).toISOString(),
    ends_at: new Date(endsAt).toISOString(),
    label: label || null,
    position: 999,
  });

  if (error) return { error: "Không thể thêm phương án thời gian." };

  revalidatePath(`/meetups/${meetupId}`);
  return { success: "Đã thêm phương án." };
}

export async function removeTimeOptionAction(
  meetupId: string,
  optionId: string,
): Promise<MeetupState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("meetup_time_options")
    .delete()
    .eq("id", optionId)
    .eq("meetup_id", meetupId);

  if (error) return { error: "Không thể xóa phương án thời gian." };

  revalidatePath(`/meetups/${meetupId}`);
  return { success: "Đã xóa phương án." };
}

export async function addVenueOptionAction(
  meetupId: string,
  name: string,
  address?: string,
  note?: string,
): Promise<MeetupState> {
  if (!name.trim()) return { error: "Nhập tên địa điểm." };

  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("meetup_venue_options").insert({
    id: crypto.randomUUID(),
    meetup_id: meetupId,
    name: name.trim(),
    address: address?.trim() || null,
    note: note?.trim() || null,
    position: 999,
  });

  if (error) return { error: "Không thể thêm địa điểm." };

  revalidatePath(`/meetups/${meetupId}`);
  return { success: "Đã thêm địa điểm." };
}

export async function removeVenueOptionAction(
  meetupId: string,
  optionId: string,
): Promise<MeetupState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("meetup_venue_options")
    .delete()
    .eq("id", optionId)
    .eq("meetup_id", meetupId);

  if (error) return { error: "Không thể xóa địa điểm." };

  revalidatePath(`/meetups/${meetupId}`);
  return { success: "Đã xóa địa điểm." };
}

export async function markNotificationReadAction(
  notificationId: string,
): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  revalidatePath("/notifications");
  revalidatePath("/home");
}

export async function markNotificationReadFormAction(formData: FormData) {
  const id = String(formData.get("notificationId") ?? "");
  if (id) await markNotificationReadAction(id);
}
