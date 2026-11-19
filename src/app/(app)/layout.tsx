import { AppShell } from "@/components/app-shell";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { getCurrentProfile } from "@/lib/auth/session";
import { getUnreadNotificationCount } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, phone } = await getCurrentProfile();
  const supabase = await createClient();

  await supabase.rpc("generate_my_reminders").then(() => null);

  const unread = await getUnreadNotificationCount();

  return (
    <>
      <AppShell profile={profile} phone={phone} unread={unread}>
        {children}
      </AppShell>
      <RealtimeRefresh
        tables={["notifications"]}
        filter={`user_id=eq.${user.id}`}
      />
    </>
  );
}
