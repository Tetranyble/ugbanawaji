import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AskPageView } from "@/components/site/ask-page";
import { getSitePage } from "@/lib/data";
import { pageMetadata } from "@/lib/page-content";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getSitePage("ask"));
}

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  if (!uuidPattern.test(conversationId)) notFound();
  return <AskPageView initialConversationId={conversationId} />;
}
