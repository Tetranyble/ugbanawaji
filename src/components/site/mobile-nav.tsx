"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Bot,
  BriefcaseBusiness,
  ChevronRight,
  Compass,
  ExternalLink,
  FileText,
  Layers3,
  Mail,
  Menu,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NavigationItem, PortfolioProfile } from "@/lib/portfolio-types";
import type { SiteChromeCopy } from "@/components/site/site-chrome-copy";
import { cn } from "@/lib/utils";

function iconFor(href: string): LucideIcon {
  const destination = href.toLowerCase();
  if (destination.includes("contact")) return Mail;
  if (destination.includes("experience")) return Layers3;
  if (destination.includes("expertise") || destination.includes("principles")) return Compass;
  if (destination.includes("work")) return BriefcaseBusiness;
  if (destination.includes("blog")) return FileText;
  if (destination.includes("ask")) return Bot;
  if (destination.includes("hire")) return UsersRound;
  if (destination.includes("about")) return UserRound;
  return ChevronRight;
}

function isActive(pathname: string, href: string) {
  if (href.includes("#") || href.startsWith("http")) return false;
  const path = href.split("?")[0];
  return pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
}

export function MobileNav({
  profile,
  navigation,
  copy,
}: {
  profile: PortfolioProfile;
  navigation: NavigationItem[];
  copy: SiteChromeCopy["mobile"];
}) {
  const pathname = usePathname();

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={copy.openAria}>
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-[90] flex w-[min(90vw,22rem)] flex-col overflow-hidden border-l border-border bg-background text-foreground shadow-2xl outline-none duration-300 ease-out data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right">
          <header className="flex items-center gap-3 border-b border-border/70 px-4 py-4 pr-14">
            <span className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-border bg-card shadow-neuro">
              {profile.portrait ? (
                <img src={profile.portrait} alt="" width={40} height={40} className="h-full w-full object-cover" />
              ) : null}
            </span>
            <div className="min-w-0">
              <Dialog.Title className="truncate text-sm font-extrabold tracking-tight">{profile.siteName}</Dialog.Title>
              <Dialog.Description className="mt-1 truncate text-xs text-muted-foreground">{profile.eyebrow}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="absolute right-3 top-3" aria-label={copy.closeAria}>
                <X className="size-5" aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground/70">Explore</p>
            <nav className="grid gap-1" aria-label={copy.navAria}>
              {navigation.map((item) => {
                const Icon = iconFor(item.href);
                const active = isActive(pathname, item.href);
                return (
                  <Dialog.Close asChild key={item.id}>
                    <Link
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noreferrer" : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                        active && "bg-muted text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-lg border border-border/70 bg-card text-muted-foreground transition-colors group-hover:text-primary",
                          active && "border-primary/20 bg-primary/10 text-primary",
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.external ? (
                        <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      )}
                    </Link>
                  </Dialog.Close>
                );
              })}
            </nav>
          </div>

          <footer className="border-t border-border/70 bg-card/35 p-4">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-primary">{profile.displayName}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{profile.headline}</p>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
