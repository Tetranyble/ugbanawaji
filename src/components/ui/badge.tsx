import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        variant === "default" && "border-primary/25 bg-primary/10 text-primary",
        variant === "secondary" && "border-border bg-muted text-foreground",
        variant === "outline" && "border-border bg-transparent text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
