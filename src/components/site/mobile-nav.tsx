"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { profile as defaultProfile } from "@/content/profile";

const nav = [
  ["Focus", "/#expertise"],
  ["Case studies", "/work"],
  ["Experience", "/#experience"],
  ["Technical writing", "/blog"],
  ["Engineering principles", "/principles"],
  ["Search", "/search"],
  ["Ask Ugbanawaji", "/ask"],
  ["Hire", "/hire"],
  ["About", "/#about"],
  ["Contact", "/#contact"],
] as const;

export function MobileNav({ profile = defaultProfile }: { profile?: typeof defaultProfile }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu className="size-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-[90] w-[min(88vw,380px)] border-l border-border bg-background p-6 shadow-2xl focus:outline-none">
          <div className="flex items-center justify-between">
            <div>
              <Dialog.Title className="font-extrabold tracking-tight">{profile.siteName}</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-muted-foreground">{profile.eyebrow}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close navigation"><X className="size-5" /></Button>
            </Dialog.Close>
          </div>
          <nav className="mt-10 grid gap-2" aria-label="Mobile navigation">
            {nav.map(([label, href]) => (
              <Dialog.Close asChild key={href}>
                <Link href={href} className="rounded-xl px-4 py-3 text-base font-semibold text-foreground hover:bg-muted hover:text-primary">
                  {label}
                </Link>
              </Dialog.Close>
            ))}
          </nav>
          <div className="mt-8 border-t border-border pt-6 text-sm leading-6 text-muted-foreground">
            {profile.headline}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
