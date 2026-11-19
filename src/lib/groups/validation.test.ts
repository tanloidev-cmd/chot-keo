import { describe, expect, it } from "vitest";

import { parseGroupFormData } from "./validation";

function formData(entries: Record<string, string>) {
  const data = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }

  return data;
}

describe("parseGroupFormData", () => {
  it("accepts a submission without the optional rules textarea", () => {
    // The create form has no `rules` field; reading it directly passed `null`
    // to zod and failed with "Invalid input: expected string, received null".
    const result = parseGroupFormData(
      formData({ name: "Hội bạn cấp 3", timezone: "Asia/Ho_Chi_Minh" }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Hội bạn cấp 3");
      expect(result.data.rules).toBe("");
      expect(result.data.description).toBe("");
    }
  });

  it("defaults the timezone when the field is missing", () => {
    const result = parseGroupFormData(formData({ name: "Nhóm" }));

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.timezone).toBe("Asia/Ho_Chi_Minh");
  });

  it("returns an error on the name field", () => {
    const result = parseGroupFormData(formData({ name: "   " }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toEqual({ name: "Nhập tên nhóm" });
    }
  });

  it("returns an error on the description field", () => {
    const result = parseGroupFormData(
      formData({ name: "Nhóm", description: "a".repeat(501) }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toEqual({
        description: "Mô tả tối đa 500 ký tự",
      });
    }
  });
});
