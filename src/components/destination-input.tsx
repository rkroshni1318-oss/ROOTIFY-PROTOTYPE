import { useServerFn } from "@tanstack/react-start";
import { Loader2, MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { searchDestinations } from "@/lib/travel.functions";
import type { GeoPlace } from "@/lib/travel-types";
import { cn } from "@/lib/utils";

export function placeLabel(p: GeoPlace) {
  const parts: string[] = [];
  if (p.name) parts.push(p.name);
  if (p.admin1 && !parts.some((x) => x.toLowerCase() === p.admin1?.toLowerCase())) {
    parts.push(p.admin1);
  }
  if (p.country && !parts.some((x) => x.toLowerCase() === p.country?.toLowerCase())) {
    parts.push(p.country);
  }
  return parts.join(", ");
}

export function DestinationInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: GeoPlace | null;
  onChange: (p: GeoPlace | null) => void;
  placeholder?: string;
}) {
  const id = useId();
  const search = useServerFn(searchDestinations);
  const [text, setText] = useState(value ? placeLabel(value) : "");
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [state, setState] = useState<"idle" | "loading" | "error" | "empty">("idle");
  const reqId = useRef(0);

  useEffect(() => {
    setText(value ? placeLabel(value) : "");
  }, [value]);

  useEffect(() => {
    if (value && text === placeLabel(value)) return;
    if (text.trim().length < 2) {
      setResults([]);
      setState("idle");
      return;
    }
    const n = ++reqId.current;
    setState("loading");
    const t = setTimeout(() => {
      search({ data: { q: text.trim() } })
        .then((r) => {
          if (n !== reqId.current) return;
          setResults(r);
          setState(r.length ? "idle" : "empty");
          setOpen(true);
          setActive(-1);
        })
        .catch(() => n === reqId.current && setState("error"));
    }, 300);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(p: GeoPlace) {
    onChange(p);
    setText(placeLabel(p));
    setOpen(false);
  }

  return (
    <div className="relative space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden />
        <Input
          id={id}
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          className="h-11 bg-surface pl-9 pr-9"
          onChange={(e) => {
            setText(e.target.value);
            if (value) onChange(null);
          }}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(results.length - 1, a + 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            }
            if (e.key === "Enter" && open && results[active]) {
              e.preventDefault();
              pick(results[active]!);
            }
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {state === "loading" && (
          <Loader2
            className="absolute right-3 top-3.5 size-4 animate-spin text-muted-foreground"
            aria-label="Searching"
          />
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {state === "empty"
          ? "No matching places"
          : state === "error"
            ? "Search failed"
            : results.length
              ? `${results.length} suggestions`
              : ""}
      </p>
      {state === "empty" && (
        <p className="text-xs text-muted-foreground">
          No matching places. Try a different spelling.
        </p>
      )}
      {state === "error" && (
        <p className="text-xs text-destructive">
          Couldn't search right now. Check your connection and try again.
        </p>
      )}
      {open && results.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute z-40 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-lg"
        >
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(r);
              }}
              className={cn(
                "cursor-pointer rounded-md px-3 py-2 text-sm",
                i === active && "bg-muted",
              )}
            >
              <span className="font-medium">{r.name}</span>
              <span className="text-muted-foreground">
                {" "}
                · {[r.admin1, r.country].filter(Boolean).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
