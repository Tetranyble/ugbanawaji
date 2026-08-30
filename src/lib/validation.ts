import { z } from "zod";

const imageReferenceSchema = z.string().max(1000).refine((value) => {
  if (!value) return true;
  if (/^\/api\/media\/[a-zA-Z0-9_-]+$/.test(value)) return true;
  if (/^\/(?!\/)[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(value)) return true;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol); } catch { return false; }
}, "Use an uploaded media item, a local path, or a valid http(s) image URL.");

const youtubeSchema = z.string().max(700).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "www.youtube-nocookie.com", "youtube-nocookie.com"].includes(url.hostname);
  } catch { return false; }
}, "Use a valid YouTube URL.");

export const signInSchema = z.object({ email: z.string().email().max(191), password: z.string().min(12).max(128) });

export const contactSchema = z.object({
  name: z.string().min(2).max(160), email: z.string().email().max(191), subject: z.string().max(220).optional().default(""),
  message: z.string().min(10).max(10000), website: z.string().max(0).optional().default(""),
});

export const postSchema = z.object({
  title: z.string().min(4).max(220),
  slug: z.string().min(3).max(220).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().min(20).max(1000),
  content: z.string().min(20),
  contentJson: z.string().optional().default(""),
  coverImage: imageReferenceSchema,
  youtubeUrl: youtubeSchema,
  categories: z.array(z.string().min(1).max(120)).max(6),
  tags: z.array(z.string().min(1).max(80)).max(20),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
  contentType: z.enum(["ARTICLE", "ENGINEERING_NOTE", "ADR", "SYSTEM_DESIGN", "READING_NOTE"]).default("ARTICLE"),
  seriesId: z.string().max(36).optional().default(""),
  seriesOrder: z.coerce.number().int().min(0).max(10000).default(0),
  publishedAt: z.string().optional().default(""),
  seoTitle: z.string().max(220).optional().default(""),
  seoDescription: z.string().max(320).optional().default(""),
});

export const newsletterSubscriberSchema = z.object({
  email: z.string().email().max(191), name: z.string().max(160).optional().default(""), website: z.string().max(0).optional().default(""),
});

export const newsletterCampaignSchema = z.object({
  title: z.string().min(3).max(220), subject: z.string().min(3).max(220), preheader: z.string().max(320).optional().default(""),
  content: z.string().min(20), slug: z.string().max(220).regex(/^[a-z0-9-]*$/).optional().default(""), publicArchive: z.boolean().default(false), status: z.enum(["DRAFT", "SCHEDULED", "SENDING", "SENT", "PAUSED"]), scheduledAt: z.string().optional().default(""),
});

export const projectSchema = z.object({
  title: z.string().min(3).max(220), slug: z.string().min(3).max(220).regex(/^[a-z0-9-]+$/), kind: z.string().min(2).max(120),
  summary: z.string().min(20).max(3000), lifecycleStatus: z.enum(["PRODUCTION", "ACTIVE_DEVELOPMENT", "RESEARCH", "OPEN_SOURCE", "ARCHIVED"]),
  problem: z.string().max(15000).optional().default(""), constraints: z.string().max(15000).optional().default(""), challenge: z.string().max(15000).optional().default(""), solution: z.string().max(15000).optional().default(""),
  architecture: z.string().max(20000).optional().default(""), decisions: z.string().max(15000).optional().default(""), tradeoffs: z.string().max(15000).optional().default(""), implementation: z.string().max(20000).optional().default(""), reliabilitySecurity: z.string().max(15000).optional().default(""), impact: z.string().max(15000).optional().default(""), lessonsLearned: z.string().max(15000).optional().default(""), whatDifferently: z.string().max(15000).optional().default(""), confidentialityNote: z.string().max(2000).optional().default(""), diagrams: z.array(z.object({ title: z.string().max(180), mermaid: z.string().max(20000) })).max(10), codeSamples: z.array(z.object({ title: z.string().max(180), language: z.string().max(40), code: z.string().max(30000), explanation: z.string().max(3000).optional() })).max(12), techStack: z.array(z.string().max(80)).max(30),
  metrics: z.array(z.object({ label: z.string(), value: z.string() })).max(12), featured: z.boolean(), status: z.enum(["DRAFT", "PUBLISHED"]),
  externalUrl: z.string().url().or(z.literal("")), repoUrl: z.string().url().or(z.literal("")),
});


export const contentEntrySchema = z.object({
  type: z.enum(["PRINCIPLE","ADR","ENGINEERING_NOTE","OPEN_SOURCE","CODE_SAMPLE","SPEAKING","RECOMMENDATION","CHANGELOG","USES","NOW","READING_NOTE"]),
  title: z.string().min(2).max(220), slug: z.string().min(1).max(220).regex(/^[a-z0-9-]+$/),
  summary: z.string().max(3000).optional().default(""), content: z.string().max(100000).optional().default(""),
  data: z.record(z.string(), z.unknown()).default({}), status: z.enum(["DRAFT","PUBLISHED","ARCHIVED"]),
  featured: z.boolean().default(false), sortOrder: z.coerce.number().int().min(-100000).max(100000).default(0),
});
