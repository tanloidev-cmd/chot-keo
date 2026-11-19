import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => {
  /**
   * Mirrors the real client: `rpc` is a prototype method that reads `this.rest`,
   * so calling an extracted reference throws
   * "Cannot read properties of undefined (reading 'rest')".
   */
  class FakeSupabaseClient {
    rest = {
      rpc: async (name: string, args?: Record<string, unknown>) => {
        if (name === "failing_rpc") {
          return { data: null, error: { message: "permission denied" } };
        }

        return { data: { name, args: args ?? null }, error: null };
      },
    };

    rpc(name: string, args?: Record<string, unknown>) {
      return this.rest.rpc(name, args);
    }
  }

  return {
    createClient: () => new FakeSupabaseClient(),
  };
});

const originalSecret = process.env.SUPABASE_SECRET_KEY;

beforeEach(() => {
  vi.resetModules();
  process.env.SUPABASE_SECRET_KEY = "test-service-role-key";
});

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.SUPABASE_SECRET_KEY;
  } else {
    process.env.SUPABASE_SECRET_KEY = originalSecret;
  }
});

describe("adminRpc", () => {
  it("calls rpc bound to the client and returns its data", async () => {
    const { adminRpc } = await import("./admin");

    const result = await adminRpc("create_account_recovery", {
      p_user_id: "user-1",
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      name: "create_account_recovery",
      args: { p_user_id: "user-1" },
    });
  });

  it("passes through rpc errors as a message", async () => {
    const { adminRpc } = await import("./admin");

    const result = await adminRpc("failing_rpc");

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: "permission denied" });
  });

  it("fails early when the service role key is missing", async () => {
    delete process.env.SUPABASE_SECRET_KEY;
    const { adminRpc } = await import("./admin");

    await expect(adminRpc("create_account_recovery")).rejects.toThrow(
      /SUPABASE_SECRET_KEY/,
    );
  });
});
