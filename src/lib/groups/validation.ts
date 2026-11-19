import { z } from "zod";

import {
  collectFieldErrors,
  type FieldErrors,
} from "@/lib/forms/field-errors";

export const GROUP_FIELDS = [
  "name",
  "description",
  "rules",
  "timezone",
] as const;

/**
 * Optional textareas can be absent from a FormData submission (they are not
 * rendered in every form), so every value is normalized to a string first.
 * Using `formData.get()` directly hands zod `null` and fails with
 * "Invalid input: expected string, received null".
 */
export const groupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nhập tên nhóm")
    .max(80, "Tên tối đa 80 ký tự"),
  description: z.string().trim().max(500, "Mô tả tối đa 500 ký tự"),
  rules: z.string().trim().max(1000, "Quy tắc tối đa 1000 ký tự"),
  timezone: z
    .string()
    .trim()
    .min(1, "Múi giờ không hợp lệ")
    .max(80, "Múi giờ không hợp lệ"),
});

export type GroupFormResult =
  | { success: true; data: z.infer<typeof groupSchema> }
  | { success: false; fieldErrors: FieldErrors };

export function parseGroupFormData(formData: FormData): GroupFormResult {
  const parsed = groupSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    rules: String(formData.get("rules") ?? ""),
    timezone: String(formData.get("timezone") ?? "") || "Asia/Ho_Chi_Minh",
  });

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: collectFieldErrors(parsed.error, GROUP_FIELDS),
    };
  }

  return { success: true, data: parsed.data };
}
