"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hashInviteToken } from "@/lib/auth/recovery";
import { requireUser } from "@/lib/auth/session";
import { publicEnv } from "@/lib/env";
import type { FieldErrors } from "@/lib/forms/field-errors";
import { parseGroupFormData } from "@/lib/groups/validation";
import { createClient } from "@/lib/supabase/server";
import type { GroupRole } from "@/lib/types";

export type ActionState = {
  error?: string;
  fieldErrors?: FieldErrors;
  success?: string;
};

export type InviteState = ActionState & {
  url?: string;
};

export async function createGroupAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseGroupFormData(formData);

  if (!parsed.success) {
    return { fieldErrors: parsed.fieldErrors };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const id = crypto.randomUUID();

  const { error } = await supabase.from("groups").insert({
    id,
    owner_id: user.id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    rules: parsed.data.rules || null,
    timezone: parsed.data.timezone,
  });

  if (error) {
    return { error: "Không thể tạo nhóm. Kiểm tra migration/RLS." };
  }

  revalidatePath("/groups");
  revalidatePath("/home");
  redirect(`/groups/${id}`);
}

export async function updateGroupAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const groupId = String(formData.get("groupId") ?? "");
  const parsed = parseGroupFormData(formData);

  if (!groupId) return { error: "Thiếu nhóm." };
  if (!parsed.success) {
    return { fieldErrors: parsed.fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      rules: parsed.data.rules || null,
      timezone: parsed.data.timezone,
    })
    .eq("id", groupId);

  if (error) return { error: "Không thể cập nhật nhóm." };

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return { success: "Đã cập nhật nhóm." };
}

export async function createInviteAction(
  _previous: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const groupId = String(formData.get("groupId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const maxUsesRaw = String(formData.get("maxUses") ?? "").trim();
  const expiresDaysRaw = String(formData.get("expiresDays") ?? "").trim();

  if (!groupId) return { error: "Thiếu nhóm." };

  const fieldErrors: FieldErrors = {};
  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;
  const expiresDays = expiresDaysRaw ? Number(expiresDaysRaw) : null;

  if (label.length > 80) {
    fieldErrors.label = "Nhãn tối đa 80 ký tự.";
  }

  if (
    maxUses !== null &&
    (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 10_000)
  ) {
    fieldErrors.maxUses = "Giới hạn lượt dùng phải từ 1 đến 10.000.";
  }

  if (
    expiresDays !== null &&
    (!Number.isInteger(expiresDays) || expiresDays < 1 || expiresDays > 3650)
  ) {
    fieldErrors.expiresDays = "Thời hạn phải từ 1 đến 3650 ngày.";
  }

  if (Object.values(fieldErrors).some(Boolean)) {
    return { fieldErrors };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const { randomBytes, createHash } = await import("node:crypto");
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const { error } = await supabase.from("group_invites").insert({
    id: crypto.randomUUID(),
    group_id: groupId,
    created_by: user.id,
    token_hash: tokenHash,
    label: label || null,
    max_uses: maxUses,
    expires_at: expiresDays
      ? new Date(Date.now() + expiresDays * 86_400_000).toISOString()
      : null,
  });

  if (error) {
    return { error: "Không thể tạo link mời. Cần quyền Owner/Admin." };
  }

  revalidatePath(`/groups/${groupId}/settings`);
  return {
    success: "Đã tạo link mời. Link chỉ hiển thị đầy đủ một lần.",
    url: `${publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/join/${rawToken}`,
  };
}

export async function revokeInviteAction(
  groupId: string,
  inviteId: string,
): Promise<ActionState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_group_invite", {
    p_invite_id: inviteId,
  });

  if (error) return { error: "Không thể thu hồi link mời." };

  revalidatePath(`/groups/${groupId}/settings`);
  return { success: "Đã thu hồi link mời." };
}

export async function redeemInviteAction(rawToken: string): Promise<ActionState> {
  await requireUser();
  const supabase = await createClient();
  const tokenHash = hashInviteToken(rawToken);
  const { data: groupId, error } = await supabase.rpc("redeem_group_invite", {
    p_token_hash: tokenHash,
  });

  if (error || !groupId) {
    return {
      error:
        "Link mời không hợp lệ, đã hết hạn, đã bị thu hồi hoặc đã hết lượt.",
    };
  }

  revalidatePath("/groups");
  revalidatePath("/home");
  redirect(`/groups/${groupId}`);
}

export async function setMemberRoleAction(
  groupId: string,
  userId: string,
  role: Extract<GroupRole, "admin" | "member">,
): Promise<ActionState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_role", {
    p_group_id: groupId,
    p_user_id: userId,
    p_role: role,
  });

  if (error) return { error: "Không thể đổi vai trò thành viên." };

  revalidatePath(`/groups/${groupId}/members`);
  return { success: "Đã cập nhật vai trò." };
}

export async function removeMemberAction(
  groupId: string,
  userId: string,
): Promise<ActionState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_group_member", {
    p_group_id: groupId,
    p_user_id: userId,
  });

  if (error) return { error: "Không thể xóa thành viên." };

  revalidatePath(`/groups/${groupId}/members`);
  return { success: "Đã xóa thành viên khỏi nhóm." };
}

export async function transferOwnershipAction(
  groupId: string,
  userId: string,
): Promise<ActionState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("transfer_group_ownership", {
    p_group_id: groupId,
    p_new_owner_id: userId,
  });

  if (error) return { error: "Không thể chuyển quyền Owner." };

  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/members`);
  return { success: "Đã chuyển quyền Owner." };
}

export async function leaveGroupAction(groupId: string): Promise<ActionState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_group", {
    p_group_id: groupId,
  });

  if (error) return { error: "Không thể rời nhóm. Owner cần chuyển quyền trước." };

  revalidatePath("/groups");
  revalidatePath("/home");
  redirect("/groups");
}

export async function deleteGroupAction(groupId: string): Promise<ActionState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) return { error: "Không thể xóa nhóm." };

  revalidatePath("/groups");
  redirect("/groups");
}

export async function updateGroupAvatarAction(
  groupId: string,
  avatarUrl: string,
): Promise<ActionState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({ avatar_url: avatarUrl })
    .eq("id", groupId);

  if (error) return { error: "Không thể lưu ảnh nhóm." };

  revalidatePath(`/groups/${groupId}`);
  return { success: "Đã cập nhật ảnh nhóm." };
}
