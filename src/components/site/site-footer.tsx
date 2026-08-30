import Link from "next/link";
import { Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/site/brand-icons";
import { profile as defaultProfile } from "@/content/profile";

export function SiteFooter({ profile = defaultProfile }: { profile?: typeof defaultProfile }) {
  return (
    <footer className="border-t border-border py-10">
      <div className="container-shell flex flex-col gap-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p>© {new Date().getFullYear()} {profile.displayName}. Built with Next.js and MySQL.</p>
          <p className="mt-1 text-xs">{profile.eyebrow}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/hire" className="hover:text-primary">Hire</Link>
          <Link href="/ask" className="hover:text-primary">Ask AI</Link>
          <Link href="/uses" className="hover:text-primary">Uses</Link>
          <Link href="/now" className="hover:text-primary">Now</Link>
          <Link href="/newsletter/archive" className="hover:text-primary">Newsletter</Link>
          <Link href="/changelog" className="hover:text-primary">Changelog</Link>
          <Link href="/privacy" className="hover:text-primary">Privacy</Link>
          <Link href="/security" className="hover:text-primary">Security</Link>
          <Link href={profile.linkedin} target="_blank" aria-label="LinkedIn" className="hover:text-primary"><LinkedInIcon className="size-4" /></Link>
          {profile.github ? <Link href={profile.github} target="_blank" aria-label="GitHub" className="hover:text-primary"><GitHubIcon className="size-4" /></Link> : null}
          <Link href={`mailto:${profile.email}`} aria-label="Email" className="hover:text-primary"><Mail className="size-4" /></Link>
          <Link href="/admin/login" className="hover:text-primary">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
