"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

type Provider = "DEFAULT" | "LOCAL" | "S3" | "GOOGLE_DRIVE";

export function MediaUrlInput({ name, defaultValue = "" }: { name: string; defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue || "");
  const [provider, setProvider] = useState<Provider>("DEFAULT");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  async function upload(file: File) {
    setUploading(true);
    try {
      const form = new FormData(); form.set("file", file); if (provider !== "DEFAULT") form.set("provider", provider);
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Upload failed");
      setValue(result.url);
      toast.success("Image uploaded", { description: "Save the record to publish this image." });
    } catch (error) { toast.error("Upload failed", { description: error instanceof Error ? error.message : "Please try again." }); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }
  return <div className="space-y-2">
    <Input name={name} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Upload an image or paste an https:// URL" />
    <div className="flex flex-wrap gap-2">
      <select value={provider} onChange={(e) => setProvider(e.target.value as Provider)} className="h-9 rounded-lg border border-border bg-background px-2 text-xs"><option value="DEFAULT">Default storage</option><option value="LOCAL">Local</option><option value="S3">Amazon S3</option><option value="GOOGLE_DRIVE">Google Drive</option></select>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={(e) => { const file=e.target.files?.[0]; if(file) void upload(file); }} />
      <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}><ImagePlus className="size-4" /> {uploading ? "Uploading…" : "Upload image"}</Button>
    </div>
  </div>;
}
