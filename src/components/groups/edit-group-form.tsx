"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Pencil } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateGroupAction, type ActionState } from "@/lib/actions/groups";
import type { Group } from "@/lib/types";

const initialState: ActionState = {};

export function EditGroupForm({ group }: { group: Group }) {
  const [state, formAction] = useActionState(updateGroupAction, initialState);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{group.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {group.description || "Chưa có mô tả"}
            </p>
            {group.rules ? (
              <p className="mt-2 whitespace-pre-line rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                Quy tắc: {group.rules}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            <Pencil className="size-3.5" />
            Sửa
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-xl border bg-card p-4">
      <input type="hidden" name="groupId" value={group.id} />
      {state.error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="group-name">Tên nhóm</Label>
        <Input
          id="group-name"
          name="name"
          defaultValue={group.name}
          maxLength={80}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="group-description">Mô tả</Label>
        <Textarea
          id="group-description"
          name="description"
          defaultValue={group.description ?? ""}
          maxLength={500}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="group-rules">Quy tắc nhóm (tùy chọn)</Label>
        <Textarea
          id="group-rules"
          name="rules"
          defaultValue={group.rules ?? ""}
          maxLength={1000}
          rows={3}
          placeholder="Ví dụ: báo bận trước 24h, không réo muộn..."
        />
      </div>
      <input type="hidden" name="timezone" value={group.timezone} />
      <div className="flex gap-2">
        <SubmitButton>Lưu</SubmitButton>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm text-muted-foreground"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
