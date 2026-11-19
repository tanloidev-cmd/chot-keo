import { NextResponse } from "next/server";

import { hasSupabaseConfig } from "@/lib/env";
import { hasServiceRole } from "@/lib/env.server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "chot-keo",
    supabaseConfigured: hasSupabaseConfig(),
    serviceRoleConfigured: hasServiceRole(),
    timestamp: new Date().toISOString(),
  });
}
