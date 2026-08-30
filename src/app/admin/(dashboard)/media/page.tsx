import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { mediaAssets, storageConnections } from "@/db/schema";
import { MediaManager } from "@/components/admin/media-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultStorageProvider } from "@/lib/storage";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ drive?: string }> }) {
  const session = await auth();
  const params = await searchParams;
  const [items, connection] = await Promise.all([
    db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(100),
    session?.user?.id ? db.select().from(storageConnections).where(and(eq(storageConnections.userId, session.user.id), eq(storageConnections.provider, "GOOGLE_DRIVE"))).limit(1) : Promise.resolve([]),
  ]);
  const drive = connection[0];
  return <div className="max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="section-kicker">Assets</p><h1 className="mt-2 text-3xl font-extrabold">Media library</h1><p className="mt-2 max-w-2xl text-muted-foreground">Upload once and use the same image in covers and WYSIWYG articles. Storage is provider-based, so Local, S3 and Google Drive all use the same CMS workflow.</p></div></div>
    <Card className="mt-7"><CardHeader><CardTitle>Google Drive</CardTitle></CardHeader><CardContent className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-medium">{drive ? `Connected${drive.accountEmail ? ` as ${drive.accountEmail}` : ""}` : "Not connected"}</p><p className="mt-1 text-sm text-muted-foreground">The app requests the scoped Drive file permission and stores the refresh token encrypted.</p>{params.drive === "error" ? <p className="mt-2 text-sm text-destructive">Google Drive authorization failed. Check the OAuth client settings and redirect URI.</p> : null}{params.drive === "disconnected" ? <p className="mt-2 text-sm text-muted-foreground">Google Drive was disconnected.</p> : null}</div><div className="flex flex-wrap gap-2"><Button asChild variant={drive ? "outline" : "default"}><a href="/api/admin/storage/google/connect">{drive ? "Reconnect Drive" : "Connect Google Drive"}</a></Button>{drive ? <form action="/api/admin/storage/google/disconnect" method="post"><Button type="submit" variant="ghost">Disconnect</Button></form> : null}</div></CardContent></Card>
    <div className="mt-7"><MediaManager initialItems={items.map((item) => ({ id:item.id, originalName:item.originalName, mimeType:item.mimeType, provider:item.provider, sizeBytes:item.sizeBytes, createdAt:item.createdAt.toISOString(), url:item.publicUrl }))} driveEmail={drive?.accountEmail} defaultProvider={defaultStorageProvider()} /></div>
  </div>;
}
