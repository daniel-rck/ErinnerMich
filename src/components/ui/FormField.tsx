import { type ReactElement, type ReactNode, useId } from "react";

export interface FormFieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  htmlFor?: string;
  /**
   * A single form control element. We clone it to inject id/aria-describedby.
   * If you need multiple controls (e.g. radio group), wrap them and pass
   * htmlFor manually.
   */
  children: ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
}

export function FormField({
  label,
  hint,
  error,
  required,
  optional,
  htmlFor,
  children,
}: FormFieldProps) {
  const autoId = useId();
  const fieldId = htmlFor ?? children.props.id ?? `${autoId}-input`;
  const hintId = hint ? `${autoId}-hint` : undefined;
  const errorId = error ? `${autoId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const childProps = children.props;
  const cloned: ReactElement = {
    ...children,
    props: {
      ...childProps,
      id: fieldId,
      "aria-describedby": describedBy,
      "aria-invalid": error ? true : undefined,
    },
  };

  return (
    <div className="flex flex-col gap-[0.25rem]">
      <label
        htmlFor={fieldId}
        className="flex items-center justify-between text-[length:0.8125rem] font-medium text-[color:var(--color-fg-muted)]"
      >
        <span>
          {label}
          {required && (
            <span className="text-[color:var(--color-danger)]" aria-hidden>
              {" *"}
            </span>
          )}
        </span>
        {optional && !required && (
          <span className="text-[length:0.6875rem] tracking-[0.06em] uppercase text-[color:var(--color-fg-subtle)]">
            optional
          </span>
        )}
      </label>
      {cloned}
      {error ? (
        <p id={errorId} className="text-[length:0.8125rem] text-[color:var(--color-danger)]">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[length:0.8125rem] text-[color:var(--color-fg-subtle)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
