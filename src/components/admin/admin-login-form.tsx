"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/forms/field-error";
import { signInSchema } from "@/lib/validation";
import { toast } from "@/hooks/use-toast";

type SignInValues = z.input<typeof signInSchema>;

export function AdminLoginForm() {
  const router = useRouter();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const submit = handleSubmit(async (values) => {
    const result = await authClient.signIn.email({ ...values, rememberMe: true });
    if (result.error) {
      setError("root", { type: "server", message: "Invalid email or password." });
      toast.error("Sign in failed", { description: "Check your email and password and try again." });
      return;
    }
    toast.success("Signed in", { description: "Opening your dashboard." });
    router.push("/admin");
    router.refresh();
  }, () => {
    toast.error("Check your sign-in details", { description: "Enter a valid email address and password." });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" {...register("email")} type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} /><FieldError message={errors.email?.message} /></div>
      <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" {...register("password")} type="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} /><FieldError message={errors.password?.message} /></div>
      <FieldError message={errors.root?.message} />
      <Button className="w-full" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}
