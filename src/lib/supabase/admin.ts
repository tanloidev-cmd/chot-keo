import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env.server";

let cached: SupabaseClient | null = null;

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

  // `rpc` must stay a method call: the client implementation reads `this.rest`,
  // so extracting it into a local function throws
  // "Cannot read properties of undefined (reading 'rest')".
  const { data, error } = await admin.rpc(name, args);

  return {
    data: (data ?? null) as T | null,
    error: error ? { message: error.message } : null,
  };
}
