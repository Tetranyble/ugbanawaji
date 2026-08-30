"use client";

import { Loader2 } from "lucide-react";

export function FormStatus({ pending, pendingText = "Saving…" }: { pending: boolean; pendingText?: string }) {
  if (!pending) return null;
  return <span className="inline-flex items-center gap-2 text-xs text-muted-foreground" role="status"><Loader2 className="size-3.5 animate-spin" />{pendingText}</span>;
}
