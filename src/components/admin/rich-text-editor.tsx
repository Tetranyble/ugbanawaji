"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { TableKit } from "@tiptap/extension-table";
import {
  Bold,
  Code2,
  Columns3,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Plus,
  Quote,
  Redo2,
  Rows3,
  Strikethrough,
  Table2,
  Trash2,
  Underline,
  Undo2,
  Unlink,
  Video as YoutubeIcon,
  GitBranch,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const toolbarButton = "h-9 w-9 p-0";
type Provider = "DEFAULT" | "LOCAL" | "S3" | "GOOGLE_DRIVE";

export function RichTextEditor({
  name,
  jsonName,
  initialHtml = "",
  label = "Content",
  allowYoutube = true,
  emailMode = false,
  editable = true,
  autosaveKey,
}: {
  name: string;
  jsonName?: string;
  initialHtml?: string;
  label?: string;
  allowYoutube?: boolean;
  emailMode?: boolean;
  editable?: boolean;
  autosaveKey?: string;
}) {
  const [html, setHtml] = useState(initialHtml);
  const [json, setJson] = useState("");
  const [provider, setProvider] = useState<Provider>("DEFAULT");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [autosaveAvailable, setAutosaveAvailable] = useState(false);
  const autosaveTimer = useRef<number | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Image.configure({ allowBase64: false, HTMLAttributes: { loading: "lazy" } }),
      Youtube.configure({
        nocookie: true,
        width: 800,
        height: 450,
        HTMLAttributes: { class: "youtube-embed", loading: "lazy" },
      }),
      TableKit.configure({ table: { resizable: true } }),
    ],
    content: initialHtml || "<p></p>",
    onCreate: ({ editor }) => {
      setHtml(editor.getHTML());
      setJson(JSON.stringify(editor.getJSON()));
    },
    onUpdate: ({ editor }) => {
      const nextHtml = editor.getHTML();
      const nextJson = JSON.stringify(editor.getJSON());
      setHtml(nextHtml); setJson(nextJson);
      if (autosaveKey && editable && typeof window !== "undefined") {
        if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
        autosaveTimer.current = window.setTimeout(() => {
          localStorage.setItem(`ugbanawaji:autosave:${autosaveKey}`, JSON.stringify({ html: nextHtml, json: nextJson, savedAt: Date.now() }));
          setAutosaveAvailable(true);
        }, 900);
      }
    },
    editorProps: {
      attributes: {
        class: `tiptap min-h-[420px] px-5 py-4 focus:outline-none ${editable ? "" : "opacity-80"}`,
      },
    },
  });


  useEffect(() => {
    if (!autosaveKey || !editable) return;
    let availabilityTimer: number | null = null;
    try {
      const key = `ugbanawaji:autosave:${autosaveKey}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw) as { html?: string };
        const available = Boolean(saved.html && saved.html !== initialHtml);
        if (!available) localStorage.removeItem(key);
        availabilityTimer = window.setTimeout(
          () => setAutosaveAvailable(available),
          0,
        );
      }
    } catch {}
    return () => {
      if (availabilityTimer) window.clearTimeout(availabilityTimer);
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [autosaveKey, editable, initialHtml]);

  function restoreAutosave() {
    if (!editor || !autosaveKey) return;
    try {
      const raw = localStorage.getItem(`ugbanawaji:autosave:${autosaveKey}`); if (!raw) return;
      const saved = JSON.parse(raw) as { html?: string }; if (!saved.html) return;
      editor.commands.setContent(saved.html);
      toast.success("Local autosave restored");
    } catch { toast.error("Could not restore autosave"); }
  }

  function discardAutosave() {
    if (!autosaveKey) return;
    localStorage.removeItem(`ugbanawaji:autosave:${autosaveKey}`);
    setAutosaveAvailable(false);
    toast.success("Local autosave discarded");
  }

  function addMermaid() {
    if (!editor || !editable) return;
    const value = window.prompt("Mermaid source. Example: flowchart LR\n  A --> B", "flowchart LR\n  A[Request] --> B[Service]\n  B --> C[(Database)]");
    if (!value?.trim()) return;
    editor.chain().focus().setCodeBlock().insertContent(`mermaid\n${value.trim()}`).run();
  }

  function addCodeSample() {
    if (!editor || !editable) return;
    const language = window.prompt("Code language (java, sql, typescript, bash, yaml, php...)", "java"); if (!language) return;
    const code = window.prompt("Paste the code sample"); if (!code?.trim()) return;
    editor.chain().focus().setCodeBlock().insertContent(`language:${language.trim().toLowerCase()}\n${code}`).run();
  }

  async function uploadImage(file: File) {
    if (!editor || !editable) return;
    if (emailMode && !["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      toast.error("Unsupported campaign image", { description: "Use JPEG, PNG or GIF for broad mail-client compatibility." });
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const suggestedAlt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
    const alt = window.prompt("Describe this image for recipients who block images", suggestedAlt);
    if (alt === null) {
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      if (provider !== "DEFAULT") form.set("provider", provider);
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Image upload failed");
      editor.chain().focus().setImage({ src: result.url, alt: alt.trim() || suggestedAlt || "Newsletter image" }).run();
      toast.success("Image uploaded and inserted");
    } catch (error) {
      toast.error("Image upload failed", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function setLink() {
    if (!editor || !editable) return;
    const current = editor.getAttributes("link").href as string | undefined;
    const value = window.prompt("Link URL", current || "https://");
    if (value === null) return;
    if (!value.trim()) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: value.trim(), target: "_blank" }).run();
  }

  function addYoutube() {
    if (!editor || !editable) return;
    const url = window.prompt("YouTube URL");
    if (url?.trim()) editor.chain().focus().setYoutubeVideo({ src: url.trim(), width: 800, height: 450 }).run();
  }

  const disabled = !editable || !editor;
  const inTable = Boolean(editor?.isActive("table"));

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={html} />
      {jsonName ? <input type="hidden" name={jsonName} value={json} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {editable ? (
          <div className="flex items-center gap-2">
          {autosaveAvailable && autosaveKey ? (
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={restoreAutosave}><RotateCcw className="size-3.5"/> Restore autosave</Button>
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={discardAutosave}>Discard</Button>
            </div>
          ) : null}
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value as Provider)}
            className="h-9 rounded-lg border border-border bg-background px-2 text-xs"
            aria-label="Image upload storage provider"
          >
            <option value="DEFAULT">Default storage</option>
            <option value="LOCAL">Local disk</option>
            <option value="S3">Amazon S3</option>
            <option value="GOOGLE_DRIVE">Google Drive</option>
          </select>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Read only</span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-background">
        {editable ? (
          <div className="flex flex-wrap gap-1 border-b border-border bg-muted/40 p-2">
            <Button type="button" variant={editor?.isActive("bold") ? "secondary" : "ghost"} size="icon" className={toolbarButton} aria-label="Bold" disabled={disabled} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold className="size-4" /></Button>
            <Button type="button" variant={editor?.isActive("italic") ? "secondary" : "ghost"} size="icon" className={toolbarButton} aria-label="Italic" disabled={disabled} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic className="size-4" /></Button>
            <Button type="button" variant={editor?.isActive("underline") ? "secondary" : "ghost"} size="icon" className={toolbarButton} aria-label="Underline" disabled={disabled} onClick={() => editor?.chain().focus().toggleUnderline().run()}><Underline className="size-4" /></Button>
            <Button type="button" variant={editor?.isActive("strike") ? "secondary" : "ghost"} size="icon" className={toolbarButton} aria-label="Strike" disabled={disabled} onClick={() => editor?.chain().focus().toggleStrike().run()}><Strikethrough className="size-4" /></Button>
            <Button type="button" variant={editor?.isActive("heading", { level: 2 }) ? "secondary" : "ghost"} size="icon" className={toolbarButton} aria-label="Heading 2" disabled={disabled} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></Button>
            <Button type="button" variant={editor?.isActive("heading", { level: 3 }) ? "secondary" : "ghost"} size="icon" className={toolbarButton} aria-label="Heading 3" disabled={disabled} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></Button>
            <Button type="button" variant={editor?.isActive("bulletList") ? "secondary" : "ghost"} size="icon" className={toolbarButton} aria-label="Bullet list" disabled={disabled} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List className="size-4" /></Button>
            <Button type="button" variant={editor?.isActive("orderedList") ? "secondary" : "ghost"} size="icon" className={toolbarButton} aria-label="Numbered list" disabled={disabled} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></Button>
            <Button type="button" variant={editor?.isActive("blockquote") ? "secondary" : "ghost"} size="icon" className={toolbarButton} aria-label="Blockquote" disabled={disabled} onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></Button>
            <Button type="button" variant={editor?.isActive("codeBlock") ? "secondary" : "ghost"} size="icon" className={toolbarButton} aria-label="Code block" disabled={disabled} onClick={addCodeSample}><Code2 className="size-4" /></Button>
            <Button type="button" variant="ghost" size="icon" className={toolbarButton} aria-label="Insert Mermaid diagram" disabled={disabled} onClick={addMermaid}><GitBranch className="size-4" /></Button>
            <Button type="button" variant={editor?.isActive("link") ? "secondary" : "ghost"} size="icon" className={toolbarButton} aria-label="Set link" disabled={disabled} onClick={setLink}><Link2 className="size-4" /></Button>
            <Button type="button" variant="ghost" size="icon" className={toolbarButton} aria-label="Remove link" disabled={disabled || !editor?.isActive("link")} onClick={() => editor?.chain().focus().extendMarkRange("link").unsetLink().run()}><Unlink className="size-4" /></Button>

            <input
              ref={fileRef}
              type="file"
              accept={emailMode ? "image/jpeg,image/png,image/gif" : "image/jpeg,image/png,image/webp,image/gif,image/avif"}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage(file);
              }}
            />
            <Button type="button" variant="ghost" size="icon" className={toolbarButton} aria-label="Upload image" disabled={disabled || uploading} onClick={() => fileRef.current?.click()}><ImagePlus className="size-4" /></Button>
            {allowYoutube ? <Button type="button" variant="ghost" size="icon" className={toolbarButton} aria-label="Embed YouTube" disabled={disabled} onClick={addYoutube}><YoutubeIcon className="size-4" /></Button> : null}
            <Button type="button" variant={inTable ? "secondary" : "ghost"} size="icon" className={toolbarButton} aria-label="Insert table" disabled={disabled} onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 className="size-4" /></Button>

            {inTable ? (
              <>
                <span className="mx-1 h-8 w-px bg-border" />
                <Button type="button" variant="ghost" size="icon" className={toolbarButton} aria-label="Add row after" onClick={() => editor?.chain().focus().addRowAfter().run()}><Rows3 className="size-4" /><Plus className="-ml-2 -mt-4 size-2.5" /></Button>
                <Button type="button" variant="ghost" size="icon" className={toolbarButton} aria-label="Delete row" onClick={() => editor?.chain().focus().deleteRow().run()}><Rows3 className="size-4" /><Minus className="-ml-2 -mt-4 size-2.5" /></Button>
                <Button type="button" variant="ghost" size="icon" className={toolbarButton} aria-label="Add column after" onClick={() => editor?.chain().focus().addColumnAfter().run()}><Columns3 className="size-4" /><Plus className="-ml-2 -mt-4 size-2.5" /></Button>
                <Button type="button" variant="ghost" size="icon" className={toolbarButton} aria-label="Delete column" onClick={() => editor?.chain().focus().deleteColumn().run()}><Columns3 className="size-4" /><Minus className="-ml-2 -mt-4 size-2.5" /></Button>
                <Button type="button" variant="ghost" size="icon" className={toolbarButton} aria-label="Delete table" onClick={() => editor?.chain().focus().deleteTable().run()}><Trash2 className="size-4" /></Button>
              </>
            ) : null}

            <span className="mx-1 h-8 w-px bg-border" />
            <Button type="button" variant="ghost" size="icon" className={toolbarButton} aria-label="Horizontal rule" disabled={disabled} onClick={() => editor?.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></Button>
            <Button type="button" variant="ghost" size="icon" className={toolbarButton} aria-label="Undo" disabled={disabled} onClick={() => editor?.chain().focus().undo().run()}><Undo2 className="size-4" /></Button>
            <Button type="button" variant="ghost" size="icon" className={toolbarButton} aria-label="Redo" disabled={disabled} onClick={() => editor?.chain().focus().redo().run()}><Redo2 className="size-4" /></Button>
          </div>
        ) : null}
        <EditorContent editor={editor} />
      </div>

      <p className="text-xs text-muted-foreground">
        {allowYoutube
          ? "WYSIWYG editor with headings, language-labelled code, Mermaid diagrams, links, images, tables and privacy-enhanced YouTube embeds."
          : "WYSIWYG editor with headings, code, links, images and tables."}
        {emailMode ? " Campaign images stay remotely hosted; use descriptive alt text because recipients may block them." : ""}
        {editable ? " Uploaded images use the selected storage provider." : ""}
      </p>
    </div>
  );
}
