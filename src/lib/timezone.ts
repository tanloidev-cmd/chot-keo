/**
 * The product targets Vietnam, and calendar keys / weekday labels are computed
 * from the server's local time. Deployments must therefore run in this zone.
 */
export const APP_TIMEZONE = "Asia/Ho_Chi_Minh";

/**
 * Vercel reserves the `TZ` variable name and runs functions in UTC, so
 * `TZ` cannot be added in the project settings. `APP_TZ` is the replacement:
 * when it is set, it wins; otherwise a non-UTC `TZ` (e.g. from `.env.local`)
 * is kept, and UTC means "not configured".
 */
export function resolveRuntimeTimezone(
  appTimezone = process.env.APP_TZ,
  timezone = process.env.TZ,
): string {
  if (appTimezone) return appTimezone;
  if (timezone && timezone !== "UTC") return timezone;

  return APP_TIMEZONE;
}

/**
 * Must run before any date is rendered; `src/instrumentation.ts` calls it once
 * per server process. Node applies the change to `Date`/`Intl` immediately.
 */
export function applyRuntimeTimezone() {
  process.env.TZ = resolveRuntimeTimezone();
}
