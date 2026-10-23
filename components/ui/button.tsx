import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary-light" | "secondary-dark";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-base font-medium transition-colors duration-150 ease-out " +
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand-primary text-brand-white hover:bg-brand-primary-strong active:bg-brand-primary-deep",
  "secondary-light":
    "border border-border-strong bg-surface-light text-text-on-light hover:bg-surface-light-alt active:bg-border",
  "secondary-dark":
    "border border-border-strong-on-dark text-text-on-dark hover:bg-surface-dark-raised active:bg-surface-dark-alt",
};

export function buttonStyles(variant: Variant = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

interface LinkButtonProps extends React.ComponentProps<typeof Link> {
  variant?: Variant;
}

export function LinkButton({ variant = "primary", className, ...props }: LinkButtonProps) {
  return <Link className={buttonStyles(variant, className)} {...props} />;
}
