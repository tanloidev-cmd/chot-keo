import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { APP_TIMEZONE, applyRuntimeTimezone, resolveRuntimeTimezone } from "./timezone";

const originalTz = process.env.TZ;
const originalAppTz = process.env.APP_TZ;

beforeEach(() => {
  delete process.env.APP_TZ;
  delete process.env.TZ;
});

afterEach(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;

  if (originalAppTz === undefined) delete process.env.APP_TZ;
  else process.env.APP_TZ = originalAppTz;
});

describe("resolveRuntimeTimezone", () => {
  it("prefers APP_TZ", () => {
    expect(resolveRuntimeTimezone("Asia/Tokyo", "UTC")).toBe("Asia/Tokyo");
  });

  it("keeps a non-UTC TZ such as the local .env.local value", () => {
    expect(resolveRuntimeTimezone(undefined, "Asia/Ho_Chi_Minh")).toBe(
      "Asia/Ho_Chi_Minh",
    );
  });

  it("treats the Vercel UTC default as unset", () => {
    expect(resolveRuntimeTimezone(undefined, "UTC")).toBe(APP_TIMEZONE);
  });

  it("falls back to the product timezone", () => {
    expect(resolveRuntimeTimezone(undefined, undefined)).toBe(APP_TIMEZONE);
  });
});

describe("applyRuntimeTimezone", () => {
  it("writes the resolved zone to process.env.TZ", () => {
    process.env.TZ = "UTC";
    process.env.APP_TZ = "Asia/Bangkok";

    applyRuntimeTimezone();

    expect(process.env.TZ).toBe("Asia/Bangkok");
  });

  it("defaults to Asia/Ho_Chi_Minh on a plain UTC runtime", () => {
    process.env.TZ = "UTC";

    applyRuntimeTimezone();

    expect(process.env.TZ).toBe(APP_TIMEZONE);
  });
});
