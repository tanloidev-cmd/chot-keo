import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  collectFieldErrors,
  firstFieldWithError,
  hasFieldErrors,
  visibleFieldErrors,
} from "./field-errors";

const schema = z.object({
  name: z.string().min(1, "Nhập tên"),
  description: z.string().max(5, "Mô tả quá dài"),
  note: z.string().max(3, "Ghi chú quá dài"),
});

describe("collectFieldErrors", () => {
  it("keeps the first message per known field", () => {
    const parsed = schema.safeParse({ name: "", description: "123456", note: "" });

    if (parsed.success) throw new Error("expected a failure");

    expect(collectFieldErrors(parsed.error, ["name", "description"])).toEqual({
      name: "Nhập tên",
      description: "Mô tả quá dài",
    });
  });

  it("ignores fields the form does not render", () => {
    const parsed = schema.safeParse({ name: "", description: "", note: "1234" });

    if (parsed.success) throw new Error("expected a failure");

    expect(collectFieldErrors(parsed.error, ["name"])).toEqual({
      name: "Nhập tên",
    });
  });
});

describe("firstFieldWithError", () => {
  it("follows the visual field order", () => {
    expect(firstFieldWithError({ b: "x" }, ["a", "b", "c"])).toBe("b");
    expect(firstFieldWithError({}, ["a"])).toBeNull();
  });
});

describe("visibleFieldErrors", () => {
  it("prefers client errors and hides edited fields", () => {
    expect(
      visibleFieldErrors({ name: "client" }, { name: "server" }, []),
    ).toEqual({ name: "client" });

    expect(visibleFieldErrors(null, { name: "server" }, ["name"])).toEqual({});
    expect(visibleFieldErrors(null, { name: "server" }, [])).toEqual({
      name: "server",
    });
  });

  it("returns nothing when there is no source", () => {
    expect(visibleFieldErrors(null, undefined, [])).toEqual({});
  });
});

describe("hasFieldErrors", () => {
  it("detects any message", () => {
    expect(hasFieldErrors({ name: undefined })).toBe(false);
    expect(hasFieldErrors({ name: "x" })).toBe(true);
  });
});
