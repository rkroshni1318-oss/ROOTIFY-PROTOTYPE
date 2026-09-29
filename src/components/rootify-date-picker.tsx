import { format } from "date-fns";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function RootifyDatePicker({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  placeholder: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-11 w-full justify-start bg-surface px-3 text-left font-normal shadow-none",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarDays className="text-primary" />
          {value ? format(value, "dd MMM yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disabled}
          initialFocus
          className="pointer-events-auto p-3"
        />
      </PopoverContent>
    </Popover>
  );
}
