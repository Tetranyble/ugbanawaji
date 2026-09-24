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
CREATE TABLE `ask_starter_prompts` (
	`id` varchar(36) NOT NULL,
	`label` varchar(120) NOT NULL,
	`question` text NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `ask_starter_prompts_id` PRIMARY KEY(`id`)
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
CREATE TABLE `availability_profiles` (
	`id` varchar(36) NOT NULL,
	`visible` boolean NOT NULL DEFAULT true,
	`status` varchar(220) NOT NULL,
	`relocation` text,
	`note` text,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `availability_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `availability_target_roles` (
	`id` varchar(36) NOT NULL,
	`availability_id` varchar(36) NOT NULL,
	`label` varchar(180) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `availability_target_roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `availability_work_modes` (
	`id` varchar(36) NOT NULL,
	`availability_id` varchar(36) NOT NULL,
	`label` varchar(120) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `availability_work_modes_id` PRIMARY KEY(`id`)
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
CREATE TABLE `education_entries` (
	`id` varchar(36) NOT NULL,
	`type` enum('EDUCATION','CERTIFICATION') NOT NULL,
	`title` varchar(240) NOT NULL,
	`institution` varchar(220),
	`year` varchar(40),
	`detail` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `education_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experience_highlights` (
	`id` varchar(36) NOT NULL,
	`experience_id` varchar(36) NOT NULL,
	`body` text NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `experience_highlights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experience_impact_areas` (
	`id` varchar(36) NOT NULL,
	`experience_id` varchar(36) NOT NULL,
	`label` varchar(120) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `experience_impact_areas_id` PRIMARY KEY(`id`)
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
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `experiences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `focus_area_tags` (
	`id` varchar(36) NOT NULL,
	`focus_area_id` varchar(36) NOT NULL,
	`label` varchar(100) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `focus_area_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `focus_areas` (
	`id` varchar(36) NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(80) NOT NULL DEFAULT 'blocks',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `focus_areas_id` PRIMARY KEY(`id`)
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
CREATE TABLE `mixpanel_events` (
	`id` varchar(64) NOT NULL,
	`insert_id` varchar(191) NOT NULL,
	`event_type` varchar(160) NOT NULL,
	`distinct_id_hash` varchar(64),
	`session_hash` varchar(64),
	`path` varchar(700),
	`referrer_host` varchar(255),
	`source` varchar(255),
	`medium` varchar(160),
	`campaign` varchar(255),
	`content` varchar(255),
	`term` varchar(255),
	`country` varchar(8),
	`region` varchar(160),
	`city` varchar(160),
	`browser` varchar(120),
	`operating_system` varchar(120),
	`device` varchar(120),
	`metadata` json NOT NULL,
	`occurred_at` datetime NOT NULL,
	`synced_at` datetime NOT NULL,
	CONSTRAINT `mixpanel_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `mixpanel_event_insert_unique` UNIQUE(`insert_id`)
);
--> statement-breakpoint
CREATE TABLE `navigation_items` (
	`id` varchar(36) NOT NULL,
	`placement` enum('HEADER','MOBILE','FOOTER','HEADER_CTA') NOT NULL,
	`label` varchar(120) NOT NULL,
	`href` varchar(500) NOT NULL,
	`external` boolean NOT NULL DEFAULT false,
	`enabled` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `navigation_items_id` PRIMARY KEY(`id`)
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
CREATE TABLE `page_section_actions` (
	`id` varchar(36) NOT NULL,
	`section_id` varchar(36) NOT NULL,
	`key` varchar(120),
	`label` varchar(160) NOT NULL,
	`href` varchar(700) NOT NULL,
	`variant` enum('PRIMARY','SECONDARY','OUTLINE','GHOST','LINK') NOT NULL DEFAULT 'PRIMARY',
	`external` boolean NOT NULL DEFAULT false,
	`enabled` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `page_section_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_section_items` (
	`id` varchar(36) NOT NULL,
	`section_id` varchar(36) NOT NULL,
	`key` varchar(120),
	`title` varchar(320),
	`subtitle` varchar(320),
	`description` text,
	`value` longtext,
	`href` varchar(700),
	`icon` varchar(80),
	`enabled` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `page_section_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_sections` (
	`id` varchar(36) NOT NULL,
	`page_id` varchar(36) NOT NULL,
	`key` varchar(120) NOT NULL,
	`component` varchar(120) NOT NULL DEFAULT 'RICH_TEXT',
	`eyebrow` varchar(180),
	`title` varchar(320),
	`description` text,
	`body` longtext,
	`enabled` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`item_limit` int,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `page_sections_id` PRIMARY KEY(`id`),
	CONSTRAINT `page_sections_page_key_unique` UNIQUE(`page_id`,`key`)
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
CREATE TABLE `profile_about_paragraphs` (
	`id` varchar(36) NOT NULL,
	`profile_id` varchar(36) NOT NULL,
	`body` text NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `profile_about_paragraphs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_metrics` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`label` varchar(160) NOT NULL,
	`value` varchar(120) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `project_metrics_id` PRIMARY KEY(`id`)
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
CREATE TABLE `project_technologies` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`label` varchar(100) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `project_technologies_id` PRIMARY KEY(`id`)
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
CREATE TABLE `site_pages` (
	`id` varchar(36) NOT NULL,
	`slug` varchar(140) NOT NULL,
	`route` varchar(240) NOT NULL,
	`title` varchar(320) NOT NULL,
	`seo_title` varchar(220),
	`seo_description` varchar(320),
	`status` enum('DRAFT','PUBLISHED') NOT NULL DEFAULT 'PUBLISHED',
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `site_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_pages_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `site_pages_route_unique` UNIQUE(`route`)
);
--> statement-breakpoint
CREATE TABLE `site_profiles` (
	`id` varchar(36) NOT NULL,
	`site_name` varchar(120) NOT NULL,
	`name` varchar(180) NOT NULL,
	`display_name` varchar(160) NOT NULL,
	`location` varchar(180) NOT NULL,
	`email` varchar(191) NOT NULL,
	`phone` varchar(80) NOT NULL,
	`domain` varchar(500) NOT NULL,
	`linkedin` varchar(500) NOT NULL,
	`github` varchar(500) NOT NULL,
	`resume` varchar(700) NOT NULL,
	`portrait` varchar(700) NOT NULL,
	`eyebrow` varchar(180) NOT NULL,
	`headline` varchar(320) NOT NULL,
	`intro` text NOT NULL,
	`current_focus` text NOT NULL,
	`contact_intro` text NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `site_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_profiles_site_name_unique` UNIQUE(`site_name`)
);
--> statement-breakpoint
CREATE TABLE `skill_groups` (
	`id` varchar(36) NOT NULL,
	`title` varchar(160) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `skill_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_items` (
	`id` varchar(36) NOT NULL,
	`group_id` varchar(36) NOT NULL,
	`label` varchar(120) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `skill_items_id` PRIMARY KEY(`id`)
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
ALTER TABLE `availability_target_roles` ADD CONSTRAINT `availability_target_roles_availability_id_availability_profiles_id_fk` FOREIGN KEY (`availability_id`) REFERENCES `availability_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `availability_work_modes` ADD CONSTRAINT `availability_work_modes_availability_id_availability_profiles_id_fk` FOREIGN KEY (`availability_id`) REFERENCES `availability_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `experience_highlights` ADD CONSTRAINT `experience_highlights_experience_id_experiences_id_fk` FOREIGN KEY (`experience_id`) REFERENCES `experiences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `experience_impact_areas` ADD CONSTRAINT `experience_impact_areas_experience_id_experiences_id_fk` FOREIGN KEY (`experience_id`) REFERENCES `experiences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `focus_area_tags` ADD CONSTRAINT `focus_area_tags_focus_area_id_focus_areas_id_fk` FOREIGN KEY (`focus_area_id`) REFERENCES `focus_areas`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `newsletter_campaigns` ADD CONSTRAINT `newsletter_campaigns_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `newsletter_deliveries` ADD CONSTRAINT `newsletter_deliveries_campaign_id_newsletter_campaigns_id_fk` FOREIGN KEY (`campaign_id`) REFERENCES `newsletter_campaigns`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `newsletter_deliveries` ADD CONSTRAINT `newsletter_deliveries_subscriber_id_newsletter_subscribers_id_fk` FOREIGN KEY (`subscriber_id`) REFERENCES `newsletter_subscribers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_section_actions` ADD CONSTRAINT `page_section_actions_section_id_page_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `page_sections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_section_items` ADD CONSTRAINT `page_section_items_section_id_page_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `page_sections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_sections` ADD CONSTRAINT `page_sections_page_id_site_pages_id_fk` FOREIGN KEY (`page_id`) REFERENCES `site_pages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_category_assignments` ADD CONSTRAINT `post_category_assignments_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_category_assignments` ADD CONSTRAINT `post_category_assignments_category_id_post_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `post_categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_revisions` ADD CONSTRAINT `post_revisions_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_revisions` ADD CONSTRAINT `post_revisions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_tag_assignments` ADD CONSTRAINT `post_tag_assignments_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_tag_assignments` ADD CONSTRAINT `post_tag_assignments_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `preview_tokens` ADD CONSTRAINT `preview_tokens_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profile_about_paragraphs` ADD CONSTRAINT `profile_about_paragraphs_profile_id_site_profiles_id_fk` FOREIGN KEY (`profile_id`) REFERENCES `site_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_metrics` ADD CONSTRAINT `project_metrics_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_revisions` ADD CONSTRAINT `project_revisions_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_revisions` ADD CONSTRAINT `project_revisions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_technologies` ADD CONSTRAINT `project_technologies_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_items` ADD CONSTRAINT `skill_items_group_id_skill_groups_id_fk` FOREIGN KEY (`group_id`) REFERENCES `skill_groups`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `storage_connections` ADD CONSTRAINT `storage_connections_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ai_conversation_session_idx` ON `ai_conversations` (`session_hash`,`updated_at`);--> statement-breakpoint
CREATE INDEX `ai_chunk_document_idx` ON `ai_document_chunks` (`document_id`);--> statement-breakpoint
CREATE INDEX `ai_document_indexed_idx` ON `ai_documents` (`indexed_at`);--> statement-breakpoint
CREATE INDEX `ai_index_jobs_status_available_idx` ON `ai_index_jobs` (`status`,`available_at`,`priority`);--> statement-breakpoint
CREATE INDEX `ai_index_jobs_source_idx` ON `ai_index_jobs` (`source_type`,`source_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ai_messages_conversation_idx` ON `ai_messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_event_created_idx` ON `analytics_events` (`event_type`,`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_path_created_idx` ON `analytics_events` (`path`,`created_at`);--> statement-breakpoint
CREATE INDEX `ask_starter_prompts_sort_idx` ON `ask_starter_prompts` (`sort_order`);--> statement-breakpoint
CREATE INDEX `audit_logs_user_created_idx` ON `audit_logs` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `auth_accounts_user_idx` ON `auth_accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `auth_accounts_provider_idx` ON `auth_accounts` (`provider_id`);--> statement-breakpoint
CREATE INDEX `auth_sessions_user_idx` ON `auth_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `auth_verifications_identifier_idx` ON `auth_verifications` (`identifier`);--> statement-breakpoint
CREATE INDEX `availability_target_roles_sort_idx` ON `availability_target_roles` (`availability_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `availability_work_modes_sort_idx` ON `availability_work_modes` (`availability_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `contact_messages_created_idx` ON `contact_messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `content_entries_public_idx` ON `content_entries` (`type`,`status`,`sort_order`);--> statement-breakpoint
CREATE INDEX `education_entries_type_sort_idx` ON `education_entries` (`type`,`sort_order`);--> statement-breakpoint
CREATE INDEX `experience_highlights_experience_sort_idx` ON `experience_highlights` (`experience_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `experience_impact_areas_experience_sort_idx` ON `experience_impact_areas` (`experience_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `experiences_sort_idx` ON `experiences` (`sort_order`);--> statement-breakpoint
CREATE INDEX `focus_area_tags_area_sort_idx` ON `focus_area_tags` (`focus_area_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `focus_areas_sort_idx` ON `focus_areas` (`sort_order`);--> statement-breakpoint
CREATE INDEX `media_provider_created_idx` ON `media_assets` (`provider`,`created_at`);--> statement-breakpoint
CREATE INDEX `mixpanel_event_type_occurred_idx` ON `mixpanel_events` (`event_type`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `mixpanel_event_path_occurred_idx` ON `mixpanel_events` (`path`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `mixpanel_event_country_occurred_idx` ON `mixpanel_events` (`country`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `mixpanel_event_campaign_occurred_idx` ON `mixpanel_events` (`campaign`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `navigation_items_placement_sort_idx` ON `navigation_items` (`placement`,`sort_order`);--> statement-breakpoint
CREATE INDEX `newsletter_campaigns_status_schedule_idx` ON `newsletter_campaigns` (`status`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `newsletter_delivery_status_idx` ON `newsletter_deliveries` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `newsletter_subscribers_status_idx` ON `newsletter_subscribers` (`status`);--> statement-breakpoint
CREATE INDEX `page_section_actions_section_sort_idx` ON `page_section_actions` (`section_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `page_section_items_section_sort_idx` ON `page_section_items` (`section_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `page_section_items_section_key_idx` ON `page_section_items` (`section_id`,`key`);--> statement-breakpoint
CREATE INDEX `page_sections_page_sort_idx` ON `page_sections` (`page_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `post_category_post_idx` ON `post_category_assignments` (`post_id`);--> statement-breakpoint
CREATE INDEX `post_category_category_idx` ON `post_category_assignments` (`category_id`);--> statement-breakpoint
CREATE INDEX `post_revisions_post_created_idx` ON `post_revisions` (`post_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `post_series_status_idx` ON `post_series` (`status`);--> statement-breakpoint
CREATE INDEX `post_tag_post_idx` ON `post_tag_assignments` (`post_id`);--> statement-breakpoint
CREATE INDEX `post_tag_tag_idx` ON `post_tag_assignments` (`tag_id`);--> statement-breakpoint
CREATE INDEX `posts_status_published_idx` ON `posts` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `preview_entity_idx` ON `preview_tokens` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `profile_about_profile_sort_idx` ON `profile_about_paragraphs` (`profile_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `project_metrics_project_sort_idx` ON `project_metrics` (`project_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `project_revisions_project_created_idx` ON `project_revisions` (`project_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `project_technologies_project_sort_idx` ON `project_technologies` (`project_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `projects_public_idx` ON `projects` (`status`,`featured`,`sort_order`);--> statement-breakpoint
CREATE INDEX `resume_public_idx` ON `resume_variants` (`status`,`sort_order`);--> statement-breakpoint
CREATE INDEX `skill_groups_sort_idx` ON `skill_groups` (`sort_order`);--> statement-breakpoint
CREATE INDEX `skill_items_group_sort_idx` ON `skill_items` (`group_id`,`sort_order`);