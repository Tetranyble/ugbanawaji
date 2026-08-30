"use client";

import { useRef, useState } from "react";
import { Check, Copy, FileText, RefreshCcw, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export type MediaItem = {
  id: string;
  originalName: string;
  mimeType: string;
  provider: "LOCAL" | "S3" | "GOOGLE_DRIVE";
  sizeBytes: number;
  createdAt: string;
  url: string;
};

export function MediaManager({ initialItems, driveEmail, defaultProvider = "LOCAL" }: { initialItems: MediaItem[]; driveEmail?: string | null; defaultProvider?: "LOCAL" | "S3" | "GOOGLE_DRIVE" }) {
  const [items, setItems] = useState(initialItems);
  const [provider, setProvider] = useState<"LOCAL" | "S3" | "GOOGLE_DRIVE">(defaultProvider);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    try {
      const form = new FormData(); form.set("file", file); form.set("provider", provider);
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Upload failed");
      const refreshed = await fetch("/api/admin/media", { cache: "no-store" }).then((r) => r.json()) as { items: MediaItem[] };
      setItems(refreshed.items.map((item) => ({ ...item, createdAt: String(item.createdAt) })));
      toast.success("File uploaded", { description: `${file.name} is now available in the media library.` });
    } catch (error) { toast.error("Upload failed", { description: error instanceof Error ? error.message : "Please try again." }); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function remove(id: string) {
    if (!confirm("Delete this media item from its storage provider?")) return;
    const response = await fetch(`/api/admin/media?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) {
      setItems((current) => current.filter((item) => item.id !== id));
      toast.success("Media deleted");
    } else toast.error("Could not delete the media item");
  }

  async function copy(url: string, id: string) {
    const absoluteUrl = new URL(url, window.location.origin).toString();
    try { await navigator.clipboard.writeText(absoluteUrl); setCopied(id); toast.success("Media URL copied"); setTimeout(() => setCopied(null), 1500); }
    catch { window.prompt("Copy media URL", absoluteUrl); }
  }

  return <div>
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <select value={provider} onChange={(e) => setProvider(e.target.value as typeof provider)} className="h-10 rounded-xl border border-border bg-background px-3 text-sm">
        <option value="LOCAL">Local disk</option><option value="S3">Amazon S3</option><option value="GOOGLE_DRIVE">Google Drive{driveEmail ? ` — ${driveEmail}` : ""}</option>
      </select>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf" className="hidden" onChange={(e) => { const file=e.target.files?.[0]; if(file) void upload(file); }} />
      <Button type="button" disabled={busy || (provider === "GOOGLE_DRIVE" && !driveEmail)} onClick={() => fileRef.current?.click()}><Upload className="size-4" /> {busy ? "Uploading…" : "Upload file"}</Button>
      {provider === "GOOGLE_DRIVE" && !driveEmail ? <p className="text-sm text-amber-600 dark:text-amber-400">Connect Google Drive before uploading there.</p> : null}
    </div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => <div key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-[16/10] bg-muted">{item.mimeType.startsWith("image/") ? <img src={item.url} alt={item.originalName} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><FileText className="size-12 text-muted-foreground" /></div>}</div>
        <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{item.originalName}</p><p className="mt-1 text-xs text-muted-foreground">{item.provider} · {(item.sizeBytes/1024).toFixed(0)} KB</p></div><span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold">{item.mimeType.replace("image/", "").replace("application/", "").toUpperCase()}</span></div>
          <div className="mt-4 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => void copy(item.url, item.id)}>{copied===item.id ? <Check className="size-4" /> : <Copy className="size-4" />} {copied===item.id ? "Copied" : "Copy URL"}</Button><Button type="button" size="sm" variant="ghost" onClick={() => void remove(item.id)}><Trash2 className="size-4" /> Delete</Button></div>
        </div>
      </div>)}
      {!items.length ? <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground"><RefreshCcw className="mx-auto mb-3 size-6" />No media uploaded yet.</div> : null}
    </div>
  </div>;
}
