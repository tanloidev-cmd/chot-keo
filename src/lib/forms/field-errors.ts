/**
 * Field-level error helpers shared by server actions and their client forms.
 *
 * Kept free of Node-only imports (and of zod's runtime) so both sides can use it.
 */

import type { ZodError } from "zod";

/** Field name -> first error message for that field. */
export type FieldErrors = Record<string, string | undefined>;

/**
 * Keep the first message per form field so a form can render it under the
 * input that failed instead of a single banner at the top.
 */
export function collectFieldErrors(
  error: ZodError,
  fields: readonly string[],
): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && fields.includes(field)) {
      fieldErrors[field] ??= issue.message;
    }
  }

  return fieldErrors;
}

export function firstFieldWithError(
  errors: FieldErrors,
  order: readonly string[],
): string | null {
  for (const field of order) {
    if (errors[field]) return field;
  }

  return null;
}

/**
 * Client validation wins while it is the latest result (a blocked submit),
 * otherwise the errors come from the server action. Fields edited since the
 * last submit stop showing their old message.
 */
export function visibleFieldErrors(
  clientErrors: FieldErrors | null,
  serverErrors: FieldErrors | undefined,
  editedFields: readonly string[],
): FieldErrors {
  const source = clientErrors ?? serverErrors;
  const errors: FieldErrors = {};

  if (!source) return errors;

  for (const [field, message] of Object.entries(source)) {
    if (!message || editedFields.includes(field)) continue;
    errors[field] = message;
  }

  return errors;
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}
