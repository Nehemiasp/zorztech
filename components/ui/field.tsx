import { useId } from "react";
import { cn } from "@/lib/cn";

const control =
  "min-h-11 w-full rounded-sm border bg-surface-light px-3 text-base text-text-on-light placeholder:text-text-muted";

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

function Wrapper({ id, label, error, hint, className, children }: BaseProps & { id: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block font-medium">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-state-error">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = BaseProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">;

/** Campo de texto con etiqueta visible y el error pegado al campo. */
export function TextField({ label, error, hint, className, ...props }: InputProps) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} className={className}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(control, error ? "border-state-error" : "border-border-strong")}
        {...props}
      />
    </Wrapper>
  );
}

type SelectOption = string | { value: string; label: string };
type SelectProps = BaseProps &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className"> & { options: SelectOption[]; placeholder?: string };

/** Lista desplegable con etiqueta explícita (la etiqueta no envuelve al campo: su nombre no incluye las opciones). */
export function SelectField({ label, error, hint, className, options, placeholder = "Elige una opción", ...props }: SelectProps) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} className={className}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(control, error ? "border-state-error" : "border-border-strong")}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const { value, label: text } = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
    </Wrapper>
  );
}

type TextAreaProps = BaseProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;

export function TextAreaField({ label, error, hint, className, ...props }: TextAreaProps) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} className={className}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(control, "py-2", error ? "border-state-error" : "border-border-strong")}
        {...props}
      />
    </Wrapper>
  );
}

type CheckboxProps = { label: string; hint?: string; error?: string; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "type">;

export function CheckboxField({ label, hint, error, className, ...props }: CheckboxProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3">
        <input id={id} type="checkbox" aria-invalid={error ? true : undefined} aria-describedby={hint ? `${id}-hint` : undefined} className="size-5 accent-brand-primary" {...props} />
        <span>{label}</span>
      </label>
      {hint && (
        <p id={`${id}-hint`} className="ml-8 text-sm text-text-muted">
          {hint}
        </p>
      )}
      {error && <p className="ml-8 text-sm text-state-error">{error}</p>}
    </div>
  );
}
