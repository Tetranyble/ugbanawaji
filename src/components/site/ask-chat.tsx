"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, Bot, BookOpen, Check, Copy, LoaderCircle, Plus, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Source = { title: string; url: string };
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  messageId?: string;
  error?: boolean;
};
type Rating = "HELPFUL" | "NOT_HELPFUL";
type StoredChat = {
  messages: Message[];
  conversationId?: string;
  draft: string;
  ratings: Record<string, Rating>;
};

const chatStorageKey = "ugbanawaji-ai-chat";
const sessionStorageKey = "ugbanawaji-ai-session";
const chatChangedEvent = "ugbanawaji-ai-chat-changed";
const emptyChat: StoredChat = { messages: [], draft: "", ratings: {} };
const emptyChatSnapshot = JSON.stringify(emptyChat);
let memorySnapshot = emptyChatSnapshot;
let memorySessionId: string | undefined;



function getSession() {
  try {
    let value = sessionStorage.getItem(sessionStorageKey);
    if (!value) {
      value = crypto.randomUUID();
      sessionStorage.setItem(sessionStorageKey, value);
    }
    return value;
  } catch {
    memorySessionId ??= crypto.randomUUID();
    return memorySessionId;
  }
}

function parseChat(snapshot: string): StoredChat {
  try {
    const value = JSON.parse(snapshot) as Partial<StoredChat>;
    return {
      messages: Array.isArray(value.messages) ? value.messages.slice(-50) : [],
      conversationId: typeof value.conversationId === "string" ? value.conversationId : undefined,
      draft: typeof value.draft === "string" ? value.draft.slice(0, 1200) : "",
      ratings: value.ratings && typeof value.ratings === "object" ? value.ratings : {},
    };
  } catch {
    return emptyChat;
  }
}

function getChatSnapshot() {
  try {
    return sessionStorage.getItem(chatStorageKey) ?? memorySnapshot;
  } catch {
    return memorySnapshot;
  }
}

function getServerChatSnapshot() {
  return emptyChatSnapshot;
}

