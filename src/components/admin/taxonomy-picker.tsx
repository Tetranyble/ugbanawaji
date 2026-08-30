"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TaxonomyPicker({
  name,
  label,
  options,
  initial = [],
  max = 20,
  placeholder,
}: {
  name: string;
  label: string;
  options: string[];
  initial?: string[];
  max?: number;
  placeholder?: string;
}) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.filter((item) => !selected.some((x) => x.toLowerCase() === item.toLowerCase())).slice(0, 8);
    return options.filter((item) => item.toLowerCase().includes(q) && !selected.some((x) => x.toLowerCase() === item.toLowerCase())).slice(0, 8);
  }, [options, query, selected]);

  function add(value: string) {
    const clean = value.trim().replace(/\s+/g, " ");
    if (!clean || selected.length >= max || selected.some((x) => x.toLowerCase() === clean.toLowerCase())) return;
    const canonical = options.find((item) => item.toLowerCase() === clean.toLowerCase()) ?? clean;
    setSelected((items) => [...items, canonical]);
    setQuery("");
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(selected)} />
      <div className="flex flex-wrap gap-2">
        {selected.map((item) => (
          <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold">
            {item}
            <button type="button" className="rounded-full p-0.5 hover:bg-background" aria-label={`Remove ${item}`} onClick={() => setSelected((items) => items.filter((x) => x !== item))}>
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder ?? `Search or create ${label.toLowerCase()}`}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add(query);
            }
          }}
        />
        {query || matches.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {matches.map((item) => <Button key={item} type="button" size="sm" variant="outline" onClick={() => add(item)}>{item}</Button>)}
            {query.trim() && !options.some((item) => item.toLowerCase() === query.trim().toLowerCase()) ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => add(query)}><Plus className="size-3" /> Create “{query.trim()}”</Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">Type to search existing {label.toLowerCase()}, or press Enter to create a new one.</p>
    </div>
  );
}
