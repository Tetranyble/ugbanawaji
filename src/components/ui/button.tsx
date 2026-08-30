import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary px-5 py-3 text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary/90",
        secondary: "bg-card px-5 py-3 text-foreground shadow-neuro hover:-translate-y-0.5",
        outline: "border border-border bg-transparent px-5 py-3 hover:bg-muted",
        ghost: "px-3 py-2 hover:bg-muted",
        destructive: "bg-destructive px-4 py-2 text-white hover:bg-destructive/90",
      },
      size: {
        default: "h-11",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 px-6 text-base",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { buttonVariants };
