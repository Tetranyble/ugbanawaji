import type { Metadata } from "next";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeAccountSync } from "@/components/theme-account-sync";
import { SiteChrome } from "@/components/site/site-chrome";
import { StructuredData } from "@/components/site/structured-data";
import { getPublicNavigation, getPublicProfile, getSitePage } from "@/lib/data";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { Toaster } from "@/components/ui/toaster";
import { AnalyticsTracker } from "@/components/site/analytics-tracker";
import { PwaRegister } from "@/components/site/pwa-register";
import { itemValue, sectionAction } from "@/lib/page-content";
import type { SiteChromeCopy } from "@/components/site/site-chrome-copy";

export async function generateMetadata(): Promise<Metadata> {
  const [profile, homePage] = await Promise.all([getPublicProfile(), getSitePage("home")]);
  let siteUrl: URL;
  try { siteUrl = new URL(profile.domain); } catch { siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ugbanawaji.com"); }
  const description = homePage?.seoDescription || profile.intro || profile.headline;
  const defaultTitle = homePage?.seoTitle || homePage?.title || profile.siteName;
  const keywords = itemValue(homePage?.sectionMap.metadata,"keywords").split(",").map(item=>item.trim()).filter(Boolean);
  const titleTemplate = itemValue(homePage?.sectionMap.metadata,"titleTemplate").replace("{name}", profile.displayName);
  const title: Metadata["title"] = titleTemplate ? { default: defaultTitle, template: titleTemplate } : defaultTitle;
  return { metadataBase: siteUrl, title, description, keywords, authors: [{ name: profile.displayName, url: siteUrl }], openGraph: { type: "website", url: siteUrl, title: defaultTitle, description, siteName: profile.siteName, images: [{ url: profile.portrait, alt: profile.displayName }] }, twitter: { card: "summary_large_image", title: defaultTitle, description, images: [profile.portrait] }, alternates: { canonical: siteUrl } };
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
  const [profile, navigation, savedTheme, chromePage] = await Promise.all([getPublicProfile(), getPublicNavigation(), accountTheme(), getSitePage("site-chrome")]);
  const header=chromePage?.sectionMap.header,mobile=chromePage?.sectionMap.mobile,theme=chromePage?.sectionMap.theme,footer=chromePage?.sectionMap.footer,article=chromePage?.sectionMap.article,admin=sectionAction(footer,"admin");
  const chromeCopy: SiteChromeCopy = {
    header:{homeAria:itemValue(header,"homeAria"),mainNavAria:itemValue(header,"mainNavAria")},
    mobile:{openAria:itemValue(mobile,"openAria"),closeAria:itemValue(mobile,"closeAria"),navAria:itemValue(mobile,"navAria")},
    theme:{chooseAria:itemValue(theme,"chooseAria"),systemLabel:itemValue(theme,"systemLabel"),lightLabel:itemValue(theme,"lightLabel"),darkLabel:itemValue(theme,"darkLabel")},
    footer:{copyright:itemValue(footer,"copyright"),linkedinAria:itemValue(footer,"linkedinAria"),githubAria:itemValue(footer,"githubAria"),emailAria:itemValue(footer,"emailAria"),adminLabel:admin?.label??"",adminHref:admin?.href??""},
    article:{renderingDiagram:itemValue(article,"renderingDiagram"),codeLabel:itemValue(article,"codeLabel"),copyLabel:itemValue(article,"copyLabel"),copiedLabel:itemValue(article,"copiedLabel")},
  };
  return <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning><body><ThemeProvider defaultTheme={savedTheme ?? "dark"}>{savedTheme ? <ThemeAccountSync theme={savedTheme} /> : null}<StructuredData profile={profile} /><Suspense fallback={null}><AnalyticsTracker /></Suspense><PwaRegister /><SiteChrome profile={profile} navigation={navigation} copy={chromeCopy}>{children}</SiteChrome><Toaster /></ThemeProvider></body></html>;
}
