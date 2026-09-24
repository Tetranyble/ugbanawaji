import { NextResponse } from "next/server";
import { getSitePage } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getSitePage(slug);
  if (!page) return NextResponse.json({ page: null }, { status: 404 });
  return NextResponse.json({
    page: {
      slug: page.slug,
      title: page.title,
      sections: page.sections.map((section) => ({
        key: section.key,
        component: section.component,
        eyebrow: section.eyebrow,
        title: section.title,
        description: section.description,
        body: section.body,
        items: section.items.map((item) => ({ key: item.key, value: item.value, title: item.title, subtitle: item.subtitle, description: item.description, href: item.href })),
        actions: section.actions.map((action) => ({ key: action.key, label: action.label, href: action.href, variant: action.variant, external: action.external })),
      })),
    },
  });
}
