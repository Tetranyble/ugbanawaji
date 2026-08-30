"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { profile as defaultProfile } from "@/content/profile";

export function SiteChrome({ children, profile }: { children: ReactNode; profile: typeof defaultProfile }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return <>{children}</>;
  return <><SiteHeader profile={profile} />{children}<SiteFooter profile={profile} /></>;
}
