import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewsletterConfirmedPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const success = status === "success";
  return <main className="section-space"><div className="container-shell max-w-xl"><Card><CardHeader><CardTitle>{success ? "Subscription confirmed" : "Confirmation link unavailable"}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{success ? "You’ll now receive occasional engineering notes when a newsletter is published." : status === "expired" ? "That confirmation link has expired. Subscribe again to receive a new one." : "The confirmation link is invalid or incomplete."}</p><Button asChild className="mt-6"><Link href="/blog">Back to technical writing</Link></Button></CardContent></Card></div></main>;
}
