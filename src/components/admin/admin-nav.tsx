"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Accessibility, BarChart3, Bot, BookOpenCheck, BriefcaseBusiness, ChevronRight, ClipboardList, ExternalLink, FileText, Home, ImageIcon, Layers3, LogOut, Mail, Menu, Newspaper, SearchCheck, Settings2, UserRound, X } from "lucide-react";
import { logout } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navSections = [
  { label: "Workspace", links: [
    ["Overview", "/admin", Home],
  ] },
  { label: "Publish", links: [
    ["Posts", "/admin/posts", FileText],
    ["Series", "/admin/series", Layers3],
    ["Knowledge", "/admin/content", BookOpenCheck],
    ["Media", "/admin/media", ImageIcon],
    ["Newsletter", "/admin/newsletter", Newspaper],
  ] },
  { label: "Portfolio", links: [
    ["Projects", "/admin/projects", BriefcaseBusiness],
    ["Experience", "/admin/experience", UserRound],
    ["Profile", "/admin/profile", Settings2],
    ["Hire", "/admin/hire", SearchCheck],
  ] },
  { label: "Audience & intelligence", links: [
    ["Analytics", "/admin/analytics", BarChart3],
    ["Ask AI", "/admin/ai", Bot],
    ["Messages", "/admin/messages", Mail],
  ] },
  { label: "System", links: [
    ["Quality", "/admin/quality", Accessibility],
    ["Audit", "/admin/audit", ClipboardList],
  ] },
] as const;

export function AdminNav({
  name,
  portrait,
  siteName,
}: {
  name?: string | null;
  portrait: string;
  siteName: string;
}) {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center justify-between gap-2 border-b border-border p-4">
          <Link href="/admin" className="flex min-w-0 items-center gap-3 font-bold tracking-tight">
            <span className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
              <img src={portrait} alt="" width={40} height={40} className="h-full w-full object-cover" />
            </span>
            <span className="truncate">{siteName} Admin</span>
          </Link>
          <ThemeToggle />
        </div>
        <p className="px-5 pt-5 text-xs leading-5 text-muted-foreground">Signed in as<br /><strong className="text-foreground">{name || "Administrator"}</strong></p>
        <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4" aria-label="Dashboard navigation">
          <div className="space-y-5">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground/70">{section.label}</p>
                <div className="space-y-1">
                  {section.links.map(([label, href, Icon]) => {
                    const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          active ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
        <div className="space-y-2 border-t border-border p-4">
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/" target="_blank"><ExternalLink className="size-4" /> View public site</Link>
          </Button>
          <form action={logout}>
            <Button type="submit" variant="ghost" className="w-full justify-start text-muted-foreground"><LogOut className="size-4" /> Sign out</Button>
          </form>
        </div>
      </aside>

      <Dialog.Root>
      <header className="sticky top-0 z-60 w-full min-w-0 max-w-full border-b border-border/70 bg-background/90 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-16 w-full min-w-0 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <Dialog.Trigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Open dashboard navigation">
                <Menu className="size-5" />
              </Button>
            </Dialog.Trigger>
            <Link href="/admin" className="flex items-center gap-3 font-bold tracking-tight">
              <span className="relative size-9 overflow-hidden rounded-lg border border-border bg-muted">
                <img src={portrait} alt="" width={36} height={36} className="h-full w-full object-cover" />
              </span>
              <span className="hidden sm:inline">{siteName} Admin</span>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-[90] flex w-[min(90vw,22rem)] flex-col overflow-hidden border-r border-border bg-background text-foreground shadow-2xl outline-none duration-300 ease-out data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left">
          <header className="flex items-center gap-3 border-b border-border/70 px-4 py-4 pr-14">
            <span className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-border bg-card shadow-neuro">
              <img src={portrait} alt="" width={40} height={40} className="h-full w-full object-cover" />
            </span>
            <div className="min-w-0">
              <Dialog.Title className="truncate text-sm font-extrabold tracking-tight">{siteName} Admin</Dialog.Title>
              <Dialog.Description className="mt-1 truncate text-xs text-muted-foreground">Content workspace</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-3" aria-label="Close dashboard navigation"><X className="size-5" aria-hidden="true" /></Button>
            </Dialog.Close>
          </header>

          <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4" aria-label="Dashboard navigation">
            <div className="space-y-5">
              {navSections.map((section) => (
                <div key={section.label}>
                  <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground/70">{section.label}</p>
                  <div className="space-y-1">
                    {section.links.map(([label, href, Icon]) => {
                      const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
                      return (
                        <Dialog.Close asChild key={href}>
                          <Link
                            href={href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "group flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                              active && "bg-muted text-foreground",
                            )}
                          >
                            <span className={cn(
                              "grid size-9 shrink-0 place-items-center rounded-lg border border-border/70 bg-card text-muted-foreground transition-colors group-hover:text-primary",
                              active && "border-primary/20 bg-primary/10 text-primary",
                            )}>
                              <Icon className="size-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1 truncate">{label}</span>
                            <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                          </Link>
                        </Dialog.Close>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <footer className="space-y-3 border-t border-border/70 bg-card/35 p-4">
            <div className="flex min-w-0 items-center gap-3 px-1">
              <span className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                <img src={portrait} alt="" width={36} height={36} className="h-full w-full object-cover" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{name || "Administrator"}</p>
                <p className="truncate text-xs text-muted-foreground">Signed in to {siteName}</p>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/" target="_blank"><ExternalLink className="size-4" aria-hidden="true" /> View public site</Link>
              </Button>
            </Dialog.Close>
            <form action={logout}>
              <Button type="submit" variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10"><LogOut className="size-4" aria-hidden="true" /> Sign out</Button>
            </form>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
