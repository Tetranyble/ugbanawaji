"use client";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export function ThemeAccountSync({ theme }: { theme?: "system" | "light" | "dark" | null }) {
  const { setTheme } = useTheme();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!theme || hasSynced.current) return;
    hasSynced.current = true;
    setTheme(theme);
  }, [theme, setTheme]);

  return null;
}
