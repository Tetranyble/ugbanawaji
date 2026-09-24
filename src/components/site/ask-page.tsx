import { AskChat } from "@/components/site/ask-chat";
import { getAskStarterPrompts, getSitePage } from "@/lib/data";
import { itemValue } from "@/lib/page-content";

export async function AskPageView({ initialConversationId }: { initialConversationId?: string }) {
  const [page, prompts] = await Promise.all([getSitePage("ask"), getAskStarterPrompts()]);
  if (!page) return null;

  const hero = page.sectionMap.hero;
  const chat = page.sectionMap.chat;
  if (!chat) return null;

  return (
    <main className="min-h-[calc(100svh-4.5rem)] py-10 sm:py-14">
      <div className="container-shell max-w-5xl">
        <header className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">{hero?.title || page.title}</h1>
          {hero?.description ? <p className="mt-2 text-base text-muted-foreground">{hero.description}</p> : null}
        </header>
        <AskChat
          initialConversationId={initialConversationId}
          prompts={prompts.map(({ label, question }) => ({ label, question }))}
          copy={{
            newChat: itemValue(chat, "newChat"),
            copyLink: itemValue(chat, "copyLink", "Copy chat link"),
            copiedLink: itemValue(chat, "copiedLink", "Link copied"),
            loadFailed: itemValue(chat, "loadFailed", "This conversation could not be loaded."),
            sourcesSingular: itemValue(chat, "sourcesSingular"),
            sourcesPlural: itemValue(chat, "sourcesPlural"),
            helpfulAria: itemValue(chat, "helpfulAria"),
            unhelpfulAria: itemValue(chat, "unhelpfulAria"),
            thinking: itemValue(chat, "thinking"),
            questionAria: itemValue(chat, "questionAria"),
            placeholder: itemValue(chat, "placeholder"),
            sendAria: itemValue(chat, "sendAria"),
            unavailable: itemValue(chat, "unavailable"),
            requestFailed: itemValue(chat, "requestFailed"),
          }}
        />
      </div>
    </main>
  );
}
