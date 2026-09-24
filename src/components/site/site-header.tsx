import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/site/mobile-nav";
import { Button } from "@/components/ui/button";
import type { NavigationItem, PortfolioProfile } from "@/lib/portfolio-types";
import type { SiteChromeCopy } from "@/components/site/site-chrome-copy";

export function SiteHeader({ profile, navigation, copy }: { profile: PortfolioProfile; navigation: NavigationItem[]; copy: SiteChromeCopy }) {
  const headerNav = navigation.filter((item) => item.placement === "HEADER");
  const mobileNav = navigation.filter((item) => item.placement === "MOBILE");
  const headerCta = navigation.find((item) => item.placement === "HEADER_CTA");
  return <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl"><div className="container-shell flex h-18 items-center justify-between gap-6"><Link href="/" className="group flex min-w-0 items-center gap-3 font-bold tracking-tight" aria-label={copy.header.homeAria.replace("{name}", profile.displayName || profile.siteName)}><span className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-border bg-card shadow-neuro transition-transform group-hover:-translate-y-0.5">{profile.portrait ? <img src={profile.portrait} alt={profile.displayName} width={40} height={40} loading="eager" className="h-full w-full object-cover" /> : null}</span><span className="hidden min-w-0 sm:block"><span className="block truncate leading-none">{profile.siteName}</span><span className="mt-1 block truncate text-[9px] font-semibold uppercase tracking-[.08em] text-muted-foreground">{profile.eyebrow}</span></span></Link><nav className="hidden items-center gap-6 lg:flex" aria-label={copy.header.mainNavAria}>{headerNav.map((item) => <Link key={item.id} href={item.href} target={item.external ? "_blank" : undefined} className="text-sm font-medium text-muted-foreground hover:text-primary">{item.label}</Link>)}</nav><div className="flex items-center gap-2"><ThemeToggle copy={copy.theme}/><MobileNav profile={profile} navigation={mobileNav} copy={copy.mobile}/>{headerCta ? <Button asChild size="sm" className="hidden sm:inline-flex"><Link href={headerCta.href} target={headerCta.external ? "_blank" : undefined}>{headerCta.label}</Link></Button> : null}</div></div></header>;
}
