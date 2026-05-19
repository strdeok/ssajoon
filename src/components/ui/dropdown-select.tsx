"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type DropdownSelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

type DropdownSelectProps = {
  id?: string;
  value: string;
  options: DropdownSelectOption[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: ReactNode;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  ariaLabel?: string;
};

export function DropdownSelect({
  id,
  value,
  options,
  onValueChange,
  disabled = false,
  placeholder = "Select",
  className,
  triggerClassName,
  contentClassName,
  ariaLabel,
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const generatedListboxId = useId();
  const listboxId = `${id ?? generatedListboxId}-listbox`;
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
          triggerClassName,
        )}
      >
        <span className="min-w-0 truncate">
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+0.25rem)] z-50 max-h-72 overflow-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900",
            contentClassName,
          )}
        >
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-800",
                  selected && "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
                )}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {selected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
