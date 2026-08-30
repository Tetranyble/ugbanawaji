"use client";

import type { ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({
  message,
  children,
  ...props
}: ComponentProps<typeof Button> & { message: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      {...props}
      type="submit"
      disabled={pending || props.disabled}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {pending ? <><Loader2 className="size-4 animate-spin" />Working…</> : children}
    </Button>
  );
}
