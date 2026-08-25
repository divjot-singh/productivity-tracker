"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

const TRIGGER_CLASS =
  "border-input bg-background text-foreground focus:ring-primary/40 h-11 w-full rounded-xl border px-3.5 pr-10 text-sm transition outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60";

interface SearchableSelectBaseProps {
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  triggerClassName?: string;
}

interface SearchableSelectSingleProps extends SearchableSelectBaseProps {
  mode: "single";
  value: string;
  onChange: (value: string) => void;
}

interface SearchableSelectMultiProps extends SearchableSelectBaseProps {
  mode: "multi";
  value: string[];
  onChange: (value: string[]) => void;
  allowCreateOption?: boolean;
  onCreateOption?: (value: string) => void;
}

type SearchableSelectProps =
  SearchableSelectSingleProps | SearchableSelectMultiProps;

export default function SearchableSelect(props: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedValues =
    props.mode === "multi"
      ? props.value
      : props.value.length > 0
        ? [props.value]
        : [];

  const selectedLabel = useMemo(() => {
    if (props.mode === "multi") {
      return selectedValues.length > 0
        ? `${selectedValues.length} selected`
        : props.placeholder;
    }

    const selected = props.options.find(
      (option) => option.value === props.value,
    );
    return selected?.label ?? props.placeholder;
  }, [
    props.mode,
    props.options,
    props.placeholder,
    props.value,
    selectedValues.length,
  ]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return props.options;
    }

    return props.options.filter((option) => {
      const haystack = `${option.label} ${option.value}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [props.options, query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  function toggleSelection(value: string) {
    if (props.mode === "single") {
      props.onChange(value);
      setOpen(false);
      return;
    }

    const hasValue = props.value.includes(value);

    if (hasValue) {
      props.onChange(props.value.filter((entry) => entry !== value));
      return;
    }

    props.onChange([...props.value, value]);
  }

  const canCreateOption =
    props.mode === "multi" &&
    props.allowCreateOption &&
    props.onCreateOption &&
    query.trim().length > 0 &&
    !props.options.some(
      (option) => option.value.toLowerCase() === query.trim().toLowerCase(),
    );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={props.disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          TRIGGER_CLASS,
          "relative flex items-center justify-between text-left",
          props.triggerClassName,
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={cn(
            "text-muted-foreground pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 transition-transform",
            open ? "rotate-180" : "",
          )}
        />
      </button>

      {open ? (
        <div className="bg-popover mt-2 space-y-2 rounded-xl border p-2 shadow-sm">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={props.searchPlaceholder ?? "Search..."}
            className="border-input bg-background text-foreground focus:ring-primary/40 h-9 w-full rounded-lg border px-3 text-sm transition outline-none focus:ring-1"
          />

          <div className="max-h-56 space-y-1 overflow-auto">
            {filteredOptions.length === 0 ? (
              <p className="text-muted-foreground px-2 py-1.5 text-xs">
                {props.emptyText ?? "No options found."}
              </p>
            ) : (
              filteredOptions.map((option) => {
                const selected = selectedValues.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleSelection(option.value)}
                    className={cn(
                      "hover:bg-accent flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                      selected ? "bg-accent/70" : "",
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>

          {canCreateOption ? (
            <button
              type="button"
              onClick={() => {
                props.onCreateOption?.(query.trim());
                setQuery("");
              }}
              className="hover:bg-accent w-full rounded-lg border border-dashed px-3 py-2 text-left text-xs font-medium transition-colors"
            >
              Add "{query.trim()}"
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
