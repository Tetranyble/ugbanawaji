CREATE TABLE `ai_conversations` (
	`id` varchar(36) NOT NULL,
	`session_hash` varchar(128) NOT NULL,
	`started_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `ai_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_document_chunks` (
	`id` varchar(36) NOT NULL,
	`document_id` varchar(36) NOT NULL,
	`position` int NOT NULL,
	`text` longtext NOT NULL,
	`embedding` json,
	`token_estimate` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	CONSTRAINT `ai_document_chunks_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_chunk_document_position_unique` UNIQUE(`document_id`,`position`)
);
--> statement-breakpoint
CREATE TABLE `ai_documents` (
	`id` varchar(36) NOT NULL,
	`source_type` enum('POST','PROJECT','EXPERIENCE','PRINCIPLE','PROFILE','CONTENT_ENTRY') NOT NULL,
	`source_id` varchar(36) NOT NULL,
	`source_title` varchar(220) NOT NULL,
	`source_url` varchar(700) NOT NULL,
	`content_hash` varchar(128) NOT NULL,
	`embedding_provider` varchar(80),
	`embedding_model` varchar(180),
	`indexed_at` datetime NOT NULL,
	CONSTRAINT `ai_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_document_source_unique` UNIQUE(`source_type`,`source_id`)
);
--> statement-breakpoint
CREATE TABLE `ai_feedback` (
	`id` varchar(36) NOT NULL,
	`message_id` varchar(36) NOT NULL,
	`rating` enum('HELPFUL','NOT_HELPFUL') NOT NULL,
	`comment` text,
	`created_at` datetime NOT NULL,
	CONSTRAINT `ai_feedback_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_feedback_message_unique` UNIQUE(`message_id`)
);
--> statement-breakpoint
CREATE TABLE `ai_index_jobs` (
	`id` varchar(36) NOT NULL,
	`source_type` enum('POST','PROJECT','EXPERIENCE','PRINCIPLE','PROFILE','CONTENT_ENTRY','FULL') NOT NULL,
	`source_id` varchar(36) NOT NULL,
	`action` enum('INDEX','REINDEX','REMOVE','SYNC') NOT NULL DEFAULT 'INDEX',
	`status` enum('PENDING','PROCESSING','COMPLETED','FAILED') NOT NULL DEFAULT 'PENDING',
	`priority` int NOT NULL DEFAULT 50,
	`attempts` int NOT NULL DEFAULT 0,
	`max_attempts` int NOT NULL DEFAULT 5,
	`available_at` datetime NOT NULL,
	`locked_at` datetime,
	`locked_by` varchar(120),
	`last_error` text,
	`content_hash` varchar(128),
	`embedding_provider` varchar(80),
	`embedding_model` varchar(180),
	`started_at` datetime,
	`completed_at` datetime,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `ai_index_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_messages` (
	`id` varchar(36) NOT NULL,
	`conversation_id` varchar(36) NOT NULL,
	`role` enum('USER','ASSISTANT') NOT NULL,
	`content` longtext NOT NULL,
	`citations` json NOT NULL,
	`grounded` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL,
	CONSTRAINT `ai_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` varchar(36) NOT NULL,
	`event_type` varchar(80) NOT NULL,
	`path` varchar(700) NOT NULL,
	`referrer_host` varchar(255),
	`country` varchar(8),
	`session_hash` varchar(128),
	`metadata` json NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`action` varchar(120) NOT NULL,
	`entity` varchar(120) NOT NULL,
	`entity_id` varchar(36),
	`metadata` json NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auth_accounts` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`issuer` varchar(255) NOT NULL,
	`account_id` varchar(255) NOT NULL,
	`provider_id` varchar(255) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`access_token_expires_at` datetime,
	`refresh_token_expires_at` datetime,
	`scope` text,
	`id_token` text,
	`password` varchar(255),
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `auth_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_accounts_issuer_account_unique` UNIQUE(`issuer`,`account_id`)
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` varchar(255) NOT NULL,
	`expires_at` datetime NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	`ip_address` varchar(255),
	`user_agent` text,
	`user_id` varchar(36) NOT NULL,
	CONSTRAINT `auth_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `auth_verifications` (
	`id` varchar(255) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `auth_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(191) NOT NULL,
	`subject` varchar(220),
	`message` longtext NOT NULL,
	`status` enum('NEW','REPLIED','OPPORTUNITY','RECRUITER','COLLABORATION','SPAM','CLOSED') NOT NULL DEFAULT 'NEW',
	`internal_notes` longtext,
	`read_at` datetime,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_entries` (
	`id` varchar(36) NOT NULL,
	`type` enum('PRINCIPLE','ADR','ENGINEERING_NOTE','OPEN_SOURCE','CODE_SAMPLE','SPEAKING','RECOMMENDATION','CHANGELOG','USES','NOW','READING_NOTE') NOT NULL,
	`title` varchar(220) NOT NULL,
	`slug` varchar(220) NOT NULL,
	`summary` text,
	`content` longtext,
	`data` json NOT NULL,
	`status` enum('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`featured` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`published_at` datetime,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `content_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_entries_type_slug_unique` UNIQUE(`type`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `experiences` (
	`id` varchar(36) NOT NULL,
	`company` varchar(220) NOT NULL,
	`role` varchar(220) NOT NULL,
	`location` varchar(160) NOT NULL,
	`start_date` varchar(30) NOT NULL,
	`end_date` varchar(30),
	`current` boolean NOT NULL DEFAULT false,
	`summary` text NOT NULL,
	`highlights` json NOT NULL,
	`impact_areas` json,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `experiences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` varchar(36) NOT NULL,
	`provider` enum('LOCAL','S3','GOOGLE_DRIVE') NOT NULL,
	`filename` varchar(255) NOT NULL,
	`original_name` varchar(255) NOT NULL,
	`mime_type` varchar(120) NOT NULL,
	`size_bytes` bigint unsigned NOT NULL,
	`storage_key` varchar(700) NOT NULL,
	`public_url` varchar(1000) NOT NULL,
	`metadata` json NOT NULL,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `media_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_campaigns` (
	`id` varchar(36) NOT NULL,
	`title` varchar(220) NOT NULL,
	`subject` varchar(220) NOT NULL,
	`preheader` varchar(320),
	`content` longtext NOT NULL,
	`slug` varchar(220),
	`public_archive` boolean NOT NULL DEFAULT false,
	`status` enum('DRAFT','SCHEDULED','SENDING','SENT','PAUSED') NOT NULL DEFAULT 'DRAFT',
	`scheduled_at` datetime,
	`sent_at` datetime,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `newsletter_campaigns_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_campaigns_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_deliveries` (
	`id` varchar(36) NOT NULL,
	`campaign_id` varchar(36) NOT NULL,
	`subscriber_id` varchar(36) NOT NULL,
	`status` enum('PENDING','SENT','FAILED','SKIPPED') NOT NULL DEFAULT 'PENDING',
	`attempts` int NOT NULL DEFAULT 0,
	`last_error` text,
	`message_id` varchar(255),
	`sent_at` datetime,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `newsletter_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_delivery_unique` UNIQUE(`campaign_id`,`subscriber_id`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` varchar(36) NOT NULL,
	`email` varchar(191) NOT NULL,
	`name` varchar(160),
	`status` enum('PENDING','ACTIVE','UNSUBSCRIBED','BOUNCED') NOT NULL DEFAULT 'PENDING',
	`confirmation_token_hash` varchar(128),
	`confirmation_expires_at` datetime,
	`confirmation_sent_at` datetime,
	`confirmed_at` datetime,
	`unsubscribed_at` datetime,
	`source` varchar(120) NOT NULL DEFAULT 'website',
	`preferences` json NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `post_categories` (
	`id` varchar(36) NOT NULL,
	`name` varchar(120) NOT NULL,
	`slug` varchar(140) NOT NULL,
	`description` text,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `post_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `post_categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `post_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `post_category_assignments` (
	`post_id` varchar(36) NOT NULL,
	`category_id` varchar(36) NOT NULL,
	CONSTRAINT `post_category_assignments_post_id_category_id_pk` PRIMARY KEY(`post_id`,`category_id`)
);
--> statement-breakpoint
CREATE TABLE `post_revisions` (
	`id` varchar(36) NOT NULL,
	`post_id` varchar(36) NOT NULL,
	`title` varchar(220) NOT NULL,
	`excerpt` text NOT NULL,
	`content` longtext NOT NULL,
	`content_json` json,
	`metadata` json NOT NULL,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `post_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_series` (
	`id` varchar(36) NOT NULL,
	`title` varchar(220) NOT NULL,
	`slug` varchar(220) NOT NULL,
	`description` text,
	`cover_image` varchar(700),
	`status` enum('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `post_series_id` PRIMARY KEY(`id`),
	CONSTRAINT `post_series_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `post_tag_assignments` (
	`post_id` varchar(36) NOT NULL,
	`tag_id` varchar(36) NOT NULL,
	CONSTRAINT `post_tag_assignments_post_id_tag_id_pk` PRIMARY KEY(`post_id`,`tag_id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` varchar(36) NOT NULL,
	`title` varchar(220) NOT NULL,
	`slug` varchar(220) NOT NULL,
	`excerpt` text NOT NULL,
	`content` longtext NOT NULL,
	`content_json` json,
	`content_format` enum('HTML','MARKDOWN') NOT NULL DEFAULT 'HTML',
	`status` enum('DRAFT','SCHEDULED','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`content_type` enum('ARTICLE','ENGINEERING_NOTE','ADR','SYSTEM_DESIGN','READING_NOTE') NOT NULL DEFAULT 'ARTICLE',
	`series_id` varchar(36),
	`series_order` int NOT NULL DEFAULT 0,
	`cover_image` varchar(700),
	`youtube_url` varchar(700),
	`tags` json NOT NULL,
	`seo_title` varchar(220),
	`seo_description` varchar(320),
	`reading_minutes` int NOT NULL DEFAULT 1,
	`published_at` datetime,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `preview_tokens` (
	`id` varchar(36) NOT NULL,
	`entity_type` enum('POST','PROJECT') NOT NULL,
	`entity_id` varchar(36) NOT NULL,
	`token_hash` varchar(128) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `preview_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `preview_tokens_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `project_revisions` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`snapshot` json NOT NULL,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `project_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` varchar(36) NOT NULL,
	`title` varchar(220) NOT NULL,
	`slug` varchar(220) NOT NULL,
	`kind` varchar(120) NOT NULL,
	`lifecycle_status` enum('PRODUCTION','ACTIVE_DEVELOPMENT','RESEARCH','OPEN_SOURCE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE_DEVELOPMENT',
	`summary` text NOT NULL,
	`problem` longtext,
	`constraints` longtext,
	`challenge` longtext,
	`solution` longtext,
	`architecture` longtext,
	`decisions` longtext,
	`tradeoffs` longtext,
	`implementation` longtext,
	`reliability_security` longtext,
	`impact` longtext,
	`lessons_learned` longtext,
	`what_differently` longtext,
	`confidentiality_note` text,
	`diagrams` json,
	`code_samples` json,
	`tech_stack` json NOT NULL,
	`metrics` json NOT NULL,
	`featured` boolean NOT NULL DEFAULT false,
	`status` enum('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
	`external_url` varchar(500),
	`repo_url` varchar(500),
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `rate_limit_buckets` (
	`id` varchar(191) NOT NULL,
	`hits` int NOT NULL DEFAULT 0,
	`window_started_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `rate_limit_buckets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resume_variants` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`target_role` varchar(220) NOT NULL,
	`summary` text,
	`file_url` varchar(700) NOT NULL,
	`is_default` boolean NOT NULL DEFAULT false,
	`status` enum('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `resume_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `resume_variants_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` varchar(36) NOT NULL,
	`key` varchar(120) NOT NULL,
	`value` json NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `slug_redirects` (
	`id` varchar(36) NOT NULL,
	`entity_type` enum('POST','PROJECT') NOT NULL,
	`from_slug` varchar(220) NOT NULL,
	`to_slug` varchar(220) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `slug_redirects_id` PRIMARY KEY(`id`),
	CONSTRAINT `slug_redirect_entity_from_unique` UNIQUE(`entity_type`,`from_slug`)
);
--> statement-breakpoint
CREATE TABLE `storage_connections` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`provider` enum('GOOGLE_DRIVE') NOT NULL,
	`account_email` varchar(191),
	`refresh_token_encrypted` longtext NOT NULL,
	`scope` text,
	`metadata` json NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `storage_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `storage_connection_user_provider_unique` UNIQUE(`user_id`,`provider`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` varchar(36) NOT NULL,
	`name` varchar(80) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_name_unique` UNIQUE(`name`),
	CONSTRAINT `tags_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(191) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` varchar(700),
	`role` enum('ADMIN') NOT NULL DEFAULT 'ADMIN',
	`theme_preference` enum('SYSTEM','LIGHT','DARK') NOT NULL DEFAULT 'SYSTEM',
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `ai_document_chunks` ADD CONSTRAINT `ai_document_chunks_document_id_ai_documents_id_fk` FOREIGN KEY (`document_id`) REFERENCES `ai_documents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_feedback` ADD CONSTRAINT `ai_feedback_message_id_ai_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `ai_messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_messages` ADD CONSTRAINT `ai_messages_conversation_id_ai_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auth_accounts` ADD CONSTRAINT `auth_accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `newsletter_campaigns` ADD CONSTRAINT `newsletter_campaigns_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `newsletter_deliveries` ADD CONSTRAINT `newsletter_deliveries_campaign_id_newsletter_campaigns_id_fk` FOREIGN KEY (`campaign_id`) REFERENCES `newsletter_campaigns`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `newsletter_deliveries` ADD CONSTRAINT `newsletter_deliveries_subscriber_id_newsletter_subscribers_id_fk` FOREIGN KEY (`subscriber_id`) REFERENCES `newsletter_subscribers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_category_assignments` ADD CONSTRAINT `post_category_assignments_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_category_assignments` ADD CONSTRAINT `post_category_assignments_category_id_post_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `post_categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_revisions` ADD CONSTRAINT `post_revisions_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_revisions` ADD CONSTRAINT `post_revisions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_tag_assignments` ADD CONSTRAINT `post_tag_assignments_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_tag_assignments` ADD CONSTRAINT `post_tag_assignments_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `preview_tokens` ADD CONSTRAINT `preview_tokens_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_revisions` ADD CONSTRAINT `project_revisions_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_revisions` ADD CONSTRAINT `project_revisions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `storage_connections` ADD CONSTRAINT `storage_connections_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ai_conversation_session_idx` ON `ai_conversations` (`session_hash`,`updated_at`);--> statement-breakpoint
CREATE INDEX `ai_chunk_document_idx` ON `ai_document_chunks` (`document_id`);--> statement-breakpoint
CREATE INDEX `ai_document_indexed_idx` ON `ai_documents` (`indexed_at`);--> statement-breakpoint
CREATE INDEX `ai_index_jobs_status_available_idx` ON `ai_index_jobs` (`status`,`available_at`,`priority`);--> statement-breakpoint
CREATE INDEX `ai_index_jobs_source_idx` ON `ai_index_jobs` (`source_type`,`source_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ai_messages_conversation_idx` ON `ai_messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_event_created_idx` ON `analytics_events` (`event_type`,`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_path_created_idx` ON `analytics_events` (`path`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_user_created_idx` ON `audit_logs` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `auth_accounts_user_idx` ON `auth_accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `auth_accounts_provider_idx` ON `auth_accounts` (`provider_id`);--> statement-breakpoint
CREATE INDEX `auth_sessions_user_idx` ON `auth_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `auth_verifications_identifier_idx` ON `auth_verifications` (`identifier`);--> statement-breakpoint
CREATE INDEX `contact_messages_created_idx` ON `contact_messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `content_entries_public_idx` ON `content_entries` (`type`,`status`,`sort_order`);--> statement-breakpoint
CREATE INDEX `experiences_sort_idx` ON `experiences` (`sort_order`);--> statement-breakpoint
CREATE INDEX `media_provider_created_idx` ON `media_assets` (`provider`,`created_at`);--> statement-breakpoint
CREATE INDEX `newsletter_campaigns_status_schedule_idx` ON `newsletter_campaigns` (`status`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `newsletter_delivery_status_idx` ON `newsletter_deliveries` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `newsletter_subscribers_status_idx` ON `newsletter_subscribers` (`status`);--> statement-breakpoint
CREATE INDEX `post_category_post_idx` ON `post_category_assignments` (`post_id`);--> statement-breakpoint
CREATE INDEX `post_category_category_idx` ON `post_category_assignments` (`category_id`);--> statement-breakpoint
CREATE INDEX `post_revisions_post_created_idx` ON `post_revisions` (`post_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `post_series_status_idx` ON `post_series` (`status`);--> statement-breakpoint
CREATE INDEX `post_tag_post_idx` ON `post_tag_assignments` (`post_id`);--> statement-breakpoint
CREATE INDEX `post_tag_tag_idx` ON `post_tag_assignments` (`tag_id`);--> statement-breakpoint
CREATE INDEX `posts_status_published_idx` ON `posts` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `preview_entity_idx` ON `preview_tokens` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `project_revisions_project_created_idx` ON `project_revisions` (`project_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `projects_public_idx` ON `projects` (`status`,`featured`,`sort_order`);--> statement-breakpoint
CREATE INDEX `resume_public_idx` ON `resume_variants` (`status`,`sort_order`);