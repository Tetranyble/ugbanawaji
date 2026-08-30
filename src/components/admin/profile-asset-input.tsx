"use client";

import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export function ProfileAssetInput({
  name,
  label,
  initialValue,
  kind,
}: {
  name: "portrait" | "resume";
  label: string;
  initialValue: string;
  kind: "image" | "pdf";
}) {
  const [value, setValue] = useState(initialValue);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Upload failed");
      setValue(result.url);
      toast.success(kind === "image" ? "Landing page image uploaded" : "CV uploaded", { description: "Save the profile to publish this file." });
    } catch (error) {
      toast.error("Upload failed", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex gap-2">
        <Input id={name} name={name} value={value} onChange={(event) => setValue(event.target.value)} />
        <input
          ref={fileRef}
          type="file"
          accept={kind === "image" ? "image/jpeg,image/png,image/webp,image/gif,image/avif" : "application/pdf"}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" /> {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
      {kind === "image" && value ? (
        <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-border bg-muted">
          <img src={value} alt="Landing page preview" className="h-full w-full object-cover" />
        </div>
      ) : null}
      {kind === "pdf" && value ? (
        <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <FileText className="size-4" /> Open current CV
        </a>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Upload a {kind === "image" ? "landing-page image" : "PDF résumé"}, then save the profile to publish it.
      </p>
    </div>
  );
}
