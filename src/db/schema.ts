import {
  bigint,
  boolean,
  datetime,
  index,
  int,
  json,
  longtext,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 191 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: varchar("image", { length: 700 }),
    role: mysqlEnum("role", ["ADMIN"]).notNull().default("ADMIN"),
    themePreference: mysqlEnum("theme_preference", ["SYSTEM", "LIGHT", "DARK"]).notNull().default("SYSTEM"),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)]
);

export const authSessions = mysqlTable(
  "auth_sessions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
    ipAddress: varchar("ip_address", { length: 255 }),
    userAgent: text("user_agent"),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("auth_sessions_token_unique").on(table.token), index("auth_sessions_user_idx").on(table.userId)]
);

export const authAccounts = mysqlTable(
  "auth_accounts",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    issuer: varchar("issuer", { length: 255 }).notNull(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: datetime("access_token_expires_at", { mode: "date" }),
    refreshTokenExpiresAt: datetime("refresh_token_expires_at", { mode: "date" }),
    scope: text("scope"),
    idToken: text("id_token"),
    password: varchar("password", { length: 255 }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("auth_accounts_issuer_account_unique").on(table.issuer, table.accountId),
    index("auth_accounts_user_idx").on(table.userId),
    index("auth_accounts_provider_idx").on(table.providerId),
  ]
);

export const authVerifications = mysqlTable(
  "auth_verifications",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [index("auth_verifications_identifier_idx").on(table.identifier)]
);

export const posts = mysqlTable(
  "posts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 220 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    excerpt: text("excerpt").notNull(),
    content: longtext("content").notNull(),
    contentJson: json("content_json").$type<Record<string, unknown> | null>(),
    contentFormat: mysqlEnum("content_format", ["HTML", "MARKDOWN"]).notNull().default("HTML"),
    status: mysqlEnum("status", ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]).notNull().default("DRAFT"),
    contentType: mysqlEnum("content_type", ["ARTICLE", "ENGINEERING_NOTE", "ADR", "SYSTEM_DESIGN", "READING_NOTE"]).notNull().default("ARTICLE"),
    seriesId: varchar("series_id", { length: 36 }),
    seriesOrder: int("series_order").notNull().default(0),
    coverImage: varchar("cover_image", { length: 700 }),
    youtubeUrl: varchar("youtube_url", { length: 700 }),
    // Compatibility bridge for the first portfolio schema. New code uses normalized tag tables.
    legacyTags: json("tags").$type<string[]>().notNull(),
    seoTitle: varchar("seo_title", { length: 220 }),
    seoDescription: varchar("seo_description", { length: 320 }),
    readingMinutes: int("reading_minutes").notNull().default(1),
    publishedAt: datetime("published_at", { mode: "date" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("posts_slug_unique").on(table.slug),
    index("posts_status_published_idx").on(table.status, table.publishedAt),
  ]
);

export const postCategories = mysqlTable(
  "post_categories",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    description: text("description"),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("post_categories_name_unique").on(table.name), uniqueIndex("post_categories_slug_unique").on(table.slug)]
);

export const tags = mysqlTable(
  "tags",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("tags_name_unique").on(table.name), uniqueIndex("tags_slug_unique").on(table.slug)]
);

export const postCategoryAssignments = mysqlTable(
  "post_category_assignments",
  {
    postId: varchar("post_id", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
    categoryId: varchar("category_id", { length: 36 }).notNull().references(() => postCategories.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.categoryId] }),
    index("post_category_post_idx").on(table.postId),
    index("post_category_category_idx").on(table.categoryId),
  ]
);

export const postTagAssignments = mysqlTable(
  "post_tag_assignments",
  {
    postId: varchar("post_id", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
    tagId: varchar("tag_id", { length: 36 }).notNull().references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.tagId] }),
    index("post_tag_post_idx").on(table.postId),
    index("post_tag_tag_idx").on(table.tagId),
  ]
);

