import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { getPublicProfile } from "@/lib/data";
import { AdminToastListener } from "@/components/admin/admin-toast-listener";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Portfolio Admin" }, robots: { index: false, follow: false } };

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/admin/login");
  const profile = await getPublicProfile();
  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-background">
      <AdminNav name={session.user.name} portrait={profile.portrait} siteName={profile.siteName} />
      <Suspense><AdminToastListener /></Suspense>
      <main className="min-w-0 px-5 py-8 sm:px-8 sm:py-10 lg:ml-64 lg:px-10 lg:py-12">
        <div className="mx-auto w-full min-w-0 max-w-7xl [&>*]:mx-auto">{children}</div>
      </main>
    </div>
  );
}
