import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/site/mobile-nav";
import { Button } from "@/components/ui/button";
import { profile as defaultProfile } from "@/content/profile";

const nav = [
  ["Focus", "/#expertise"],
  ["Work", "/work"],
  ["Experience", "/#experience"],
  ["Writing", "/blog"],
  ["Principles", "/principles"],
  ["Search", "/search"],
  ["Ask AI", "/ask"],
  ["About", "/#about"],
] as const;

export function SiteHeader({ profile = defaultProfile }: { profile?: typeof defaultProfile }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container-shell flex h-18 items-center justify-between gap-6">
        <Link href="/" className="group flex min-w-0 items-center gap-3 font-bold tracking-tight" aria-label={`${profile.displayName} home`}>
          <span className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-border bg-card shadow-neuro transition-transform group-hover:-translate-y-0.5">
            <img src={profile.portrait} alt={profile.displayName} width={40} height={40} loading="eager" className="h-full w-full object-cover" />
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate leading-none">{profile.siteName}</span>
            <span className="mt-1 block truncate text-[9px] font-semibold uppercase tracking-[.08em] text-muted-foreground">{profile.eyebrow}</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm font-medium text-muted-foreground hover:text-primary">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <MobileNav profile={profile} />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/#contact">Let&apos;s talk</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
