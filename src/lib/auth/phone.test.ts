import { describe, expect, it } from "vitest";

import {
  formatPhone,
  normalizePhone,
  phoneToSyntheticEmail,
} from "./phone";

describe("normalizePhone", () => {
  it("normalizes Vietnamese local numbers", () => {
    expect(normalizePhone("0912345678")).toBe("+84912345678");
    expect(normalizePhone("0912 345 678")).toBe("+84912345678");
    expect(normalizePhone("+84 912 345 678")).toBe("+84912345678");
    expect(normalizePhone("84912345678")).toBe("+84912345678");
  });

  it("rejects invalid numbers", () => {
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("+1 415 555 2671")).toBeNull();
  });
});

describe("formatPhone", () => {
  it("formats E.164 for display", () => {
    expect(formatPhone("+84912345678")).toBe("0912345678");
    expect(formatPhone(null)).toBe("Chưa cập nhật");
  });
});

describe("phoneToSyntheticEmail", () => {
  it("creates a non-deliverable email from the digits", () => {
    expect(phoneToSyntheticEmail("+84912345678")).toBe(
      "84912345678@phone.chotkeo.invalid",
    );
  });
});
