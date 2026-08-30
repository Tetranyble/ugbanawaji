"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { type DefaultValues, type FieldValues, type Resolver, useForm } from "react-hook-form";
import type { ZodType } from "zod";
import { toast } from "@/hooks/use-toast";

function isNextRedirect(error: unknown) {
  if (!error || typeof error !== "object" || !("digest" in error)) return false;
  return String((error as { digest?: unknown }).digest ?? "").startsWith("NEXT_REDIRECT");
}

export function useAdminForm<T extends FieldValues>({
  schema,
  defaultValues,
  action,
  invalidDescription = "Fix the highlighted fields and try again.",
}: {
  schema: ZodType<T>;
  defaultValues: DefaultValues<T>;
  action: (formData: FormData) => void | Promise<void>;
  invalidDescription?: string;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const form = useForm<T>({
    resolver: zodResolver(schema as ZodType<T, T>) as Resolver<T>,
    defaultValues,
    mode: "onBlur",
  });
  const onSubmit = form.handleSubmit(async (_values, event) => {
    const formElement = event?.target;
    if (!(formElement instanceof HTMLFormElement)) return;
    try {
      await action(new FormData(formElement));
    } catch (error) {
      if (isNextRedirect(error)) throw error;
      const message = error instanceof Error ? error.message : "The form could not be saved.";
      toast.error("Save failed", { description: message });
    }
  }, () => {
    toast.error("Please check the form", { description: invalidDescription });
  });
  return { formRef, form, onSubmit };
}
