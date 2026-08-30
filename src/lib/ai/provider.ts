export interface AiProvider {
  name: string;
  embedMany(texts: string[]): Promise<number[][]>;
  generate(input: { system: string; user: string }): Promise<string>;
}

export interface ChatProvider {
  name: string;
  model: string;
  generate(input: { system: string; user: string }): Promise<string>;
}

export interface EmbeddingProvider {
  name: string;
  model: string;
  embedMany(texts: string[]): Promise<number[][]>;
}

type OpenAiResponsesPayload = {
  output_text?: unknown;
  output?: Array<{ content?: Array<{ type?: unknown; text?: unknown }> }>;
  error?: { message?: string };
};

type EmbeddingsPayload = {
  data?: Array<{ index: number; embedding: number[] }>;
  error?: { message?: string };
};

type ChatCompletionsPayload = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  error?: { message?: string };
};

type OllamaChatPayload = {
  message?: { content?: unknown };
  error?: string;
};

type OllamaEmbedPayload = {
  embeddings?: number[][];
  error?: string;
};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function openAiResponsesText(payload: OpenAiResponsesPayload): string {
  if (typeof payload.output_text === "string") return payload.output_text.trim();

  const parts: string[] = [];
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n").trim();
}

function chatCompletionText(payload: ChatCompletionsPayload): string {
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part || typeof part !== "object") return "";
        const value = part as { type?: unknown; text?: unknown };
        return (value.type === "text" || value.type === "output_text") && typeof value.text === "string"
          ? value.text
          : "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

function authorizationHeaders(apiKey: string): Record<string, string> {
  return apiKey ? { authorization: `Bearer ${apiKey}` } : {};
}

function configuredTimeoutMs() {
  const value = Number(process.env.AI_REQUEST_TIMEOUT_MS);
  return Number.isFinite(value) && value >= 5_000 ? value : 180_000;
}

async function jsonRequest<T>(
  url: string,
  body: unknown,
  options: { apiKey?: string; timeoutMs?: number } = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? configuredTimeoutMs());

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authorizationHeaders(options.apiKey ?? ""),
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });

    const raw = await response.text();
    let payload: unknown = {};
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch {
      payload = { error: { message: raw || `Provider returned HTTP ${response.status}` } };
    }

    if (!response.ok) {
      const errorPayload = payload as { error?: { message?: string } | string; message?: string };
      const message =
        typeof errorPayload.error === "string"
          ? errorPayload.error
          : errorPayload.error?.message || errorPayload.message || `AI provider request failed (${response.status})`;
      throw new Error(message);
    }

    return payload as T;
  } finally {
    clearTimeout(timer);
  }
}

class OpenAiChatProvider implements ChatProvider {
  name = "openai";
  model = process.env.OPENAI_CHAT_MODEL ?? "gpt-5.6-luna";
  private apiKey = process.env.OPENAI_API_KEY ?? "";

  async generate({ system, user }: { system: string; user: string }) {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is not configured");

    const payload = await jsonRequest<OpenAiResponsesPayload>(
      "https://api.openai.com/v1/responses",
      {
        model: this.model,
        input: [
          { role: "system", content: [{ type: "input_text", text: system }] },
          { role: "user", content: [{ type: "input_text", text: user }] },
        ],
        max_output_tokens: 900,
      },
      { apiKey: this.apiKey },
    );

    const text = openAiResponsesText(payload);
    if (!text) throw new Error("OpenAI returned an empty response");
    return text;
  }
}

class OpenAiEmbeddingProvider implements EmbeddingProvider {
  name = "openai";
  model = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
  private apiKey = process.env.OPENAI_API_KEY ?? "";

  async embedMany(texts: string[]) {
    if (!texts.length) return [];
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is not configured");

    const payload = await jsonRequest<EmbeddingsPayload>(
      "https://api.openai.com/v1/embeddings",
      { model: this.model, input: texts, encoding_format: "float" },
      { apiKey: this.apiKey },
    );

    return (payload.data ?? [])
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  }
}

class OllamaChatProvider implements ChatProvider {
  name = "ollama";
  model = process.env.OLLAMA_CHAT_MODEL ?? "qwen3:8b";
  private baseUrl = trimTrailingSlash(process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434");
  private apiKey = process.env.OLLAMA_API_KEY ?? "";

  async generate({ system, user }: { system: string; user: string }) {
    const payload = await jsonRequest<OllamaChatPayload>(
      `${this.baseUrl}/api/chat`,
      {
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        stream: false,
      },
      { apiKey: this.apiKey },
    );

    const text = typeof payload.message?.content === "string" ? payload.message.content.trim() : "";
    if (!text) throw new Error(payload.error || "Ollama returned an empty response");
    return text;
  }
}

class OllamaEmbeddingProvider implements EmbeddingProvider {
  name = "ollama";
  model = process.env.OLLAMA_EMBEDDING_MODEL ?? "nomic-embed-text";
  private baseUrl = trimTrailingSlash(process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434");
  private apiKey = process.env.OLLAMA_API_KEY ?? "";

  async embedMany(texts: string[]) {
    if (!texts.length) return [];

    const payload = await jsonRequest<OllamaEmbedPayload>(
      `${this.baseUrl}/api/embed`,
      { model: this.model, input: texts },
      { apiKey: this.apiKey },
    );

    if (!Array.isArray(payload.embeddings)) throw new Error(payload.error || "Ollama did not return embeddings");
    return payload.embeddings;
  }
}

class OpenAiCompatibleChatProvider implements ChatProvider {
  name: string;
  model: string;
  private baseUrl: string;
  private apiKey: string;

