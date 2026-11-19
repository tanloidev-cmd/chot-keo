"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Save } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfileAction, type AuthState } from "@/lib/auth/actions";
import { formatPhone } from "@/lib/auth/phone";
import type { Profile } from "@/lib/types";

const initialState: AuthState = {};

const timezones = [
  ["Asia/Ho_Chi_Minh", "Việt Nam (GMT+7)"],
  ["Asia/Bangkok", "Bangkok (GMT+7)"],
  ["Asia/Singapore", "Singapore (GMT+8)"],
  ["Asia/Tokyo", "Tokyo (GMT+9)"],
  ["Europe/London", "London"],
  ["America/New_York", "New York"],
];

export function ProfileForm({
  profile,
  phone,
}: {
  profile: Profile;
  phone: string | null;
}) {
  const [state, formAction] = useActionState(updateProfileAction, initialState);
  const [timezone, setTimezone] = useState(profile.timezone);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertDescription className="text-emerald-900">
            {state.success}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="displayName">Tên hiển thị</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={profile.display_name}
          maxLength={60}
          className="h-11"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Số điện thoại đăng nhập</Label>
        <Input value={formatPhone(phone)} disabled className="h-11" />
        <p className="text-xs text-muted-foreground">
          Số điện thoại là tên đăng nhập, không hiển thị cho thành viên khác.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Múi giờ</Label>
        <input type="hidden" name="timezone" value={timezone} />
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timezones.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SubmitButton>
        <Save />
        Lưu hồ sơ
      </SubmitButton>
    </form>
  );
}
