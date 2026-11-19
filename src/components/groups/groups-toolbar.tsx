"use client";

import { useState } from "react";
import { Link2, Plus } from "lucide-react";

import { CreateGroupForm } from "@/components/groups/create-group-form";
import { JoinByLinkForm } from "@/components/groups/join-by-link-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function GroupsToolbar() {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <div className="flex gap-2">
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus />
            Tạo nhóm
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo nhóm mới</DialogTitle>
            <DialogDescription>
              Bạn sẽ là Owner và có thể mời thành viên bằng link.
            </DialogDescription>
          </DialogHeader>
          <CreateGroupForm />
        </DialogContent>
      </Dialog>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Link2 />
            Tham gia
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tham gia nhóm</DialogTitle>
            <DialogDescription>
              Dán link mời hoặc mã mời bạn nhận được.
            </DialogDescription>
          </DialogHeader>
          <JoinByLinkForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}
