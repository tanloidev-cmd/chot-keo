"use client";

import { useState } from "react";
import { AlertCircle, Save } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfileAction, type AuthState } from "@/lib/auth/actions";
import { formatPhone } from "@/lib/auth/phone";
import { useFieldForm } from "@/lib/forms/use-field-form";
import type { Profile } from "@/lib/types";

const initialState: AuthState = {};
const FIELDS = ["displayName", "timezone"] as const;

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
  const [timezone, setTimezone] = useState(profile.timezone);
  const {
    state,
    fieldErrors,
    onSubmit,
    markEdited,
    formRef,
    errorId,
    pending,
  } = useFieldForm({
    action: updateProfileAction,
    initialState,
    id: "profile",
    fieldOrder: FIELDS,
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4">
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

      <Field data-invalid={fieldErrors.displayName ? true : undefined}>
        <FieldLabel htmlFor="displayName">Tên hiển thị</FieldLabel>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={profile.display_name}
          maxLength={60}
          className="h-11"
          required
          aria-invalid={fieldErrors.displayName ? true : undefined}
          aria-describedby={
            fieldErrors.displayName ? errorId("displayName") : undefined
          }
          onChange={() => markEdited("displayName")}
        />
        <FieldError id={errorId("displayName")}>
          {fieldErrors.displayName}
        </FieldError>
      </Field>

      <Field>
        <FieldLabel>Số điện thoại đăng nhập</FieldLabel>
        <Input value={formatPhone(phone)} disabled className="h-11" readOnly />
        <FieldDescription className="text-xs">
          Số điện thoại là tên đăng nhập, không hiển thị cho thành viên khác.
        </FieldDescription>
      </Field>

      <Field data-invalid={fieldErrors.timezone ? true : undefined}>
        <FieldLabel>Múi giờ</FieldLabel>
        <input type="hidden" name="timezone" value={timezone} />
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger className="w-full" aria-label="Múi giờ">
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
        <FieldError id={errorId("timezone")}>{fieldErrors.timezone}</FieldError>
      </Field>

      <SubmitButton pending={pending}>
        <Save />
        Lưu hồ sơ
      </SubmitButton>
    </form>
  );
}