  constructor(providerName: "openai_compatible" | "kimi" = "openai_compatible") {
    this.name = providerName;
    const kimi = providerName === "kimi";
    this.model = kimi
      ? process.env.KIMI_CHAT_MODEL ?? process.env.AI_COMPATIBLE_CHAT_MODEL ?? "moonshotai/Kimi-K2.6"
      : process.env.AI_COMPATIBLE_CHAT_MODEL ?? "moonshotai/Kimi-K2.6";
    this.baseUrl = trimTrailingSlash(
      kimi
        ? process.env.KIMI_BASE_URL ?? process.env.AI_COMPATIBLE_BASE_URL ?? "http://127.0.0.1:8000/v1"
        : process.env.AI_COMPATIBLE_BASE_URL ?? "http://127.0.0.1:8000/v1",
    );
    this.apiKey = kimi
      ? process.env.KIMI_API_KEY ?? process.env.AI_COMPATIBLE_API_KEY ?? ""
      : process.env.AI_COMPATIBLE_API_KEY ?? "";
  }

  async generate({ system, user }: { system: string; user: string }) {
    const payload = await jsonRequest<ChatCompletionsPayload>(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 900,
        stream: false,
      },
      { apiKey: this.apiKey },
    );

    const text = chatCompletionText(payload);
    if (!text) throw new Error(payload.error?.message || "OpenAI-compatible provider returned an empty response");
    return text;
  }
}

class OpenAiCompatibleEmbeddingProvider implements EmbeddingProvider {
  name = "openai_compatible";
  model = process.env.AI_COMPATIBLE_EMBEDDING_MODEL ?? "";
  private baseUrl = trimTrailingSlash(process.env.AI_COMPATIBLE_BASE_URL ?? "http://127.0.0.1:8000/v1");
  private apiKey = process.env.AI_COMPATIBLE_API_KEY ?? "";

  async embedMany(texts: string[]) {
    if (!texts.length) return [];
    if (!this.model) throw new Error("AI_COMPATIBLE_EMBEDDING_MODEL is not configured");

    const payload = await jsonRequest<EmbeddingsPayload>(
      `${this.baseUrl}/embeddings`,
      { model: this.model, input: texts, encoding_format: "float" },
      { apiKey: this.apiKey },
    );

    return (payload.data ?? [])
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  }
}

class DisabledChatProvider implements ChatProvider {
  name = "disabled";
  model = "disabled";
  async generate(_input: { system: string; user: string }): Promise<string> {
    throw new Error("AI chat provider is not configured");
  }
}

class DisabledEmbeddingProvider implements EmbeddingProvider {
  name = "disabled";
  model = "disabled";
  async embedMany(_texts: string[]): Promise<number[][]> {
    return [];
  }
}

function normalizedProviderName(value: string | undefined, fallback: string) {
  return (value || fallback).trim().toLowerCase().replace(/-/g, "_");
}

function legacyProviderName() {
  return normalizedProviderName(process.env.AI_PROVIDER, "openai");
}

export function getChatProvider(): ChatProvider {
  const name = normalizedProviderName(process.env.AI_CHAT_PROVIDER, legacyProviderName());

  if (name === "openai") return process.env.OPENAI_API_KEY ? new OpenAiChatProvider() : new DisabledChatProvider();
  if (name === "ollama") return new OllamaChatProvider();
  if (name === "kimi") return new OpenAiCompatibleChatProvider("kimi");
  if (name === "openai_compatible" || name === "compatible") return new OpenAiCompatibleChatProvider();
  return new DisabledChatProvider();
}

export function getEmbeddingProvider(): EmbeddingProvider {
  const name = normalizedProviderName(process.env.AI_EMBEDDING_PROVIDER, legacyProviderName());

  if (name === "openai") return process.env.OPENAI_API_KEY ? new OpenAiEmbeddingProvider() : new DisabledEmbeddingProvider();
  if (name === "ollama") return new OllamaEmbeddingProvider();
  if (name === "openai_compatible" || name === "compatible") return new OpenAiCompatibleEmbeddingProvider();
  return new DisabledEmbeddingProvider();
}

class CompositeAiProvider implements AiProvider {
  constructor(
    private readonly chat: ChatProvider,
    private readonly embeddings: EmbeddingProvider,
  ) {}

  get name() {
    return this.chat.name === this.embeddings.name
      ? this.chat.name
      : `${this.chat.name}+${this.embeddings.name}`;
  }

  embedMany(texts: string[]) {
    return this.embeddings.embedMany(texts);
  }

  generate(input: { system: string; user: string }) {
    return this.chat.generate(input);
  }
}

/**
 * Backward-compatible facade for callers that want one AI object. New code can
 * use getChatProvider() and getEmbeddingProvider() independently.
 */
export function getAiProvider(): AiProvider {
  return new CompositeAiProvider(getChatProvider(), getEmbeddingProvider());
}

export function getAiConfigurationSummary() {
  const chat = getChatProvider();
  const embeddings = getEmbeddingProvider();
  return {
    chat: { provider: chat.name, model: chat.model },
    embeddings: { provider: embeddings.name, model: embeddings.model },
  };
}
