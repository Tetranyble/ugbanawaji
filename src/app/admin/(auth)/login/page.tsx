import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Admin Login", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user?.id && session.user.role === "ADMIN") redirect("/admin");
  const profile = await getPublicProfile();
  return (
    <main className="grid min-h-screen place-items-center bg-background p-5 grid-noise">
      <Card className="w-full max-w-md">
        <CardHeader><Link href="/" className="relative mb-5 block size-12 overflow-hidden rounded-xl border border-border bg-muted"><img src={profile.portrait} alt={profile.displayName} width={48} height={48} className="h-full w-full object-cover" /></Link><CardTitle className="text-2xl">{profile.siteName} admin</CardTitle><CardDescription>Credential-based admin access for writing and portfolio content.</CardDescription></CardHeader>
        <CardContent><AdminLoginForm /><p className="mt-5 text-xs leading-5 text-muted-foreground">No public registration route is exposed. Create the administrator with the seed command and keep the credentials in environment variables.</p></CardContent>
      </Card>
    </main>
  );
}
