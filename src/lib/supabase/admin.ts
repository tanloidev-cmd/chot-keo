import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env.server";

let cached: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
  if (cached) return cached;

  const env = getServerEnv();

  if (!env.SUPABASE_SECRET_KEY) {
    throw new Error(
      "SUPABASE_SECRET_KEY is missing. Add it to .env.local to enable account operations.",
    );
  }

  cached = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );

  return cached;
}

export type AdminRpcResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

/**
 * Untyped database projects need a tiny wrapper so RPC calls stay readable
 * before `supabase gen types` is run for a real project.
 */
export async function adminRpc<T = unknown>(
  name: string,
  args?: Record<string, unknown>,
): Promise<AdminRpcResult<T>> {
  const admin = createAdminClient();
  const rpc = admin.rpc as unknown as (
    fn: string,
    params?: Record<string, unknown>,
  ) => Promise<AdminRpcResult<T>>;

  return rpc(name, args);
}
