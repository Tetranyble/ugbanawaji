"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import type { NavigationItem, PortfolioProfile } from "@/lib/portfolio-types";
import type { SiteChromeCopy } from "@/components/site/site-chrome-copy";
export function SiteChrome({children,profile,navigation,copy}:{children:ReactNode;profile:PortfolioProfile;navigation:NavigationItem[];copy:SiteChromeCopy}){const pathname=usePathname();if(pathname.startsWith("/admin"))return <>{children}</>;return <><SiteHeader profile={profile} navigation={navigation} copy={copy}/>{children}<SiteFooter profile={profile} navigation={navigation} copy={copy.footer}/></>}
