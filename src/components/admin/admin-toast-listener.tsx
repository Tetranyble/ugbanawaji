"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";

const notices: Record<string, { title: string; description?: string; type?: "success" | "error" | "info" }> = {
  "post-created": { title: "Post created", description: "The new article is ready to edit." },
  "post-updated": { title: "Post updated", description: "Your article changes were saved." },
  "post-deleted": { title: "Post deleted" },
  "project-created": { title: "Project created", description: "The case study is ready to edit." },
  "project-updated": { title: "Project updated", description: "Your case study changes were saved." },
  "project-deleted": { title: "Project deleted" },
  "experience-created": { title: "Experience added" },
  "experience-updated": { title: "Experience updated" },
  "experience-deleted": { title: "Experience deleted" },
  "profile-updated": { title: "Profile updated", description: "Public profile and SEO caches were refreshed." },
  "series-created": { title: "Series created", description: "Add articles to the collection when you are ready." },
  "series-updated": { title: "Series updated" },
  "series-deleted": { title: "Series deleted", description: "Its articles were kept and ungrouped." },
  "resume-created": { title: "Résumé variant created" },
  "resume-updated": { title: "Résumé variant updated" },
  "resume-deleted": { title: "Résumé variant deleted" },
  "availability-updated": { title: "Availability updated", description: "Recruiter-mode settings were saved." },
  "message-read": { title: "Message marked as read" },
  "campaign-created": { title: "Campaign created", description: "The campaign is ready to edit." },
  "campaign-updated": { title: "Campaign updated" },
  "campaign-queued": { title: "Campaign queued", description: "Delivery will run through the newsletter worker." },
  "campaign-retried": { title: "Failed deliveries queued again" },
  "content-created": { title: "Content created" },
  "content-updated": { title: "Content updated" },
  "content-deleted": { title: "Content deleted" },
  "message-updated": { title: "CRM updated", description: "Message status and internal notes were saved." },
  "revision-restored": { title: "Revision restored", description: "The selected previous version is now active." },
  "ai-reindexed": { title: "AI knowledge re-indexed", description: "The public evidence index was rebuilt immediately." },
  "ai-index-queued": { title: "AI re-index queued", description: "The scheduler will process it in the background." },
  "ai-index-retry": { title: "Failed AI jobs queued again" },
  "drive-connected": { title: "Google Drive connected" },
  "drive-disconnected": { title: "Google Drive disconnected" },
  "drive-cancelled": { title: "Google Drive connection cancelled", type: "info" },
  "drive-error": { title: "Google Drive connection failed", description: "Check the OAuth settings and try again.", type: "error" },
};

export function AdminToastListener() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lastNotice = useRef<string | null>(null);
  const notice = searchParams.get("notice") || (searchParams.get("drive") ? `drive-${searchParams.get("drive")}` : null);

  useEffect(() => {
    if (!notice || lastNotice.current === notice) return;
    lastNotice.current = notice;
    const item = notices[notice];
    if (item) {
      const show = item.type === "error" ? toast.error : item.type === "info" ? toast.info : toast.success;
      show(item.title, { description: item.description });
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete("notice");
    next.delete("drive");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [notice, pathname, router, searchParams]);

  return null;
}
