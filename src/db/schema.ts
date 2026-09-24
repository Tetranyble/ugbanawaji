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
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [index("experiences_sort_idx").on(table.sortOrder)]
);

export const availabilityProfiles = mysqlTable(
  "availability_profiles",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    visible: boolean("visible").notNull().default(true),
    status: varchar("status", { length: 220 }).notNull(),
    relocation: text("relocation"),
    note: text("note"),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  }
);

export const availabilityTargetRoles = mysqlTable(
  "availability_target_roles",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    availabilityId: varchar("availability_id", { length: 36 }).notNull().references(() => availabilityProfiles.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 180 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (table) => [index("availability_target_roles_sort_idx").on(table.availabilityId, table.sortOrder)]
);

export const availabilityWorkModes = mysqlTable(
  "availability_work_modes",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    availabilityId: varchar("availability_id", { length: 36 }).notNull().references(() => availabilityProfiles.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 120 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (table) => [index("availability_work_modes_sort_idx").on(table.availabilityId, table.sortOrder)]
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

export const mixpanelEvents = mysqlTable(
  "mixpanel_events",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    insertId: varchar("insert_id", { length: 191 }).notNull(),
    eventType: varchar("event_type", { length: 160 }).notNull(),
    distinctIdHash: varchar("distinct_id_hash", { length: 64 }),
    sessionHash: varchar("session_hash", { length: 64 }),
    path: varchar("path", { length: 700 }),
    referrerHost: varchar("referrer_host", { length: 255 }),
    source: varchar("source", { length: 255 }),
    medium: varchar("medium", { length: 160 }),
    campaign: varchar("campaign", { length: 255 }),
    content: varchar("content", { length: 255 }),
    term: varchar("term", { length: 255 }),
    country: varchar("country", { length: 8 }),
    region: varchar("region", { length: 160 }),
    city: varchar("city", { length: 160 }),
    browser: varchar("browser", { length: 120 }),
    operatingSystem: varchar("operating_system", { length: 120 }),
    device: varchar("device", { length: 120 }),
    metadata: json("metadata").$type<Record<string, unknown>>().notNull(),
    occurredAt: datetime("occurred_at", { mode: "date" }).notNull(),
    syncedAt: datetime("synced_at", { mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("mixpanel_event_insert_unique").on(table.insertId),
    index("mixpanel_event_type_occurred_idx").on(table.eventType, table.occurredAt),
    index("mixpanel_event_path_occurred_idx").on(table.path, table.occurredAt),
    index("mixpanel_event_country_occurred_idx").on(table.country, table.occurredAt),
    index("mixpanel_event_campaign_occurred_idx").on(table.campaign, table.occurredAt),
  ]
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

export const siteProfiles = mysqlTable(
  "site_profiles",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    siteName: varchar("site_name", { length: 120 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    location: varchar("location", { length: 180 }).notNull(),
    email: varchar("email", { length: 191 }).notNull(),
    phone: varchar("phone", { length: 80 }).notNull(),
    domain: varchar("domain", { length: 500 }).notNull(),
    linkedin: varchar("linkedin", { length: 500 }).notNull(),
    github: varchar("github", { length: 500 }).notNull(),
    resume: varchar("resume", { length: 700 }).notNull(),
    portrait: varchar("portrait", { length: 700 }).notNull(),
    eyebrow: varchar("eyebrow", { length: 180 }).notNull(),
    headline: varchar("headline", { length: 320 }).notNull(),
    intro: text("intro").notNull(),
    currentFocus: text("current_focus").notNull(),
    contactIntro: text("contact_intro").notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("site_profiles_site_name_unique").on(table.siteName)]
);

export const profileAboutParagraphs = mysqlTable(
  "profile_about_paragraphs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    profileId: varchar("profile_id", { length: 36 }).notNull().references(() => siteProfiles.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [index("profile_about_profile_sort_idx").on(table.profileId, table.sortOrder)]
);

export const sitePages = mysqlTable(
  "site_pages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    slug: varchar("slug", { length: 140 }).notNull(),
    route: varchar("route", { length: 240 }).notNull(),
    title: varchar("title", { length: 320 }).notNull(),
    seoTitle: varchar("seo_title", { length: 220 }),
    seoDescription: varchar("seo_description", { length: 320 }),
    status: mysqlEnum("status", ["DRAFT", "PUBLISHED"]).notNull().default("PUBLISHED"),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("site_pages_slug_unique").on(table.slug), uniqueIndex("site_pages_route_unique").on(table.route)]
);

export const pageSections = mysqlTable(
  "page_sections",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    pageId: varchar("page_id", { length: 36 }).notNull().references(() => sitePages.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 120 }).notNull(),
    component: varchar("component", { length: 120 }).notNull().default("RICH_TEXT"),
    eyebrow: varchar("eyebrow", { length: 180 }),
    title: varchar("title", { length: 320 }),
    description: text("description"),
    body: longtext("body"),
    enabled: boolean("enabled").notNull().default(true),
    sortOrder: int("sort_order").notNull().default(0),
    itemLimit: int("item_limit"),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("page_sections_page_key_unique").on(table.pageId, table.key),
    index("page_sections_page_sort_idx").on(table.pageId, table.sortOrder),
  ]
);

export const pageSectionItems = mysqlTable(
  "page_section_items",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    sectionId: varchar("section_id", { length: 36 }).notNull().references(() => pageSections.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 120 }),
    title: varchar("title", { length: 320 }),
    subtitle: varchar("subtitle", { length: 320 }),
    description: text("description"),
    value: longtext("value"),
    href: varchar("href", { length: 700 }),
    icon: varchar("icon", { length: 80 }),
    enabled: boolean("enabled").notNull().default(true),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (table) => [
    index("page_section_items_section_sort_idx").on(table.sectionId, table.sortOrder),
    index("page_section_items_section_key_idx").on(table.sectionId, table.key),
  ]
);

export const pageSectionActions = mysqlTable(
  "page_section_actions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    sectionId: varchar("section_id", { length: 36 }).notNull().references(() => pageSections.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 120 }),
    label: varchar("label", { length: 160 }).notNull(),
    href: varchar("href", { length: 700 }).notNull(),
    variant: mysqlEnum("variant", ["PRIMARY", "SECONDARY", "OUTLINE", "GHOST", "LINK"]).notNull().default("PRIMARY"),
    external: boolean("external").notNull().default(false),
    enabled: boolean("enabled").notNull().default(true),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (table) => [index("page_section_actions_section_sort_idx").on(table.sectionId, table.sortOrder)]
);

export const focusAreas = mysqlTable(
  "focus_areas",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description").notNull(),
    icon: varchar("icon", { length: 80 }).notNull().default("blocks"),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [index("focus_areas_sort_idx").on(table.sortOrder)]
);

export const focusAreaTags = mysqlTable(
  "focus_area_tags",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    focusAreaId: varchar("focus_area_id", { length: 36 }).notNull().references(() => focusAreas.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 100 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (table) => [index("focus_area_tags_area_sort_idx").on(table.focusAreaId, table.sortOrder)]
);

export const skillGroups = mysqlTable(
  "skill_groups",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 160 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [index("skill_groups_sort_idx").on(table.sortOrder)]
);

export const skillItems = mysqlTable(
  "skill_items",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    groupId: varchar("group_id", { length: 36 }).notNull().references(() => skillGroups.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 120 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (table) => [index("skill_items_group_sort_idx").on(table.groupId, table.sortOrder)]
);

export const educationEntries = mysqlTable(
  "education_entries",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    type: mysqlEnum("type", ["EDUCATION", "CERTIFICATION"]).notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    institution: varchar("institution", { length: 220 }),
    year: varchar("year", { length: 40 }),
    detail: text("detail"),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [index("education_entries_type_sort_idx").on(table.type, table.sortOrder)]
);

export const askStarterPrompts = mysqlTable(
  "ask_starter_prompts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    label: varchar("label", { length: 120 }).notNull(),
    question: text("question").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [index("ask_starter_prompts_sort_idx").on(table.sortOrder)]
);

export const navigationItems = mysqlTable(
  "navigation_items",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    placement: mysqlEnum("placement", ["HEADER", "MOBILE", "FOOTER", "HEADER_CTA"]).notNull(),
    label: varchar("label", { length: 120 }).notNull(),
    href: varchar("href", { length: 500 }).notNull(),
    external: boolean("external").notNull().default(false),
    enabled: boolean("enabled").notNull().default(true),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [index("navigation_items_placement_sort_idx").on(table.placement, table.sortOrder)]
);

export const projectTechnologies = mysqlTable(
  "project_technologies",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    projectId: varchar("project_id", { length: 36 }).notNull().references(() => projects.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 100 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (table) => [index("project_technologies_project_sort_idx").on(table.projectId, table.sortOrder)]
);

export const projectMetrics = mysqlTable(
  "project_metrics",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    projectId: varchar("project_id", { length: 36 }).notNull().references(() => projects.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 160 }).notNull(),
    value: varchar("value", { length: 120 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (table) => [index("project_metrics_project_sort_idx").on(table.projectId, table.sortOrder)]
);

export const experienceHighlights = mysqlTable(
  "experience_highlights",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    experienceId: varchar("experience_id", { length: 36 }).notNull().references(() => experiences.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (table) => [index("experience_highlights_experience_sort_idx").on(table.experienceId, table.sortOrder)]
);

export const experienceImpactAreas = mysqlTable(
  "experience_impact_areas",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    experienceId: varchar("experience_id", { length: 36 }).notNull().references(() => experiences.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 120 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (table) => [index("experience_impact_areas_experience_sort_idx").on(table.experienceId, table.sortOrder)]
);
