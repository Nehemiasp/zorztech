"use client";

import { useRouter } from "next/navigation";
import { SelectShell } from "@/components/ui/field";

interface Props {
  value: string;
  options: { value: string; label: string; href: string }[];
}

export function SortSelect({ value, options }: Props) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-text-muted">
      <span className="whitespace-nowrap">Ordenar por</span>
      <SelectShell>
        <select
          value={value}
          onChange={(e) => {
            const option = options.find((o) => o.value === e.target.value);
            if (option) router.push(option.href);
          }}
          className="min-h-11 cursor-pointer appearance-none rounded-sm border border-border-strong bg-surface-light py-2 pl-3 pr-12 text-base text-text-on-light"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </SelectShell>
    </label>
  );
}
