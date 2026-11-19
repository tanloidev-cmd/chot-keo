"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { value: "overview", label: "Tổng quan", path: "" },
  { value: "calendar", label: "Lịch", path: "/calendar" },
  { value: "meetups", label: "Kèo", path: "/meetups" },
  { value: "members", label: "Thành viên", path: "/members" },
  { value: "settings", label: "Cài đặt", path: "/settings" },
];

export function GroupTabs({ groupId }: { groupId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const base = `/groups/${groupId}`;

  const active =
    tabs.find((tab) => tab.path && pathname.startsWith(`${base}${tab.path}`))
      ?.value ?? "overview";

  return (
    <Tabs
      value={active}
      onValueChange={(value) => {
        const tab = tabs.find((item) => item.value === value);
        router.push(`${base}${tab?.path ?? ""}`);
      }}
    >
      <div className="overflow-x-auto pb-1">
        <TabsList className="w-max">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
