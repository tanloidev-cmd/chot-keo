/**
 * Field rules shared by the auth server actions and their client forms.
 *
 * This module must stay free of Node-only imports so the forms can validate on
 * the client and show the same messages the server would return.
 */

import type { FieldErrors } from "@/lib/forms/field-errors";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const DISPLAY_NAME_MAX_LENGTH = 60;

export type AuthFormField = "displayName" | "phone" | "password";

export const LOGIN_FIELDS = ["phone", "password"] as const;
export const RECOVERY_FIELDS = ["phone", "code", "password"] as const;

export const AUTH_FIELD_MESSAGES = {
  displayNameRequired: "Nhập tên hiển thị",
  displayNameTooLong: "Tên tối đa 60 ký tự",
  phoneRequired: "Nhập số điện thoại",
  phoneInvalid: "Số điện thoại Việt Nam không hợp lệ",
  recoveryCodeRequired: "Nhập mã khôi phục",
  recoveryCodeMin: "Mã khôi phục không hợp lệ",
  passwordRequired: "Nhập mật khẩu",
  passwordMin: "Mật khẩu cần ít nhất 8 ký tự",
  passwordMax: "Mật khẩu tối đa 72 ký tự",
  passwordLetter: "Mật khẩu cần có chữ",
  passwordNumber: "Mật khẩu cần có số",
} as const;

export function displayNameIssue(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length < 1) return AUTH_FIELD_MESSAGES.displayNameRequired;
  if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    return AUTH_FIELD_MESSAGES.displayNameTooLong;
  }

  return null;
}

export function passwordIssue(value: string): string | null {
  if (value.length < PASSWORD_MIN_LENGTH) return AUTH_FIELD_MESSAGES.passwordMin;
  if (value.length > PASSWORD_MAX_LENGTH) return AUTH_FIELD_MESSAGES.passwordMax;
  if (!/[A-Za-z]/.test(value)) return AUTH_FIELD_MESSAGES.passwordLetter;
  if (!/[0-9]/.test(value)) return AUTH_FIELD_MESSAGES.passwordNumber;

  return null;
}

/**
 * Cheap Vietnamese phone check for instant client feedback. The server still
 * normalizes with libphonenumber-js and returns an inline error when it
 * disagrees, so this only needs to catch the common mistakes.
 */
export function isValidVietnamesePhone(value: string): boolean {
  const compact = value.replace(/[\s().-]/g, "");

  if (!compact) return false;

  const local = compact.startsWith("+84")
    ? `0${compact.slice(3)}`
    : compact.startsWith("84")
      ? `0${compact.slice(2)}`
      : compact;

  // Mobile (03/05/07/08/09 + 8 digits) or landline (02 + 9 digits).
  return /^0(?:2\d{9}|[35789]\d{8})$/.test(local);
}

export function validateRegisterInput(input: {
  displayName: string;
  phone: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  const displayName = displayNameIssue(input.displayName);
  if (displayName) errors.displayName = displayName;

  if (!input.phone.trim()) {
    errors.phone = AUTH_FIELD_MESSAGES.phoneRequired;
  } else if (!isValidVietnamesePhone(input.phone)) {
    errors.phone = AUTH_FIELD_MESSAGES.phoneInvalid;
  }

  const password = passwordIssue(input.password);
  if (password) errors.password = password;

  return errors;
}

export function validateLoginInput(input: {
  phone: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.phone.trim()) {
    errors.phone = AUTH_FIELD_MESSAGES.phoneRequired;
  } else if (!isValidVietnamesePhone(input.phone)) {
    errors.phone = AUTH_FIELD_MESSAGES.phoneInvalid;
  }

  if (!input.password) errors.password = AUTH_FIELD_MESSAGES.passwordRequired;

  return errors;
}

export function validateRecoveryInput(input: {
  phone: string;
  code: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.phone.trim()) {
    errors.phone = AUTH_FIELD_MESSAGES.phoneRequired;
  } else if (!isValidVietnamesePhone(input.phone)) {
    errors.phone = AUTH_FIELD_MESSAGES.phoneInvalid;
  }

  if (!input.code.trim()) {
    errors.code = AUTH_FIELD_MESSAGES.recoveryCodeRequired;
  } else if (input.code.trim().length < 8) {
    errors.code = AUTH_FIELD_MESSAGES.recoveryCodeMin;
  }

  // The new password follows the full password policy, not just "not empty".
  const password = passwordIssue(input.password);
  if (password) errors.password = password;

  return errors;
}
