import { z } from "zod";

import { publicEnv } from "@/lib/env";

const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().optional().default(""),
  TURNSTILE_SECRET_KEY: z.string().optional().default(""),
});

export function getServerEnv() {
  const server = serverSchema.parse({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  });

  return { ...publicEnv, ...server };
}

export function hasServiceRole() {
  return Boolean(process.env.SUPABASE_SECRET_KEY);
}
