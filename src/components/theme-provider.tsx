"use client";
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, defaultTheme = "dark" }: { children: React.ReactNode; defaultTheme?: "system" | "light" | "dark" }) {
  return <NextThemesProvider attribute="class" defaultTheme={defaultTheme} enableSystem>{children}</NextThemesProvider>;
}
