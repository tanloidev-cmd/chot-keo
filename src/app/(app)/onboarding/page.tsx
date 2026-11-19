import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Link2, UsersRound } from "lucide-react";

import { CreateGroupForm } from "@/components/groups/create-group-form";
import { JoinByLinkForm } from "@/components/groups/join-by-link-form";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMyGroups } from "@/lib/queries";

export const metadata: Metadata = { title: "Bắt đầu" };

export default async function OnboardingPage() {
  const groups = await getMyGroups();
  if (groups.length > 0) redirect("/home");

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Bắt đầu với một nhóm"
        description="Tạo nhóm mới hoặc mở link mời bạn nhận được."
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UsersRound />
            </div>
            <CardTitle>Tạo nhóm đầu tiên</CardTitle>
            <CardDescription>
              Bạn sẽ là Owner. Mời bạn bè bằng link sau khi tạo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateGroupForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Link2 />
            </div>
            <CardTitle>Tham gia bằng link mời</CardTitle>
            <CardDescription>
              Dán link mời hoặc mã mời để vào nhóm có sẵn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JoinByLinkForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
