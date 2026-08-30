import Link from "next/link";
import { unsubscribe } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicProfile } from "@/lib/data";

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ id?: string; token?: string; done?: string }> }) {
  const params = await searchParams;
  const profile = await getPublicProfile();
  return <main className="section-space"><div className="container-shell max-w-xl"><Card><CardHeader><CardTitle>Newsletter preferences</CardTitle></CardHeader><CardContent>{params.done ? <><p className="text-muted-foreground">You have been unsubscribed.</p><Button asChild variant="outline" className="mt-6"><Link href="/">Return home</Link></Button></> : <><p className="text-muted-foreground">Confirm that you want to stop receiving {profile.siteName} engineering newsletters.</p><form action={unsubscribe} className="mt-6"><input type="hidden" name="id" value={params.id ?? ""} /><input type="hidden" name="token" value={params.token ?? ""} /><Button type="submit" variant="destructive">Unsubscribe</Button></form></>}</CardContent></Card></div></main>;
}