function subscribeToChat(onStoreChange: () => void) {
  window.addEventListener(chatChangedEvent, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(chatChangedEvent, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function writeChat(next: StoredChat) {
  const snapshot = JSON.stringify({ ...next, messages: next.messages.slice(-50) });
  memorySnapshot = snapshot;
  try {
    sessionStorage.setItem(chatStorageKey, snapshot);
  } catch {}
  window.dispatchEvent(new Event(chatChangedEvent));
}

function updateChat(update: (current: StoredChat) => StoredChat) {
  writeChat(update(parseChat(getChatSnapshot())));
}

function uniqueSources(sources: Source[] = []) {
  return sources.filter(
    (source, index) => sources.findIndex((item) => item.url === source.url) === index,
  );
}

export type AskChatCopy = {
  newChat: string; copyLink: string; copiedLink: string; loadFailed: string;
  sourcesSingular: string; sourcesPlural: string; helpfulAria: string; unhelpfulAria: string;
  thinking: string; questionAria: string; placeholder: string; sendAria: string; unavailable: string; requestFailed: string;
};

export function AskChat({ initialConversationId, prompts, copy }: { initialConversationId?: string; prompts: Array<{ label: string; question: string }>; copy: AskChatCopy }) {
  const router = useRouter();
  const snapshot = useSyncExternalStore(
    subscribeToChat,
    getChatSnapshot,
    getServerChatSnapshot,
  );
  const chat = useMemo(() => parseChat(snapshot), [snapshot]);
  const { messages, draft: question, ratings } = chat;
  const [busy, setBusy] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [copied, setCopied] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const conversationEnd = useRef<HTMLDivElement>(null);
  const requestVersion = useRef(0);
  const loadedConversation = useRef<string | undefined>(undefined);
  const restoringConversation = Boolean(
    initialConversationId && !loadError && chat.conversationId !== initialConversationId,
  );
  const conversationPending = loadingConversation || restoringConversation;

  useEffect(() => {
    if (initialConversationId || !chat.conversationId || !messages.length) return;
    router.replace(`/ask/${encodeURIComponent(chat.conversationId)}`, { scroll: false });
  }, [chat.conversationId, initialConversationId, messages.length, router]);

  useEffect(() => {
    if (!initialConversationId || loadedConversation.current === initialConversationId) return;
    loadedConversation.current = initialConversationId;
    const stored = parseChat(getChatSnapshot());
    if (stored.conversationId === initialConversationId && stored.messages.length) return;

    let cancelled = false;
    setLoadingConversation(true);
    setLoadError("");
    writeChat({ ...emptyChat, conversationId: initialConversationId });

    void fetch(`/api/ask?conversationId=${encodeURIComponent(initialConversationId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || copy.loadFailed);
        if (cancelled) return;
        writeChat({
          messages: Array.isArray(data.messages) ? data.messages : [],
          conversationId: data.conversationId,
          draft: "",
          ratings: {},
        });
      })
      .catch((error) => {
        if (cancelled) return;
        writeChat(emptyChat);
        setLoadError(error instanceof Error ? error.message : copy.loadFailed);
      })
      .finally(() => {
        if (!cancelled) setLoadingConversation(false);
      });

    return () => { cancelled = true; };
  }, [initialConversationId, copy.loadFailed]);

  useEffect(() => {
    conversationEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function ask(value: string) {
    const nextQuestion = value.trim();
    if (!nextQuestion || busy || conversationPending) return;

    const version = ++requestVersion.current;
    updateChat((current) => ({
      ...current,
      draft: "",
      messages: [
        ...current.messages,
        { id: crypto.randomUUID(), role: "user", content: nextQuestion },
      ],
    }));
    if (textarea.current) textarea.current.style.height = "auto";
    setBusy(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: nextQuestion,
          sessionId: getSession(),
          conversationId: parseChat(getChatSnapshot()).conversationId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || copy.requestFailed);
      if (version !== requestVersion.current) return;
      updateChat((current) => ({
        ...current,
        conversationId: data.conversationId,
        messages: [
          ...current.messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.answer,
            sources: data.sources,
            messageId: data.messageId,
          },
        ],
      }));
      router.replace(`/ask/${encodeURIComponent(data.conversationId)}`, { scroll: false });
    } catch (error) {
      if (version !== requestVersion.current) return;
      updateChat((current) => ({
        ...current,
        messages: [
          ...current.messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: error instanceof Error ? error.message : copy.unavailable,
            error: true,
          },
        ],
      }));
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }

  async function sendFeedback(messageId: string, rating: Rating) {
    updateChat((current) => ({
      ...current,
      ratings: { ...current.ratings, [messageId]: rating },
    }));
    await fetch("/api/ask/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messageId, rating }),
    }).catch(() => undefined);
  }

  function startNewChat() {
    requestVersion.current += 1;
    setBusy(false);
    memorySessionId = undefined;
    try {
      sessionStorage.removeItem(sessionStorageKey);
    } catch {}
    writeChat(emptyChat);
    loadedConversation.current = undefined;
    setLoadError("");
    setCopied(false);
    router.replace("/ask", { scroll: false });
    textarea.current?.focus();
  }

  async function copyConversationLink() {
    if (!chat.conversationId) return;
    const url = new URL(`/ask/${chat.conversationId}`, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const fallback = document.createElement("textarea");
      fallback.value = url;
      fallback.style.position = "fixed";
      fallback.style.opacity = "0";
      document.body.appendChild(fallback);
      fallback.select();
      document.execCommand("copy");
      fallback.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const hasMessages = messages.length > 0;

  return (
    <section className="mx-auto max-w-4xl">
      <div className={hasMessages ? "mt-10" : "flex min-h-[44vh] flex-col justify-center py-10"}>
        {!hasMessages && !conversationPending ? (
          <div className="mb-5 flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <button
                key={prompt.label}
                type="button"
                onClick={() => void ask(prompt.question)}
                className="rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/30 hover:bg-card hover:text-foreground"
              >
                {prompt.label}
              </button>
            ))}
          </div>
        ) : null}

        {conversationPending ? (
          <div className="flex min-h-[16rem] items-center justify-center text-sm text-muted-foreground" role="status">
            <LoaderCircle className="mr-2 size-4 animate-spin" /> {copy.thinking}
          </div>
        ) : null}

        {loadError ? <p className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{loadError}</p> : null}

        {hasMessages ? (
          <>
          <div className="mb-5 flex flex-wrap justify-end gap-2">
            {chat.conversationId ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => void copyConversationLink()} className="text-muted-foreground">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? copy.copiedLink : copy.copyLink}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={startNewChat}
              className="text-muted-foreground"
            >
              <Plus className="size-4" /> {copy.newChat}
            </Button>
          </div>
          <div className="space-y-8 pb-4" aria-live="polite">
            {messages.map((message) => {
              const sources = uniqueSources(message.sources);
              const rating = message.messageId ? ratings[message.messageId] : undefined;

              if (message.role === "user") {
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="mp-sensitive max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-white sm:max-w-[72%]">
                      {message.content}
                    </div>
                  </div>
                );
              }

              return (
                <article key={message.id} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 sm:gap-4">
                  <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
                    <Bot className="size-4" />
                  </span>
                  <div className="min-w-0 pt-1">
                    <div className={message.error ? "text-sm text-destructive" : "ask-answer"}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>

                    {sources.length ? (
                      <details className="group mt-4 text-sm">
                        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
                          <BookOpen className="size-4" />
                          {sources.length} {sources.length === 1 ? copy.sourcesSingular : copy.sourcesPlural}
                        </summary>
                        <div className="mt-2 flex flex-wrap gap-2 pl-1">
                          {sources.map((source, index) => (
                            <Link
                              key={source.url}
                              href={source.url}
                              className="max-w-full truncate rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/35 hover:text-primary"
                            >
                              {index + 1}. {source.title}
                            </Link>
                          ))}
                        </div>
                      </details>
                    ) : null}

                    {message.messageId ? (
                      <div className="mt-3 flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={rating === "HELPFUL" ? "size-8 text-primary" : "size-8 text-muted-foreground"}
                          aria-label={copy.helpfulAria}
                          aria-pressed={rating === "HELPFUL"}
                          onClick={() => void sendFeedback(message.messageId!, "HELPFUL")}
                        >
                          <ThumbsUp className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={rating === "NOT_HELPFUL" ? "size-8 text-primary" : "size-8 text-muted-foreground"}
                          aria-label={copy.unhelpfulAria}
                          aria-pressed={rating === "NOT_HELPFUL"}
                          onClick={() => void sendFeedback(message.messageId!, "NOT_HELPFUL")}
                        >
                          <ThumbsDown className="size-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}

            {busy ? (
              <div className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 text-sm text-muted-foreground sm:gap-4">
                <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
                  <Bot className="size-4" />
                </span>
                <span className="flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" /> {copy.thinking}
                </span>
              </div>
            ) : null}
            <div ref={conversationEnd} />
          </div>
          </>
        ) : null}

        <form
          className={`${hasMessages ? "sticky bottom-4 mt-8" : ""} z-20 flex items-end gap-2 rounded-[1.75rem] border border-border/90 bg-background/95 p-2 pl-5 shadow-[0_12px_36px_rgba(15,23,42,0.13)] backdrop-blur-xl transition focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 dark:shadow-[0_14px_38px_rgba(0,0,0,0.32)]`}
          onSubmit={(event) => {
            event.preventDefault();
            void ask(question);
          }}
        >
          <Textarea
            ref={textarea}
            value={question}
            onChange={(event) => {
              const draft = event.target.value;
              updateChat((current) => ({ ...current, draft }));
            }}
            onInput={(event) => {
              event.currentTarget.style.height = "auto";
              event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 160)}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            maxLength={1200}
            disabled={conversationPending}
            aria-label={copy.questionAria}
            placeholder={copy.placeholder}
            className="max-h-40 min-h-12 resize-none border-0 bg-transparent px-0 py-3 text-base leading-6 shadow-none focus:border-transparent focus:ring-0"
          />
          <Button
            type="submit"
            size="icon"
            disabled={busy || conversationPending || question.trim().length < 3}
            className="size-11 shrink-0 rounded-full p-0 shadow-none hover:translate-y-0"
            aria-label={copy.sendAria}
          >
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUp className="size-5" />}
          </Button>
        </form>
      </div>
    </section>
  );
}
