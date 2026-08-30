# Platform scope

Ugbanawaji is my personal website and publishing system. It is built for the way I present my work and run the site; it is not intended to be a general-purpose portfolio template.

## Portfolio and writing

The public site brings together my experience, case studies, technical writing and current work. It also has dedicated sections for engineering principles, architecture decisions, code samples, open-source work, speaking, recommendations, reading notes and the tools I use.

Case studies can include Mermaid diagrams and selected code samples. When the underlying work is private, the site describes the problem, decisions and outcome without publishing employer code, customer data or confidential system details.

## CMS

The CMS manages the portfolio without requiring code changes. It supports:

- Rich-text editing with TipTap
- Drafts and scheduled publishing
- Categories, tags and article series
- Autosave recovery, revisions and rollback
- Expiring preview links
- Local, Amazon S3 and Google Drive media
- YouTube embeds, Mermaid diagrams and code blocks
- Redirects when a published slug changes
- Résumé variants and availability settings

## Search, newsletter and contact

Search covers material that is already public. The site also keeps its own analytics, newsletter subscribers, campaigns and contact messages in MySQL instead of sending that data to a separate publishing platform.

Public forms use client-side validation for quick feedback and repeat the validation on the server. Rate limits and spam checks protect contact and newsletter submissions.

## Ask Ugbanawaji

Ask Ugbanawaji searches the same public material as the site search and links its answers back to the relevant pages. Drafts, scheduled posts that are not yet due, admin records, contact messages and subscriber data are excluded.

Chat and embeddings can use different providers. The current options are OpenAI, Ollama and OpenAI-compatible servers, including a self-hosted Kimi model for chat. MySQL remains the source for the content index and stored embeddings.

## Background jobs

One scheduler entry point handles newsletter delivery, AI indexing and newly due content. Failed indexing jobs are retried, stale locks can be recovered, and new public material is processed before older work.

The CMS also provides two manual options: rebuild the public index immediately or add a rebuild to the background queue.

## Public and private boundaries

Only published content belongs in public search, feeds and Ask Ugbanawaji. Drafts and private operational data must stay behind the CMS and authenticated server routes.
