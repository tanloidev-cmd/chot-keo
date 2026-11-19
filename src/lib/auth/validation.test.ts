import { describe, expect, it } from "vitest";

import {
  AUTH_FIELD_MESSAGES,
  displayNameIssue,
  isValidVietnamesePhone,
  passwordIssue,
  validateLoginInput,
  validateRecoveryInput,
  validateRegisterInput,
} from "./validation";

describe("displayNameIssue", () => {
  it("requires a name", () => {
    expect(displayNameIssue("")).toBe(AUTH_FIELD_MESSAGES.displayNameRequired);
    expect(displayNameIssue("   ")).toBe(
      AUTH_FIELD_MESSAGES.displayNameRequired,
    );
  });

  it("rejects names over 60 characters", () => {
    expect(displayNameIssue("a".repeat(61))).toBe(
      AUTH_FIELD_MESSAGES.displayNameTooLong,
    );
    expect(displayNameIssue("a".repeat(60))).toBeNull();
  });

  it("accepts a normal name", () => {
    expect(displayNameIssue("  Minh  ")).toBeNull();
  });
});

describe("passwordIssue", () => {
  it("requires at least 8 characters", () => {
    expect(passwordIssue("abc1234")).toBe(AUTH_FIELD_MESSAGES.passwordMin);
    expect(passwordIssue("")).toBe(AUTH_FIELD_MESSAGES.passwordMin);
  });

  it("requires letters and numbers", () => {
    expect(passwordIssue("12345678")).toBe(AUTH_FIELD_MESSAGES.passwordLetter);
    expect(passwordIssue("abcdefgh")).toBe(AUTH_FIELD_MESSAGES.passwordNumber);
  });

  it("rejects passwords over 72 characters", () => {
    expect(passwordIssue(`a1${"b".repeat(71)}`)).toBe(
      AUTH_FIELD_MESSAGES.passwordMax,
    );
  });

  it("accepts a valid password", () => {
    expect(passwordIssue("abc12345")).toBeNull();
  });
});

describe("isValidVietnamesePhone", () => {
  it("accepts local and international formats", () => {
    expect(isValidVietnamesePhone("0912345678")).toBe(true);
    expect(isValidVietnamesePhone("0912 345 678")).toBe(true);
    expect(isValidVietnamesePhone("+84 912 345 678")).toBe(true);
    expect(isValidVietnamesePhone("84912345678")).toBe(true);
    expect(isValidVietnamesePhone("02438261234")).toBe(true);
  });

  it("rejects invalid numbers", () => {
    expect(isValidVietnamesePhone("")).toBe(false);
    expect(isValidVietnamesePhone("0912")).toBe(false);
    expect(isValidVietnamesePhone("+1 415 555 2671")).toBe(false);
    expect(isValidVietnamesePhone("abc")).toBe(false);
  });
});

describe("validateRegisterInput", () => {
  it("reports only the invalid field", () => {
    expect(
      validateRegisterInput({
        displayName: "Minh",
        phone: "0912345678",
        password: "abcdefgh",
      }),
    ).toEqual({ password: AUTH_FIELD_MESSAGES.passwordNumber });
  });

  it("returns no errors for valid input", () => {
    expect(
      validateRegisterInput({
        displayName: "Minh",
        phone: "0912 345 678",
        password: "abc12345",
      }),
    ).toEqual({});
  });

  it("reports every invalid field at once", () => {
    expect(
      validateRegisterInput({
        displayName: " ",
        phone: "123",
        password: "abc",
      }),
    ).toEqual({
      displayName: AUTH_FIELD_MESSAGES.displayNameRequired,
      phone: AUTH_FIELD_MESSAGES.phoneInvalid,
      password: AUTH_FIELD_MESSAGES.passwordMin,
    });
  });
});

describe("validateLoginInput", () => {
  it("rejects an invalid phone and an empty password", () => {
    expect(validateLoginInput({ phone: "123", password: "" })).toEqual({
      phone: AUTH_FIELD_MESSAGES.phoneInvalid,
      password: AUTH_FIELD_MESSAGES.passwordRequired,
    });
  });

  it("accepts a valid phone with any non-empty password", () => {
    expect(
      validateLoginInput({ phone: "0912 345 678", password: "abc" }),
    ).toEqual({});
  });
});

describe("validateRecoveryInput", () => {
  it("applies the password policy to the new password", () => {
    expect(
      validateRecoveryInput({
        phone: "0912345678",
        code: "ABCD-EFGH",
        password: "abc",
      }),
    ).toEqual({ password: AUTH_FIELD_MESSAGES.passwordMin });
  });

  it("flags a short recovery code", () => {
    expect(
      validateRecoveryInput({
        phone: "0912345678",
        code: "123",
        password: "abc12345",
      }),
    ).toEqual({ code: AUTH_FIELD_MESSAGES.recoveryCodeMin });
  });
});
