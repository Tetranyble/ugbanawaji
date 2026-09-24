import type { Metadata } from "next";
import type { PublicPageSection, PublicSitePage } from "@/lib/data";

export function sectionItem(section: PublicPageSection | null | undefined, key: string) {
  return section?.itemMap?.[key];
}

export function itemValue(section: PublicPageSection | null | undefined, key: string, fallback = "") {
  return sectionItem(section, key)?.value ?? fallback;
}

export function itemTitle(section: PublicPageSection | null | undefined, key: string, fallback = "") {
  return sectionItem(section, key)?.title ?? fallback;
}

export function itemSubtitle(section: PublicPageSection | null | undefined, key: string, fallback = "") {
  return sectionItem(section, key)?.subtitle ?? fallback;
}

export function itemDescription(section: PublicPageSection | null | undefined, key: string, fallback = "") {
  return sectionItem(section, key)?.description ?? fallback;
}

export function sectionAction(section: PublicPageSection | null | undefined, key: string) {
  return section?.actionMap?.[key];
}

export function pageMetadata(page: PublicSitePage | null): Metadata {
  return {
    title: page?.seoTitle || page?.title || undefined,
    description: page?.seoDescription || undefined,
    alternates: page?.route && !page.route.includes("[") ? { canonical: page.route } : undefined,
  };
}

export function actionTarget(action: { external: boolean; href: string } | null | undefined) {
  if (!action) return {};
  return action.external ? { target: "_blank" as const, rel: "noreferrer" } : {};
}
