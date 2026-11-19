"use client";

import { useActionState } from "react";
import { AlertCircle, Plus } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createGroupAction,
  type ActionState,
} from "@/lib/actions/groups";

const initialState: ActionState = {};

export function CreateGroupForm() {
  const [state, formAction] = useActionState(createGroupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Tên nhóm</Label>
        <Input
          id="name"
          name="name"
          placeholder="Ví dụ: Hội bạn cấp 3"
          maxLength={80}
          className="h-11"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả ngắn (tùy chọn)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Nhóm hay gặp cuối tuần..."
          maxLength={500}
          rows={3}
        />
      </div>

      <input type="hidden" name="timezone" value="Asia/Ho_Chi_Minh" />

      <SubmitButton className="h-11 w-full">
        <Plus />
        Tạo nhóm
      </SubmitButton>
    </form>
  );
}
