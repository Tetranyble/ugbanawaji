import Link from "next/link";
import { Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/site/brand-icons";
import type { NavigationItem, PortfolioProfile } from "@/lib/portfolio-types";
import type { SiteChromeCopy } from "@/components/site/site-chrome-copy";

export function SiteFooter({ profile, navigation, copy }: { profile: PortfolioProfile; navigation: NavigationItem[]; copy: SiteChromeCopy["footer"] }) {
  const footerNav = navigation.filter((item) => item.placement === "FOOTER");
  const copyright=copy.copyright.replace("{year}",String(new Date().getFullYear())).replace("{name}",profile.displayName||profile.siteName);
  return <footer className="border-t border-border py-10"><div className="container-shell flex flex-col gap-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><div><p>{copyright}</p><p className="mt-1 text-xs">{profile.eyebrow}</p></div><div className="flex flex-wrap items-center gap-4">{footerNav.map((item)=><Link key={item.id} href={item.href} target={item.external?"_blank":undefined} className="hover:text-primary">{item.label}</Link>)}{profile.linkedin?<Link href={profile.linkedin} target="_blank" aria-label={copy.linkedinAria} className="hover:text-primary"><LinkedInIcon className="size-4" /></Link>:null}{profile.github?<Link href={profile.github} target="_blank" aria-label={copy.githubAria} className="hover:text-primary"><GitHubIcon className="size-4" /></Link>:null}{profile.email?<Link href={`mailto:${profile.email}`} aria-label={copy.emailAria} className="hover:text-primary"><Mail className="size-4" /></Link>:null}{copy.adminLabel?<Link href={copy.adminHref} className="hover:text-primary">{copy.adminLabel}</Link>:null}</div></div></footer>;
}
