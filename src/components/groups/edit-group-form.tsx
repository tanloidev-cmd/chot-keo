"use client";

import { useState } from "react";
import { AlertCircle, Pencil } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateGroupAction, type ActionState } from "@/lib/actions/groups";
import { useFieldForm } from "@/lib/forms/use-field-form";
import type { Group } from "@/lib/types";

const initialState: ActionState = {};
const FIELDS = ["name", "description", "rules"] as const;

export function EditGroupForm({ group }: { group: Group }) {
  const [editing, setEditing] = useState(false);
  const {
    state,
    fieldErrors,
    onSubmit,
    markEdited,
    formRef,
    errorId,
    pending,
  } = useFieldForm({
    action: updateGroupAction,
    initialState,
    id: "edit-group",
    fieldOrder: FIELDS,
  });

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
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="space-y-3 rounded-xl border bg-card p-4"
    >
      <input type="hidden" name="groupId" value={group.id} />
      {state.error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Field data-invalid={fieldErrors.name ? true : undefined}>
        <FieldLabel htmlFor="group-name">Tên nhóm</FieldLabel>
        <Input
          id="group-name"
          name="name"
          defaultValue={group.name}
          maxLength={80}
          required
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? errorId("name") : undefined}
          onChange={() => markEdited("name")}
        />
        <FieldError id={errorId("name")}>{fieldErrors.name}</FieldError>
      </Field>

      <Field data-invalid={fieldErrors.description ? true : undefined}>
        <FieldLabel htmlFor="group-description">Mô tả</FieldLabel>
        <Textarea
          id="group-description"
          name="description"
          defaultValue={group.description ?? ""}
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

      <Field data-invalid={fieldErrors.rules ? true : undefined}>
        <FieldLabel htmlFor="group-rules">Quy tắc nhóm (tùy chọn)</FieldLabel>
        <Textarea
          id="group-rules"
          name="rules"
          defaultValue={group.rules ?? ""}
          maxLength={1000}
          rows={3}
          placeholder="Ví dụ: báo bận trước 24h, không réo muộn..."
          aria-invalid={fieldErrors.rules ? true : undefined}
          aria-describedby={fieldErrors.rules ? errorId("rules") : undefined}
          onChange={() => markEdited("rules")}
        />
        <FieldError id={errorId("rules")}>{fieldErrors.rules}</FieldError>
      </Field>

      <input type="hidden" name="timezone" value={group.timezone} />
      <div className="flex gap-2">
        <SubmitButton pending={pending}>Lưu</SubmitButton>
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
