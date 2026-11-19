"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  authIdentifierForPhone,
  normalizePhone,
} from "@/lib/auth/phone";
import {
  generateRecoveryCode,
  hashRecoveryCode,
} from "@/lib/auth/recovery";
import { requireUser } from "@/lib/auth/session";
import { adminRpc, createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  recoveryCode?: string;
  success?: string;
};

const phoneField = z
  .string()
  .min(8, "Nhập số điện thoại")
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message: "Số điện thoại Việt Nam không hợp lệ",
      });
      return z.NEVER;
    }
    return normalized;
  });

const passwordField = z
  .string()
  .min(8, "Mật khẩu cần ít nhất 8 ký tự")
  .max(72, "Mật khẩu tối đa 72 ký tự")
  .regex(/[A-Za-z]/, "Mật khẩu cần có chữ")
  .regex(/[0-9]/, "Mật khẩu cần có số");

const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Nhập tên hiển thị")
    .max(60, "Tên tối đa 60 ký tự"),
  phone: phoneField,
  password: passwordField,
});

const loginSchema = z.object({
  phone: phoneField,
  password: z.string().min(1, "Nhập mật khẩu"),
});

const recoverySchema = z.object({
  phone: phoneField,
  code: z.string().min(8, "Nhập mã khôi phục"),
  password: passwordField,
});

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/home";
  }
  return next;
}

async function verifyTurnstile(token: FormDataEntryValue | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;

  if (typeof token !== "string" || !token) return false;

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
        cache: "no-store",
      },
    );
    const result = (await response.json()) as { success?: boolean };
    return Boolean(result.success);
  } catch {
    return false;
  }
}

async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
) {
  try {
    const { data, error } = await adminRpc<boolean>("consume_auth_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
}

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already") || normalized.includes("registered")) {
    return "Số điện thoại này đã được đăng ký. Hãy đăng nhập.";
  }

  if (normalized.includes("rate") || normalized.includes("too many")) {
    return "Bạn thao tác quá nhanh. Thử lại sau ít phút.";
  }

  if (normalized.includes("password")) {
    return "Mật khẩu chưa đúng hoặc quá yếu.";
  }

  return "Không thể xử lý yêu cầu. Vui lòng thử lại.";
}

export async function registerAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ" };
  }

  if (!(await verifyTurnstile(formData.get("turnstileToken")))) {
    return { error: "Xác thực chống spam thất bại. Thử lại." };
  }

  if (
    !(await consumeRateLimit(`register:${parsed.data.phone}`, 5, 60 * 60))
  ) {
    return { error: "Bạn đã thử quá nhiều lần. Thử lại sau." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      error:
        "Máy chủ chưa cấu hình SUPABASE_SECRET_KEY. Xem RUNBOOK.md để thiết lập.",
    };
  }

  const identifier = authIdentifierForPhone(parsed.data.phone);

  const { data: created, error } = await admin.auth.admin.createUser({
    ...identifier,
    password: parsed.data.password,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: { display_name: parsed.data.displayName },
  });

  if (error || !created.user) {
    return { error: authErrorMessage(error?.message ?? "create failed") };
  }

  const recoveryCode = generateRecoveryCode();
  const { error: recoveryError } = await adminRpc(
    "create_account_recovery",
    {
      p_user_id: created.user.id,
      p_phone: parsed.data.phone,
      p_hash: hashRecoveryCode(recoveryCode),
    },
  );

  if (recoveryError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return {
      error:
        "Không thể tạo mã khôi phục. Thử lại hoặc kiểm tra migration/RLS.",
    };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    ...identifier,
    password: parsed.data.password,
  });

  if (signInError) {
    return {
      error:
        "Tài khoản đã tạo nhưng chưa đăng nhập được. Hãy thử đăng nhập lại.",
    };
  }

  return { recoveryCode };
}

export async function loginAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ" };
  }

  if (
    !(await consumeRateLimit(`login:${parsed.data.phone}`, 20, 5 * 60))
  ) {
    return { error: "Bạn đã thử quá nhiều lần. Thử lại sau." };
  }

  if (!(await verifyTurnstile(formData.get("turnstileToken")))) {
    return { error: "Xác thực chống spam thất bại. Thử lại." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    ...authIdentifierForPhone(parsed.data.phone),
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Số điện thoại hoặc mật khẩu không đúng." };
  }

  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resetPasswordWithCodeAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = recoverySchema.safeParse({
    phone: formData.get("phone"),
    code: formData.get("code"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ" };
  }

  if (
    !(await consumeRateLimit(`recovery:${parsed.data.phone}`, 5, 15 * 60))
  ) {
    return { error: "Bạn đã thử quá nhiều lần. Thử lại sau 15 phút." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      error:
        "Máy chủ chưa cấu hình SUPABASE_SECRET_KEY. Xem RUNBOOK.md để thiết lập.",
    };
  }

  const { data: userId, error: verifyError } = await adminRpc<string>(
    "verify_account_recovery",
    {
      p_phone: parsed.data.phone,
      p_hash: hashRecoveryCode(parsed.data.code),
    },
  );

  if (verifyError || !userId) {
    return {
      error:
        "Số điện thoại hoặc mã khôi phục không đúng, hoặc đã bị tạm khóa.",
    };
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    userId as string,
    { password: parsed.data.password },
  );

  if (updateError) {
    return { error: authErrorMessage(updateError.message) };
  }

  const newCode = generateRecoveryCode();
  await adminRpc("rotate_account_recovery", {
    p_user_id: userId,
    p_hash: hashRecoveryCode(newCode),
  });

  return { recoveryCode: newCode };
}

export async function changePasswordAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (!currentPassword) return { error: "Nhập mật khẩu hiện tại" };

  const parsed = passwordField.safeParse(newPassword);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Mật khẩu quá yếu" };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const identifier = user.phone
    ? { phone: user.phone }
    : { email: user.email ?? "" };

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    ...identifier,
    password: currentPassword,
  });

  if (reauthError) {
    return { error: "Mật khẩu hiện tại không đúng." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: authErrorMessage(error.message) };

  return { success: "Đã đổi mật khẩu." };
}

export async function updateProfileAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "Asia/Ho_Chi_Minh");

  if (displayName.length < 1 || displayName.length > 60) {
    return { error: "Tên hiển thị cần từ 1 đến 60 ký tự." };
  }

  if (timezone.length > 80) {
    return { error: "Múi giờ không hợp lệ." };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, timezone })
    .eq("id", user.id);

  if (error) return { error: "Không thể cập nhật hồ sơ." };

  revalidatePath("/profile");
  revalidatePath("/home");
  return { success: "Đã cập nhật hồ sơ." };
}

export async function updateAvatarUrlAction(avatarUrl: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) return { error: "Không thể lưu ảnh đại diện." };

  revalidatePath("/profile");
  revalidatePath("/home");
  return { success: true };
}

export async function regenerateRecoveryCodeAction(): Promise<AuthState> {
  await requireUser();
  const supabase = await createClient();
  const code = generateRecoveryCode();
  const { error } = await supabase.rpc("rotate_my_recovery_code", {
    p_hash: hashRecoveryCode(code),
  });

  if (error) return { error: "Không thể tạo mã khôi phục mới." };

  revalidatePath("/profile");
  return { recoveryCode: code };
}