export const mediaAssets = mysqlTable(
  "media_assets",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    provider: mysqlEnum("provider", ["LOCAL", "S3", "GOOGLE_DRIVE"]).notNull(),
    filename: varchar("filename", { length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number", unsigned: true }).notNull(),
    storageKey: varchar("storage_key", { length: 700 }).notNull(),
    publicUrl: varchar("public_url", { length: 1000 }).notNull(),
    metadata: json("metadata").$type<Record<string, unknown>>().notNull(),
    createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (table) => [index("media_provider_created_idx").on(table.provider, table.createdAt)]
);

export const storageConnections = mysqlTable(
  "storage_connections",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    provider: mysqlEnum("provider", ["GOOGLE_DRIVE"]).notNull(),
    accountEmail: varchar("account_email", { length: 191 }),
    refreshTokenEncrypted: longtext("refresh_token_encrypted").notNull(),
    scope: text("scope"),
    metadata: json("metadata").$type<Record<string, unknown>>().notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("storage_connection_user_provider_unique").on(table.userId, table.provider)]
);

export const newsletterSubscribers = mysqlTable(
  "newsletter_subscribers",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 191 }).notNull(),
    name: varchar("name", { length: 160 }),
    status: mysqlEnum("status", ["PENDING", "ACTIVE", "UNSUBSCRIBED", "BOUNCED"]).notNull().default("PENDING"),
    confirmationTokenHash: varchar("confirmation_token_hash", { length: 128 }),
    confirmationExpiresAt: datetime("confirmation_expires_at", { mode: "date" }),
    confirmationSentAt: datetime("confirmation_sent_at", { mode: "date" }),
    confirmedAt: datetime("confirmed_at", { mode: "date" }),
    unsubscribedAt: datetime("unsubscribed_at", { mode: "date" }),
    source: varchar("source", { length: 120 }).notNull().default("website"),
    preferences: json("preferences").$type<Record<string, unknown>>().notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("newsletter_subscribers_email_unique").on(table.email), index("newsletter_subscribers_status_idx").on(table.status)]
);

export const newsletterCampaigns = mysqlTable(
  "newsletter_campaigns",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 220 }).notNull(),
    subject: varchar("subject", { length: 220 }).notNull(),
    preheader: varchar("preheader", { length: 320 }),
    content: longtext("content").notNull(),
    slug: varchar("slug", { length: 220 }),
    publicArchive: boolean("public_archive").notNull().default(false),
    status: mysqlEnum("status", ["DRAFT", "SCHEDULED", "SENDING", "SENT", "PAUSED"]).notNull().default("DRAFT"),
    scheduledAt: datetime("scheduled_at", { mode: "date" }),
    sentAt: datetime("sent_at", { mode: "date" }),
    createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("newsletter_campaigns_slug_unique").on(table.slug), index("newsletter_campaigns_status_schedule_idx").on(table.status, table.scheduledAt)]
);

