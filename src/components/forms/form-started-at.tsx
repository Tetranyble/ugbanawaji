"use client";

import { useEffect, useRef } from "react";

/** Records when the hydrated form became available without making render impure. */
export function FormStartedAt() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.value = String(Date.now());
  }, []);

  return <input ref={inputRef} type="hidden" name="startedAt" defaultValue="" />;
}
