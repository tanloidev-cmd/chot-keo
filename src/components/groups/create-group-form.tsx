"use client";

import { AlertCircle, Plus } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createGroupAction,
  type ActionState,
} from "@/lib/actions/groups";
import { useFieldForm } from "@/lib/forms/use-field-form";

const initialState: ActionState = {};
const FIELDS = ["name", "description", "rules"] as const;

export function CreateGroupForm() {
  const {
    state,
    fieldErrors,
    onSubmit,
    markEdited,
    formRef,
    errorId,
    pending,
  } = useFieldForm({
    action: createGroupAction,
    initialState,
    id: "create-group",
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

      <Field data-invalid={fieldErrors.name ? true : undefined}>
        <FieldLabel htmlFor="name">Tên nhóm</FieldLabel>
        <Input
          id="name"
          name="name"
          placeholder="Ví dụ: Hội bạn cấp 3"
          maxLength={80}
          className="h-11"
          required
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? errorId("name") : undefined}
          onChange={() => markEdited("name")}
        />
        <FieldError id={errorId("name")}>{fieldErrors.name}</FieldError>
      </Field>

      <Field data-invalid={fieldErrors.description ? true : undefined}>
        <FieldLabel htmlFor="description">Mô tả ngắn (tùy chọn)</FieldLabel>
        <Textarea
          id="description"
          name="description"
          placeholder="Nhóm hay gặp cuối tuần..."
          maxLength={500}
          rows={3}
          aria-invalid={fieldErrors.description ? true : undefined}
          aria-describedby={
            fieldErrors.description ? errorId("description") : undefined
          }
          onChange={() => markEdited("description")}
        />
        <FieldError id={errorId("description")}>
          {fieldErrors.description}
        </FieldError>
      </Field>

      <input type="hidden" name="timezone" value="Asia/Ho_Chi_Minh" />

      <SubmitButton className="h-11 w-full" pending={pending}>
        <Plus />
        Tạo nhóm
      </SubmitButton>
    </form>
  );
}