export const newsletterDeliveries = mysqlTable(
  "newsletter_deliveries",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    campaignId: varchar("campaign_id", { length: 36 }).notNull().references(() => newsletterCampaigns.id, { onDelete: "cascade" }),
    subscriberId: varchar("subscriber_id", { length: 36 }).notNull().references(() => newsletterSubscribers.id, { onDelete: "cascade" }),
    status: mysqlEnum("status", ["PENDING", "SENT", "FAILED", "SKIPPED"]).notNull().default("PENDING"),
    attempts: int("attempts").notNull().default(0),
    lastError: text("last_error"),
    messageId: varchar("message_id", { length: 255 }),
    sentAt: datetime("sent_at", { mode: "date" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("newsletter_delivery_unique").on(table.campaignId, table.subscriberId),
    index("newsletter_delivery_status_idx").on(table.status, table.createdAt),
  ]
);

export const projects = mysqlTable(
  "projects",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 220 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    kind: varchar("kind", { length: 120 }).notNull(),
    lifecycleStatus: mysqlEnum("lifecycle_status", ["PRODUCTION", "ACTIVE_DEVELOPMENT", "RESEARCH", "OPEN_SOURCE", "ARCHIVED"]).notNull().default("ACTIVE_DEVELOPMENT"),
    summary: text("summary").notNull(),
    problem: longtext("problem"),
    constraints: longtext("constraints"),
    challenge: longtext("challenge"),
    solution: longtext("solution"),
    architecture: longtext("architecture"),
    decisions: longtext("decisions"),
    tradeoffs: longtext("tradeoffs"),
    implementation: longtext("implementation"),
    reliabilitySecurity: longtext("reliability_security"),
    impact: longtext("impact"),
    lessonsLearned: longtext("lessons_learned"),
    whatDifferently: longtext("what_differently"),
    confidentialityNote: text("confidentiality_note"),
    diagrams: json("diagrams").$type<Array<{ title: string; mermaid: string }>>(),
    codeSamples: json("code_samples").$type<Array<{ title: string; language: string; code: string; explanation?: string }>>(),
    techStack: json("tech_stack").$type<string[]>().notNull(),
    metrics: json("metrics").$type<Array<{ label: string; value: string }>>().notNull(),
    featured: boolean("featured").notNull().default(false),
    status: mysqlEnum("status", ["DRAFT", "PUBLISHED"]).notNull().default("DRAFT"),
    externalUrl: varchar("external_url", { length: 500 }),
    repoUrl: varchar("repo_url", { length: 500 }),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("projects_slug_unique").on(table.slug),
    index("projects_public_idx").on(table.status, table.featured, table.sortOrder),
  ]
);

export const experiences = mysqlTable(
  "experiences",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    company: varchar("company", { length: 220 }).notNull(),
    role: varchar("role", { length: 220 }).notNull(),
    location: varchar("location", { length: 160 }).notNull(),
    startDate: varchar("start_date", { length: 30 }).notNull(),
    endDate: varchar("end_date", { length: 30 }),
    current: boolean("current").notNull().default(false),
    summary: text("summary").notNull(),
    highlights: json("highlights").$type<string[]>().notNull(),
    impactAreas: json("impact_areas").$type<string[]>(),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [index("experiences_sort_idx").on(table.sortOrder)]
);

export const siteSettings = mysqlTable(
  "site_settings",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    key: varchar("key", { length: 120 }).notNull(),
    value: json("value").$type<Record<string, unknown>>().notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("site_settings_key_unique").on(table.key)]
);

