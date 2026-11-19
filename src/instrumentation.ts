/**
 * Runs once when the server process starts, before the first request.
 *
 * Vercel refuses to create a `TZ` environment variable (the platform reserves
 * that name and runs in UTC), so the deployment timezone is applied here from
 * `APP_TZ` instead. Edge runtimes do not expose a writable `process.env`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { applyRuntimeTimezone } = await import("@/lib/timezone");
  applyRuntimeTimezone();
  console.info(`[timezone] process TZ = ${process.env.TZ}`);
}
