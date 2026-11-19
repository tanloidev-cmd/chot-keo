import { notFound } from "next/navigation";

import { EditMeetupForm } from "@/components/meetups/edit-meetup-form";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getGroup, getMeetupBundle } from "@/lib/queries";

export default async function EditMeetupPage(
  props: PageProps<"/meetups/[id]/edit">,
) {
  const { id } = await props.params;
  const [bundle, user] = await Promise.all([getMeetupBundle(id), getCurrentUser()]);
  if (!bundle || !user) notFound();

  const group = await getGroup(bundle.meetup.group_id);
  const isHost = bundle.hosts.some((host) => host.user_id === user.id);
  const canManage =
    group?.my_role === "owner" ||
    group?.my_role === "admin" ||
    bundle.meetup.created_by === user.id ||
    isHost;

  if (!canManage) notFound();

  return (
    <div>
      <PageHeader
        title="Chỉnh sửa kèo"
        description={bundle.meetup.title}
        backHref={`/meetups/${id}`}
      />
      <EditMeetupForm
        meetup={bundle.meetup}
        timeOptions={bundle.timeOptions}
        venueOptions={bundle.venueOptions}
      />
    </div>
  );
}