export const contactMessages = mysqlTable(
  "contact_messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 191 }).notNull(),
    subject: varchar("subject", { length: 220 }),
    message: longtext("message").notNull(),
    status: mysqlEnum("status", ["NEW", "REPLIED", "OPPORTUNITY", "RECRUITER", "COLLABORATION", "SPAM", "CLOSED"]).notNull().default("NEW"),
    internalNotes: longtext("internal_notes"),
    readAt: datetime("read_at", { mode: "date" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [index("contact_messages_created_idx").on(table.createdAt)]
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    action: varchar("action", { length: 120 }).notNull(),
    entity: varchar("entity", { length: 120 }).notNull(),
    entityId: varchar("entity_id", { length: 36 }),
    metadata: json("metadata").$type<Record<string, unknown>>().notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (table) => [index("audit_logs_user_created_idx").on(table.userId, table.createdAt)]
);


export const postSeries = mysqlTable(
  "post_series",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 220 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    description: text("description"),
    coverImage: varchar("cover_image", { length: 700 }),
    status: mysqlEnum("status", ["DRAFT", "PUBLISHED"]).notNull().default("DRAFT"),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("post_series_slug_unique").on(table.slug), index("post_series_status_idx").on(table.status)]
);

export const contentEntries = mysqlTable(
  "content_entries",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    type: mysqlEnum("type", ["PRINCIPLE", "ADR", "ENGINEERING_NOTE", "OPEN_SOURCE", "CODE_SAMPLE", "SPEAKING", "RECOMMENDATION", "CHANGELOG", "USES", "NOW", "READING_NOTE"]).notNull(),
    title: varchar("title", { length: 220 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    summary: text("summary"),
    content: longtext("content"),
    data: json("data").$type<Record<string, unknown>>().notNull(),
    status: mysqlEnum("status", ["DRAFT", "PUBLISHED", "ARCHIVED"]).notNull().default("DRAFT"),
    featured: boolean("featured").notNull().default(false),
    sortOrder: int("sort_order").notNull().default(0),
    publishedAt: datetime("published_at", { mode: "date" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("content_entries_type_slug_unique").on(table.type, table.slug),
    index("content_entries_public_idx").on(table.type, table.status, table.sortOrder),
  ]
);

export const postRevisions = mysqlTable(
  "post_revisions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    postId: varchar("post_id", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 220 }).notNull(),
    excerpt: text("excerpt").notNull(),
    content: longtext("content").notNull(),
    contentJson: json("content_json").$type<Record<string, unknown> | null>(),
    metadata: json("metadata").$type<Record<string, unknown>>().notNull(),
    createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (table) => [index("post_revisions_post_created_idx").on(table.postId, table.createdAt)]
);

export const previewTokens = mysqlTable(
  "preview_tokens",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    entityType: mysqlEnum("entity_type", ["POST", "PROJECT"]).notNull(),
    entityId: varchar("entity_id", { length: 36 }).notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("preview_tokens_hash_unique").on(table.tokenHash), index("preview_entity_idx").on(table.entityType, table.entityId)]
);

export const slugRedirects = mysqlTable(
  "slug_redirects",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    entityType: mysqlEnum("entity_type", ["POST", "PROJECT"]).notNull(),
    fromSlug: varchar("from_slug", { length: 220 }).notNull(),
    toSlug: varchar("to_slug", { length: 220 }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("slug_redirect_entity_from_unique").on(table.entityType, table.fromSlug)]
);

export const resumeVariants = mysqlTable(
  "resume_variants",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    targetRole: varchar("target_role", { length: 220 }).notNull(),
    summary: text("summary"),
    fileUrl: varchar("file_url", { length: 700 }).notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    status: mysqlEnum("status", ["DRAFT", "PUBLISHED"]).notNull().default("DRAFT"),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("resume_variants_slug_unique").on(table.slug), index("resume_public_idx").on(table.status, table.sortOrder)]
);

export const analyticsEvents = mysqlTable(
  "analytics_events",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    eventType: varchar("event_type", { length: 80 }).notNull(),
    path: varchar("path", { length: 700 }).notNull(),
    referrerHost: varchar("referrer_host", { length: 255 }),
    country: varchar("country", { length: 8 }),
    sessionHash: varchar("session_hash", { length: 128 }),
    metadata: json("metadata").$type<Record<string, unknown>>().notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (table) => [index("analytics_event_created_idx").on(table.eventType, table.createdAt), index("analytics_path_created_idx").on(table.path, table.createdAt)]
);

export const rateLimitBuckets = mysqlTable(
  "rate_limit_buckets",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    hits: int("hits").notNull().default(0),
    windowStartedAt: datetime("window_started_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  }
);

export const aiDocuments = mysqlTable(
  "ai_documents",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    sourceType: mysqlEnum("source_type", ["POST", "PROJECT", "EXPERIENCE", "PRINCIPLE", "PROFILE", "CONTENT_ENTRY"]).notNull(),
    sourceId: varchar("source_id", { length: 36 }).notNull(),
    sourceTitle: varchar("source_title", { length: 220 }).notNull(),
    sourceUrl: varchar("source_url", { length: 700 }).notNull(),
    contentHash: varchar("content_hash", { length: 128 }).notNull(),
    embeddingProvider: varchar("embedding_provider", { length: 80 }),
    embeddingModel: varchar("embedding_model", { length: 180 }),
    indexedAt: datetime("indexed_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("ai_document_source_unique").on(table.sourceType, table.sourceId), index("ai_document_indexed_idx").on(table.indexedAt)]
);

export const aiDocumentChunks = mysqlTable(
  "ai_document_chunks",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    documentId: varchar("document_id", { length: 36 }).notNull().references(() => aiDocuments.id, { onDelete: "cascade" }),
    position: int("position").notNull(),
    text: longtext("text").notNull(),
    embedding: json("embedding").$type<number[] | null>(),
    tokenEstimate: int("token_estimate").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("ai_chunk_document_position_unique").on(table.documentId, table.position), index("ai_chunk_document_idx").on(table.documentId)]
);

export const aiIndexJobs = mysqlTable(
  "ai_index_jobs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    sourceType: mysqlEnum("source_type", ["POST", "PROJECT", "EXPERIENCE", "PRINCIPLE", "PROFILE", "CONTENT_ENTRY", "FULL"]).notNull(),
    sourceId: varchar("source_id", { length: 36 }).notNull(),
    action: mysqlEnum("action", ["INDEX", "REINDEX", "REMOVE", "SYNC"]).notNull().default("INDEX"),
    status: mysqlEnum("status", ["PENDING", "PROCESSING", "COMPLETED", "FAILED"]).notNull().default("PENDING"),
    priority: int("priority").notNull().default(50),
    attempts: int("attempts").notNull().default(0),
    maxAttempts: int("max_attempts").notNull().default(5),
    availableAt: datetime("available_at", { mode: "date" }).notNull(),
    lockedAt: datetime("locked_at", { mode: "date" }),
    lockedBy: varchar("locked_by", { length: 120 }),
    lastError: text("last_error"),
    contentHash: varchar("content_hash", { length: 128 }),
    embeddingProvider: varchar("embedding_provider", { length: 80 }),
    embeddingModel: varchar("embedding_model", { length: 180 }),
    startedAt: datetime("started_at", { mode: "date" }),
    completedAt: datetime("completed_at", { mode: "date" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [
    index("ai_index_jobs_status_available_idx").on(table.status, table.availableAt, table.priority),
    index("ai_index_jobs_source_idx").on(table.sourceType, table.sourceId, table.createdAt),
  ]
);

export const aiConversations = mysqlTable(
  "ai_conversations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    sessionHash: varchar("session_hash", { length: 128 }).notNull(),
    startedAt: datetime("started_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [index("ai_conversation_session_idx").on(table.sessionHash, table.updatedAt)]
);

export const aiMessages = mysqlTable(
  "ai_messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    conversationId: varchar("conversation_id", { length: 36 }).notNull().references(() => aiConversations.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["USER", "ASSISTANT"]).notNull(),
    content: longtext("content").notNull(),
    citations: json("citations").$type<Array<{ title: string; url: string }>>().notNull(),
    grounded: boolean("grounded").notNull().default(false),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (table) => [index("ai_messages_conversation_idx").on(table.conversationId, table.createdAt)]
);

export const aiFeedback = mysqlTable(
  "ai_feedback",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    messageId: varchar("message_id", { length: 36 }).notNull().references(() => aiMessages.id, { onDelete: "cascade" }),
    rating: mysqlEnum("rating", ["HELPFUL", "NOT_HELPFUL"]).notNull(),
    comment: text("comment"),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("ai_feedback_message_unique").on(table.messageId)]
);


export const projectRevisions = mysqlTable(
  "project_revisions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    projectId: varchar("project_id", { length: 36 }).notNull().references(() => projects.id, { onDelete: "cascade" }),
    snapshot: json("snapshot").$type<Record<string, unknown>>().notNull(),
    createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (table) => [index("project_revisions_project_created_idx").on(table.projectId, table.createdAt)]
);
