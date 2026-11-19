import { describe, expect, it } from "vitest";

import {
  generateRecoveryCode,
  hashRecoveryCode,
  normalizeRecoveryCode,
} from "./recovery";

describe("recovery codes", () => {
  it("generates grouped 16-character codes", () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  });

  it("normalizes separators and case", () => {
    expect(normalizeRecoveryCode("abcd-efgh 1234")).toBe("ABCDEFGH1234");
  });

  it("hashes deterministically and case-insensitively", () => {
    expect(hashRecoveryCode("abcd-efgh-1234-5678")).toBe(
      hashRecoveryCode("ABCD EFGH 1234 5678"),
    );
    expect(hashRecoveryCode("abcd-efgh-1234-5678")).toMatch(/^[0-9a-f]{64}$/);
  });
});
