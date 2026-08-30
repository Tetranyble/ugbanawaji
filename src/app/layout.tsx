import type { Metadata } from "next";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeAccountSync } from "@/components/theme-account-sync";
import { SiteChrome } from "@/components/site/site-chrome";
import { StructuredData } from "@/components/site/structured-data";
import { getPublicProfile } from "@/lib/data";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { Toaster } from "@/components/ui/toaster";
import { AnalyticsTracker } from "@/components/site/analytics-tracker";
import { PwaRegister } from "@/components/site/pwa-register";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicProfile();
  let siteUrl: URL;
  try { siteUrl = new URL(profile.domain); } catch { siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ugbanawaji.com"); }
  const description = profile.intro || profile.headline;
  return {
  metadataBase: siteUrl,
  title: { default: `${profile.displayName} — ${profile.eyebrow}`, template: `%s | ${profile.displayName}` },
  description,
  keywords: ["Software Engineer", "Technology Lead", "Java", "Spring Boot", "Laravel", "Fintech", "Distributed Systems", "Kubernetes", "AI", "Nigeria"],
  authors: [{ name: profile.displayName, url: siteUrl }],
  openGraph: { type: "website", url: siteUrl, title: `${profile.displayName} — ${profile.eyebrow}`, description, siteName: profile.siteName, images: [{ url: profile.portrait, alt: profile.displayName }] },
  twitter: { card: "summary_large_image", title: profile.displayName, description, images: [profile.portrait] },
  alternates: { canonical: siteUrl },
  };
}

async function accountTheme() {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    const [user] = await db.select({ theme: users.themePreference }).from(users).where(eq(users.id, session.user.id)).limit(1);
    if (!user) return null;
    return user.theme.toLowerCase() as "system" | "light" | "dark";
  } catch { return null; }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [profile, savedTheme] = await Promise.all([getPublicProfile(), accountTheme()]);
  return <html lang="en" suppressHydrationWarning><body><ThemeProvider defaultTheme={savedTheme ?? "dark"}>{savedTheme ? <ThemeAccountSync theme={savedTheme} /> : null}<StructuredData profile={profile} /><Suspense fallback={null}><AnalyticsTracker /></Suspense><PwaRegister /><SiteChrome profile={profile}>{children}</SiteChrome><Toaster /></ThemeProvider></body></html>;
}
