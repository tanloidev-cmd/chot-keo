"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import {
  firstFieldWithError,
  visibleFieldErrors,
  type FieldErrors,
} from "@/lib/forms/field-errors";

type FieldFormState = {
  error?: string;
  fieldErrors?: FieldErrors;
};

/**
 * Submission plumbing for a form whose server action returns `fieldErrors`.
 *
 * The action is dispatched manually instead of through the form `action` prop:
 * React resets an action form after every submission, which would clear the
 * values the user already typed when only one input is invalid. Errors render
 * under their own field, and the first invalid field is focused after a
 * failed submit.
 */
export function useFieldForm<S extends FieldFormState>({
  action,
  initialState,
  id,
  fieldOrder,
  validate,
}: {
  action: (state: S, formData: FormData) => Promise<S>;
  initialState: S;
  /** Unique per page; used to build stable error element ids. */
  id: string;
  /** Field names in visual order, used to pick the first error to focus. */
  fieldOrder: readonly string[];
  /** Optional client-side rules for instant feedback before the round trip. */
  validate?: (formData: FormData) => FieldErrors;
}) {
  // `useActionState` types its state as `Awaited<S>`, which TypeScript cannot
  // reduce for a generic `S`; the action's own state type stays on the outside.
  const [state, formAction, actionPending] = useActionState(
    action as unknown as (
      state: FieldFormState,
      formData: FormData,
    ) => FieldFormState | Promise<FieldFormState>,
    initialState,
  ) as [S, (formData: FormData) => void, boolean];
  const [isPending, startTransition] = useTransition();
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const [editedFields, setEditedFields] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const fieldErrors = visibleFieldErrors(
    clientErrors,
    state.fieldErrors,
    editedFields,
  );

  useEffect(() => {
    const field = state.fieldErrors
      ? firstFieldWithError(state.fieldErrors, fieldOrder)
      : null;
    const target = field ? formRef.current?.elements.namedItem(field) : null;

    if (target instanceof HTMLElement) target.focus();
  }, [state, fieldOrder]);

  function markEdited(field: string) {
    setEditedFields((current) =>
      current.includes(field) ? current : [...current, field],
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const issues = validate?.(formData) ?? {};
    const invalidField = firstFieldWithError(issues, fieldOrder);

    setEditedFields([]);

    if (invalidField) {
      setClientErrors(issues);

      const target = form.elements.namedItem(invalidField);
      if (target instanceof HTMLElement) target.focus();
      return;
    }

    setClientErrors(null);
    startTransition(() => formAction(formData));
  }

  return {
    state,
    fieldErrors,
    onSubmit,
    markEdited,
    formRef,
    errorId: (field: string) => `${id}-${field}-error`,
    pending: isPending || actionPending,
  };
}
