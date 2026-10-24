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

type SelectProps = BaseProps & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className"> & { options: string[]; placeholder?: string };

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
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}
