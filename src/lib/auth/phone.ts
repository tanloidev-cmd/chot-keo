import { parsePhoneNumberFromString } from "libphonenumber-js";

const VN_COUNTRY_CODE = "+84";

/**
 * Normalize a Vietnamese mobile number to E.164. Returns null for invalid input.
 * Accepts 0912345678, +84912345678, 84912345678, with spaces/dots/dashes.
 */
export function normalizePhone(input: string): string | null {
  if (!input) return null;

  const compact = input.replace(/[\s().-]/g, "");
  let candidate = compact;

  if (candidate.startsWith("0")) {
    candidate = `${VN_COUNTRY_CODE}${candidate.slice(1)}`;
  } else if (candidate.startsWith("84") && !candidate.startsWith("+")) {
    candidate = `+${candidate}`;
  } else if (!candidate.startsWith("+")) {
    candidate = `${VN_COUNTRY_CODE}${candidate}`;
  }

  const parsed = parsePhoneNumberFromString(candidate, "VN");

  if (!parsed || !parsed.isValid() || parsed.country !== "VN") {
    return null;
  }

  return parsed.number;
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "Chưa cập nhật";

  if (phone.startsWith(VN_COUNTRY_CODE)) {
    return `0${phone.slice(VN_COUNTRY_CODE.length)}`;
  }

  return phone;
}

/**
 * Phone is the user-facing username. Supabase Auth stores either a real
 * phone identity or a synthetic, non-deliverable email when the project
 * cannot enable phone auth without an SMS provider.
 */
export function phoneToSyntheticEmail(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const domain =
    process.env.AUTH_PHONE_EMAIL_DOMAIN ?? "phone.chotkeo.invalid";

  return `${digits}@${domain}`;
}

export function authIdentifierForPhone(phone: string) {
  if ((process.env.AUTH_IDENTIFIER_MODE ?? "email") === "phone") {
    return { phone };
  }

  return { email: phoneToSyntheticEmail(phone) };
}
