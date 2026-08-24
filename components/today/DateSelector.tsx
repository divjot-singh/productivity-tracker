"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  selectedDate: string; // yyyy-MM-dd
  hasEntry: boolean;
  entryDates: Set<string>;
  onChange: (date: string) => void;
  subContent?: React.ReactNode;
}

export default function DateSelector({
  selectedDate,
  hasEntry,
  entryDates,
  onChange,
  subContent,
}: DateSelectorProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => parseISO(selectedDate), [selectedDate]);
  const today = useMemo(() => new Date(), []);
  const todayIso = format(today, "yyyy-MM-dd");

  function changeByDays(days: number) {
    const next = new Date(selected);
    next.setDate(next.getDate() + days);
    onChange(format(next, "yyyy-MM-dd"));
  }

  const displayDate = useMemo(() => {
    const date = parseISO(selectedDate);
    return format(date, "d MMM yyyy");
  }, [selectedDate]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Previous day"
          onClick={() => changeByDays(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="min-w-0 flex-1 justify-center gap-2 font-medium"
              >
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span className="truncate">{displayDate}</span>
                {hasEntry && (
                  <span className="bg-primary ml-1 h-1.5 w-1.5 rounded-full" />
                )}
              </Button>
            }
          />

          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(date) => {
                if (date) {
                  onChange(format(date, "yyyy-MM-dd"));
                  setOpen(false);
                }
              }}
              modifiers={{
                hasEntry: Array.from(entryDates).map((d) => parseISO(d)),
              }}
              modifiersClassNames={{
                hasEntry:
                  "after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
              }}
              defaultMonth={selected}
              disabled={{ after: today }}
            />
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Next day"
          onClick={() => changeByDays(1)}
          disabled={selectedDate >= todayIso}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {selectedDate === todayIso && (
        <div className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              hasEntry ? "bg-emerald-500" : "bg-muted-foreground/50",
            )}
          />
          <span>
            {hasEntry ? "Today · Entered" : "Today"} {subContent}
          </span>
        </div>
      )}
    </div>
  );
}
