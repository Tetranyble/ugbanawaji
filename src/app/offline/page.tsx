import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function OfflinePage(){return <main className="section-space"><div className="container-shell max-w-2xl text-center"><WifiOff className="mx-auto size-10 text-primary"/><h1 className="mt-5 text-4xl font-extrabold">You’re offline.</h1><p className="mt-4 leading-7 text-muted-foreground">Previously visited pages may still be available from the local cache. Reconnect to load fresh portfolio content.</p><Button asChild className="mt-7"><Link href="/">Go home</Link></Button></div></main>}
